import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import Settings from "@/models/Settings";
import EmailLog from "@/models/EmailLog";
import nodemailer from "nodemailer";

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

function authCron(req: Request) {
  const key = req.headers.get("x-cron-key") || req.headers.get("X-Cron-Key");
  const expected = process.env.CRON_SECRET;
  return !!expected && key === expected;
}

export async function GET(req: Request) {
  if (!authCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const settings = await Settings.findOne({}).lean().catch(() => null as any);
  const remindersOn = !!settings?.notifications?.reminders;
  const minutes = settings?.notifications?.reminderMinutes ?? 120;
  if (!remindersOn || !minutes || minutes <= 0) {
    return NextResponse.json({ ok: true, message: "Reminders disabled" });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + minutes * 60 * 1000);

  // Fetch events that start within [now, windowEnd]
  const candidates = await Event.find({
    start: { $gte: now.toISOString(), $lte: windowEnd.toISOString() },
  }).lean();

  if (!candidates.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const transporter = createTransport();
  const fromEmail = process.env.EMAIL_USER || "no-reply@example.com";
  const fromName = settings?.emailFromName;
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const replyTo = settings?.emailReplyTo;

  let sent = 0;
  for (const ev of candidates) {
    const already = await EmailLog.findOne({
      type: "reminder",
      to: ev.candidateEmail,
      // same event same start time window
      "payload.eventId": String(ev._id),
    }).lean();
    if (already) continue;

    const when = `${ev.start}${ev.end ? ` - ${ev.end}` : ""}`;
    const subject = `Reminder: Interview ${ev.title}`;
    const text = `This is a reminder for your interview: ${ev.title}. Time: ${when}.`;
    const html = `
      <p>Hello,</p>
      <p>This is a friendly reminder for your upcoming interview.</p>
      <p><strong>Title:</strong> ${ev.title}</p>
      <p><strong>When:</strong> ${when}</p>
      <p>Regards,<br/>Recruitment Team</p>
    `;

    try {
      await transporter.sendMail({ from, to: ev.candidateEmail, subject, text, html, ...(replyTo ? { replyTo } : {}) });
      await EmailLog.create({ to: ev.candidateEmail, subject, type: "reminder", payload: { eventId: String(ev._id), start: ev.start, end: ev.end }, success: true });
      sent += 1;
    } catch (e: any) {
      await EmailLog.create({ to: ev.candidateEmail, subject, type: "reminder", payload: { eventId: String(ev._id), start: ev.start, end: ev.end }, success: false, error: e?.message || String(e) });
    }
  }

  return NextResponse.json({ ok: true, sent });
}
