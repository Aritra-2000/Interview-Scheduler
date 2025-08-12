import mongoose, { Schema, models, model } from "mongoose";

export interface IEmailLog {
  to: string;
  subject: string;
  type: "scheduled" | "rescheduled" | "cancelled" | "reminder" | string;
  payload?: any; // snapshot of event data
  success: boolean;
  error?: string;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    to: { type: String, lowercase: true, trim: true, required: true },
    subject: { type: String, required: true },
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed },
    success: { type: Boolean, default: true },
    error: { type: String },
  },
  { timestamps: true }
);

EmailLogSchema.index({ createdAt: -1 });

export default (models.EmailLog as mongoose.Model<IEmailLog>) || model<IEmailLog>("EmailLog", EmailLogSchema);
