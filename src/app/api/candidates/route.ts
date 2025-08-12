import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Candidate from "@/models/Candidate";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session as any).role !== "recruiter") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null as any);
  const candidateEmail = String(body?.candidateEmail || "").trim().toLowerCase();
  if (!candidateEmail) return NextResponse.json({ error: "candidateEmail required" }, { status: 400 });

  const update: any = { candidateEmail };
  if (typeof body?.candidateName === "string") update.candidateName = body.candidateName;
  if (typeof body?.doNotEmail === "boolean") update.doNotEmail = body.doNotEmail;
  if (!(session as any)?.user?.email) return NextResponse.json({ error: "actor missing" }, { status: 400 });
  update.createdBy = (session as any).user.email.toLowerCase();

  await connectDB();
  const saved = await Candidate.findOneAndUpdate(
    { candidateEmail },
    { $setOnInsert: { createdBy: update.createdBy }, $set: update },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(saved);
}
