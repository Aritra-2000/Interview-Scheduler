import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings, { type ISettings } from "@/models/Settings";
import { auth } from "@/auth";

async function requireRecruiter() {
  const session = await auth();
  const role = (session as any)?.role;
  if (!session || role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  try {
    await connectDB();
    let doc = await Settings.findOne<ISettings>({}).lean();
    if (!doc) {
      // Initialize defaults
      doc = (await Settings.create({}))?.toObject();
    }
    return NextResponse.json(doc);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const unauthorized = await requireRecruiter();
  if (unauthorized) return unauthorized;
  try {
    await connectDB();
    const body = (await req.json()) as Partial<ISettings>;

    // Basic shape guard, ignore unknown fields (server-side whitelist)
    const update: Partial<ISettings> = {};
    if (typeof body.timezone === "string") update.timezone = body.timezone;
    if (Array.isArray(body.workDays)) update.workDays = body.workDays as any;
    if (typeof body.workStart === "string") update.workStart = body.workStart;
    if (typeof body.workEnd === "string") update.workEnd = body.workEnd;
    if (typeof body.defaultDurationMinutes === "number") update.defaultDurationMinutes = body.defaultDurationMinutes;
    if (typeof body.bufferMinutes === "number") update.bufferMinutes = body.bufferMinutes;
    if (typeof body.emailFromName === "string") update.emailFromName = body.emailFromName;
    if (typeof body.emailReplyTo === "string") update.emailReplyTo = body.emailReplyTo;
    if (body.notifications && typeof body.notifications === "object") {
      update.notifications = {
        scheduled: !!body.notifications.scheduled,
        rescheduled: !!body.notifications.rescheduled,
        cancelled: !!body.notifications.cancelled,
        reminders: !!body.notifications.reminders,
        reminderMinutes: typeof body.notifications.reminderMinutes === "number" ? body.notifications.reminderMinutes : 120,
      };
    }

    const updated = await Settings.findOneAndUpdate({}, update, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to update settings" }, { status: 500 });
  }
}
