import { NextResponse } from "next/server";
import { auth } from "@/auth";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import Settings from "@/models/Settings";
import Candidate from "@/models/Candidate";

function parseHm(hm: string): number {
  const [hStr, mStr] = (hm || "0:0").split(":");
  const h = Number(hStr || 0);
  const m = Number(mStr || 0);
  return h * 60 + m;
}

export async function GET() {
  const session = await auth();
  await connectDB();
  const role = (session as any)?.role ?? "candidate";
  const email = (session as any)?.user?.email ?? "";
  const query = role === "recruiter" ? {} : { candidateEmail: String(email).toLowerCase() };
  const docs = await Event.find(query).lean();
  const emails = Array.from(new Set(docs.map((d: any) => String(d.candidateEmail).toLowerCase())));
  const cands = await Candidate.find({ candidateEmail: { $in: emails } }).lean().catch(() => [] as any[]);
  const nameByEmail = new Map<string, string>();
  for (const c of cands) nameByEmail.set(String(c.candidateEmail).toLowerCase(), c.candidateName || "");
  const data = docs.map((d: any) => ({
    id: String(d._id),
    title: d.title,
    start: d.start,
    end: d.end,
    candidateEmail: d.candidateEmail,
    candidateName: nameByEmail.get(String(d.candidateEmail).toLowerCase()) || undefined,
  }));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session as any).role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, start, end, candidateEmail, candidateName } = body || {};
  if (!title || !start || !candidateEmail) {
    return NextResponse.json({ error: "Missing required fields: title, start, candidateEmail" }, { status: 400 });
  }

  await connectDB();
  const settings = await Settings.findOne({}).lean().catch(() => null as any);
  const defaultDuration = settings?.defaultDurationMinutes && settings.defaultDurationMinutes > 0 ? settings.defaultDurationMinutes : null;
  const computedEnd = !end && defaultDuration ? new Date(new Date(start).getTime() + defaultDuration * 60 * 1000).toISOString() : end;

  // Validation: end after start
  const startDt = new Date(start);
  const endDt = computedEnd ? new Date(computedEnd) : undefined;
  if (!startDt || isNaN(startDt.getTime())) {
    return NextResponse.json({ error: "Invalid start datetime" }, { status: 400 });
  }
  if (endDt && endDt <= startDt) {
    return NextResponse.json({ error: "End must be after start" }, { status: 400 });
  }

  // Validation: working hours and days using Settings.timezone
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

  // Validation: overlap for same candidate with bufferMinutes
  const buffer = Number(settings?.bufferMinutes || 0);
  const effStart = new Date(startDt.getTime() - buffer * 60 * 1000);
  const effEnd = new Date((endDt ?? new Date(startDt.getTime() + 1)).getTime() + buffer * 60 * 1000);
  const overlap = await Event.findOne({
    candidateEmail: String(candidateEmail).toLowerCase(),
    $or: [
      { start: { $lt: effEnd.toISOString() }, end: { $gt: effStart.toISOString() } }, // typical window overlap when end exists
      // handle events without end by treating start as instant; conflict if same instant within buffer window
      { end: { $exists: false }, start: { $gte: effStart.toISOString(), $lte: effEnd.toISOString() } },
    ],
  }).lean();
  if (overlap) {
    return NextResponse.json({ error: "Overlapping interview for candidate (buffer applied)" }, { status: 409 });
  }
  const created = await Event.create({
    title,
    start,
    end: computedEnd,
    candidateEmail: String(candidateEmail).toLowerCase(),
    createdBy: (session as any)?.user?.email ?? undefined,
  });

  // Ensure a Candidate record exists for this email
  try {
    const lowerEmail = String(candidateEmail).toLowerCase();
    const creator = (session as any)?.user?.email ? String((session as any).user.email).toLowerCase() : undefined;
    const update: any = { $setOnInsert: { candidateEmail: lowerEmail, ...(creator ? { createdBy: creator } : {}) } };
    if (candidateName && String(candidateName).trim()) {
      update.$set = { candidateName: String(candidateName).trim() };
    }
    await Candidate.updateOne({ candidateEmail: lowerEmail }, update, { upsert: true });
  } catch {}

  const item = { id: String(created._id), title, start, end: computedEnd, candidateEmail: String(candidateEmail).toLowerCase() };

  // Send notification email to candidate
  try {
    const allowBySettings = settings?.notifications?.scheduled !== false; // default on
    const cand = await Candidate.findOne({ candidateEmail: item.candidateEmail }).lean().catch(() => null as any);
    const allowByCandidate = !(cand?.doNotEmail);
    if (!allowBySettings || !allowByCandidate) {
      const skipReason = !allowBySettings ? "disabled_by_settings" : "candidate_muted";
      return NextResponse.json({ ok: true, id: item.id, emailSent: false, skipReason });
    }
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
    const transporter = nodemailer.createTransport(transportOptions);

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
    const startStr = fmt.format(new Date(start));
    const endStr = computedEnd ? fmt.format(new Date(computedEnd)) : undefined;

    const html = `
      <p>Hello${cand?.candidateName ? ` ${cand.candidateName}` : ""},</p>
      <p>You have been scheduled for an interview.</p>
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Date/Time:</strong> ${startStr}${endStr ? ` - ${endStr}` : ""}</p>
      <p>Regards,<br/>Recruitment Team</p>
    `;

    await transporter.sendMail({
      from,
      to: candidateEmail,
      subject: `Interview Scheduled: ${title}`,
      text: `Interview scheduled. Title: ${title}. When: ${startStr}${endStr ? ` - ${endStr}` : ""}`,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return NextResponse.json({ ok: true, id: item.id, emailSent: true });
  } catch (err) {
    // Don't fail the request if email fails, but report it
    console.error("Failed to send interview email:", err);
    return NextResponse.json({ ok: true, id: item.id, emailSent: false, skipReason: "send_failed" });
  }

}
