import mongoose, { Schema, models, model } from "mongoose";

export interface IRecruiter {
  email: string;
  name?: string;
  active: boolean;
  roles: string[]; // e.g., ["recruiter", "admin"]
}

const RecruiterSchema = new Schema<IRecruiter>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String },
    active: { type: Boolean, default: true },
    roles: { type: [String], default: ["recruiter"] },
  },
  { timestamps: true }
);

RecruiterSchema.index({ email: 1 }, { unique: true });

export default (models.Recruiter as mongoose.Model<IRecruiter>) || model<IRecruiter>("Recruiter", RecruiterSchema);
