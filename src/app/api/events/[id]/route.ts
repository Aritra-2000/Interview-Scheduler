import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import nodemailer from "nodemailer";
import Settings from "@/models/Settings";
import Candidate from "@/models/Candidate";

function createTransport() {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
  const service = process.env.EMAIL_SERVICE;
  const transportOptions: any = host
    ? { host, port: port ?? 587, secure: (port ?? 587) === 465 }
    : service
    ? { service }
    : {};
  transportOptions.auth = {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  };
  return nodemailer.createTransport(transportOptions);
}

function parseHm(hm: string): number {
  const [hStr, mStr] = (hm || "0:0").split(":");
  const h = Number(hStr || 0);
  const m = Number(mStr || 0);
  return h * 60 + m;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session as any).role !== "recruiter") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = params.id;
  const body = await req.json();
  const { title, start, end, candidateEmail, candidateName } = body || {};

  await connectDB();
  const before = await Event.findById(id).lean();
  const updated = await Event.findByIdAndUpdate(
    id,
    { $set: { ...(title !== undefined ? { title } : {}), ...(start !== undefined ? { start } : {}), ...(end !== undefined ? { end } : {}), ...(candidateEmail !== undefined ? { candidateEmail: String(candidateEmail).toLowerCase() } : {}), } },
    { new: true }
  ).lean();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ensure a Candidate record exists for this email after update
  try {
    const lowerEmail = String(updated.candidateEmail).toLowerCase();
    const creator = (session as any)?.user?.email ? String((session as any).user.email).toLowerCase() : undefined;
    const update: any = { $setOnInsert: { candidateEmail: lowerEmail, ...(creator ? { createdBy: creator } : {}) } };
    if (candidateName && String(candidateName).trim()) {
      update.$set = { candidateName: String(candidateName).trim() };
    }
    await Candidate.updateOne({ candidateEmail: lowerEmail }, update, { upsert: true });
  } catch {}

  // Load settings for validation
  const settings = await Settings.findOne({}).lean().catch(() => null as any);

  // Determine next start/end to validate
  const nextStartStr = (start ?? updated.start) as string;
  const nextEndStr = (end ?? updated.end) as string | undefined;
  const startDt = new Date(nextStartStr);
  const endDt = nextEndStr ? new Date(nextEndStr) : undefined;
  if (!startDt || isNaN(startDt.getTime())) {
    return NextResponse.json({ error: "Invalid start datetime" }, { status: 400 });
  }
  if (endDt && endDt <= startDt) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }

  // Working hours/days check
  if (settings) {
    const tz = settings.timezone || "UTC";
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, weekday: "short", hour: "2-digit", minute: "2-digit" });
    const parts = fmt.formatToParts(startDt);
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const wk = parts.find(p => p.type === "weekday")?.value as keyof typeof dayMap | undefined;
    const hh = Number(parts.find(p => p.type === "hour")?.value || "0");
    const mm = Number(parts.find(p => p.type === "minute")?.value || "0");
    const minutesOfDay = hh * 60 + mm;
    const workStartMin = parseHm(settings.workStart || "00:00");
    const workEndMin = parseHm(settings.workEnd || "23:59");
    const workDays: number[] = Array.isArray(settings.workDays) ? settings.workDays : [1,2,3,4,5];
    const dayOk = wk !== undefined && workDays.includes(dayMap[wk]);
    const timeOk = minutesOfDay >= workStartMin && minutesOfDay <= workEndMin;
    if (!dayOk || !timeOk) {
      return NextResponse.json({ error: "Outside working days/hours" }, { status: 400 });
    }
  }

  // Overlap check excluding current event
  const buffer = Number(settings?.bufferMinutes || 0);
  const effStart = new Date(startDt.getTime() - buffer * 60 * 1000);
  const effEnd = new Date((endDt ?? new Date(startDt.getTime() + 1)).getTime() + buffer * 60 * 1000);
  const overlap = await Event.findOne({
    _id: { $ne: updated._id },
    candidateEmail: String(updated.candidateEmail).toLowerCase(),
    $or: [
      { start: { $lt: effEnd.toISOString() }, end: { $gt: effStart.toISOString() } },
      { end: { $exists: false }, start: { $gte: effStart.toISOString(), $lte: effEnd.toISOString() } },
    ],
  }).lean();
  if (overlap) {
    return NextResponse.json({ error: "Overlapping interview for candidate (buffer applied)" }, { status: 409 });
  }

  // Send reschedule email (or update notice)
  try {
    const settings = await Settings.findOne({}).lean().catch(() => null as any);
    const allowBySettings = settings?.notifications?.rescheduled !== false; // default on
    const cand = await Candidate.findOne({ candidateEmail: String(updated.candidateEmail).toLowerCase() }).lean().catch(() => null as any);
    const allowByCandidate = !(cand?.doNotEmail);
    if (!allowBySettings || !allowByCandidate) {
      const skipReason = !allowBySettings ? "disabled_by_settings" : "candidate_muted";
      return NextResponse.json({ ok: true, emailSent: false, skipReason });
    }
    const transporter = createTransport();
    const to = updated.candidateEmail;
    const fromEmail = process.env.EMAIL_USER || "no-reply@example.com";
    const fromName = settings?.emailFromName;
    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    const replyTo = settings?.emailReplyTo;
    // Friendly datetime formatting in configured timezone
    const tz = settings?.timezone || "Asia/Kolkata";
    const fmt = new Intl.DateTimeFormat("en-IN", {
      timeZone: tz,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
    const oldStartStr = before?.start ? fmt.format(new Date(before.start)) : "";
    const oldEndStr = before?.end ? fmt.format(new Date(before.end)) : undefined;
    const newStartStr = fmt.format(new Date(updated.start));
    const newEndStr = updated.end ? fmt.format(new Date(updated.end)) : undefined;
    const oldWhen = `${oldStartStr}${oldEndStr ? ` - ${oldEndStr}` : ""}`;
    const newWhen = `${newStartStr}${newEndStr ? ` - ${newEndStr}` : ""}`;
    const subject = `Interview Rescheduled: ${updated.title}`;
    const text = `Hello${cand?.candidateName ? ` ${cand.candidateName}` : ""},\nYour interview has been rescheduled.\nPrevious: ${oldWhen}\nNew: ${newWhen}`;
    const html = `
      <p>Hello${cand?.candidateName ? ` ${cand.candidateName}` : ""},</p>
      <p>Your interview has been <strong>rescheduled</strong>.</p>
      <p><strong>Title:</strong> ${updated.title}</p>
      <p><strong>Previous:</strong> ${oldWhen}</p>
      <p><strong>New:</strong> ${newWhen}</p>
      <p>Regards,<br/>Recruitment Team</p>
    `;
    await transporter.sendMail({ from, to, subject, text, html, ...(replyTo ? { replyTo } : {}) });
    return NextResponse.json({ ok: true, emailSent: true });
  } catch (e) {
    console.error("Failed to send reschedule email:", e);
    return NextResponse.json({ ok: true, emailSent: false, skipReason: "send_failed" });
  }

}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session as any).role !== "recruiter") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = params.id;
  await connectDB();
  const doc = await Event.findByIdAndDelete(id).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Send cancellation email
  try {
    const settings = await Settings.findOne({}).lean().catch(() => null as any);
    const allowBySettings = settings?.notifications?.cancelled !== false; // default on
    const cand = await Candidate.findOne({ candidateEmail: String(doc.candidateEmail).toLowerCase() }).lean().catch(() => null as any);
    const allowByCandidate = !(cand?.doNotEmail);
    if (!allowBySettings || !allowByCandidate) {
      const skipReason = !allowBySettings ? "disabled_by_settings" : "candidate_muted";
      return NextResponse.json({ ok: true, emailSent: false, skipReason });
    }
    const transporter = createTransport();
    const to = doc.candidateEmail as string;
    const fromEmail = process.env.EMAIL_USER || "no-reply@example.com";
    const fromName = settings?.emailFromName;
    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    const replyTo = settings?.emailReplyTo;
    // Friendly datetime formatting in configured timezone
    const tz = settings?.timezone || "Asia/Kolkata";
    const fmt = new Intl.DateTimeFormat("en-IN", {
      timeZone: tz,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
    const startStr = fmt.format(new Date(doc.start));
    const endStr = doc.end ? fmt.format(new Date(doc.end)) : undefined;
    const when = `${startStr}${endStr ? ` - ${endStr}` : ""}`;
    const subject = `Interview Cancelled: ${doc.title}`;
    const text = `Hello${cand?.candidateName ? ` ${cand.candidateName}` : ""},\nYour interview has been cancelled. Scheduled time was: ${when}`;
    const html = `
      <p>Hello${cand?.candidateName ? ` ${cand.candidateName}` : ""},</p>
      <p>Your interview has been <strong>cancelled</strong>.</p>
      <p><strong>Title:</strong> ${doc.title}</p>
      <p><strong>When:</strong> ${when}</p>
      <p>Regards,<br/>Recruitment Team</p>
    `;
    await transporter.sendMail({ from, to, subject, text, html, ...(replyTo ? { replyTo } : {}) });
    return NextResponse.json({ ok: true, emailSent: true });
  } catch (e) {
    console.error("Failed to send cancellation email:", e);
    return NextResponse.json({ ok: true, emailSent: false, skipReason: "send_failed" });
  }

}
