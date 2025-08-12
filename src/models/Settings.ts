import mongoose, { Schema, models, model } from "mongoose";

export interface ISettings {
  timezone: string;
  workDays: number[]; // 0-6 (Sun-Sat)
  workStart: string; // HH:mm (24h)
  workEnd: string;   // HH:mm (24h)
  defaultDurationMinutes: number;
  bufferMinutes: number;
  notifications: {
    scheduled: boolean;
    rescheduled: boolean;
    cancelled: boolean;
    reminders: boolean;
    reminderMinutes: number; // e.g., 1440 for 24h
  };
  emailFromName?: string;
  emailReplyTo?: string;
}

const SettingsSchema = new Schema<ISettings>(
  {
    timezone: { type: String, default: "Asia/Kolkata" },
    workDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    workStart: { type: String, default: "10:00" },
    workEnd: { type: String, default: "18:00" },
    defaultDurationMinutes: { type: Number, default: 30 },
    bufferMinutes: { type: Number, default: 0 },
    notifications: {
      scheduled: { type: Boolean, default: true },
      rescheduled: { type: Boolean, default: true },
      cancelled: { type: Boolean, default: true },
      reminders: { type: Boolean, default: false },
      reminderMinutes: { type: Number, default: 120 },
    },
    emailFromName: { type: String },
    emailReplyTo: { type: String },
  },
  { timestamps: true }
);

// Only 1 doc expected; enforce single with dummy key
SettingsSchema.index({ _singleton: 1 }, { unique: true, partialFilterExpression: { _singleton: { $exists: true } } });

export default (models.Settings as mongoose.Model<ISettings>) || model<ISettings>("Settings", SettingsSchema);
