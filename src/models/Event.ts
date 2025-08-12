import mongoose, { Schema, models, model } from "mongoose";

export interface IEvent {
  title: string;
  start: string; // ISO string
  end?: string;  // ISO string
  candidateEmail: string;
  createdBy?: string; // recruiter email
  createdAt?: Date;
  updatedAt?: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String },
    candidateEmail: { type: String, required: true, lowercase: true, trim: true },
    createdBy: { type: String, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export default (models.Event as mongoose.Model<IEvent>) || model<IEvent>("Event", EventSchema);
