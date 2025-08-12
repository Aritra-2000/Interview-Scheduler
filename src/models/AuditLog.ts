import mongoose, { Schema, models, model } from "mongoose";

export interface IAuditLog {
  actorEmail: string; // recruiter who performed action
  action: string;     // created|updated|deleted|emailed|login|...
  entity: string;     // Event|Candidate|Settings|...
  entityId?: string;
  details?: any;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorEmail: { type: String, lowercase: true, trim: true, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });

export default (models.AuditLog as mongoose.Model<IAuditLog>) || model<IAuditLog>("AuditLog", AuditLogSchema);
