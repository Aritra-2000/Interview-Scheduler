import mongoose, { Schema, InferSchemaType, models, model } from "mongoose";

const CandidateSchema = new Schema(
  {
    candidateEmail: { type: String, required: true, index: true, lowercase: true, trim: true, unique: true },
    candidateName: { type: String, default: "" },
    notes: { type: String, default: "" },
    createdBy: { type: String, required: true, lowercase: true, trim: true }, // recruiter email
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    doNotEmail: { type: Boolean, default: false },
  },
  { timestamps: true }
);


export type CandidateDoc = InferSchemaType<typeof CandidateSchema> & { _id: mongoose.Types.ObjectId };

export default (models.Candidate as mongoose.Model<CandidateDoc>) || model<CandidateDoc>("Candidate", CandidateSchema);
