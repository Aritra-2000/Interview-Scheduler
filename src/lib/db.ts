import mongoose from "mongoose";

const MONGODB_URI = process.env.DATABASE_URL as string;

if (!MONGODB_URI) {
  console.warn("DATABASE_URL not set. Using in-memory fallback.");
}

let cached = (global as any).mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise && MONGODB_URI) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: "scheduler" });
  }
  cached.conn = cached.promise ? await cached.promise : null;
  return cached.conn;
}
