import mongoose, { Document, Schema } from 'mongoose';

export interface Announcement extends Document {
  type: string;
  title: string;
  featuresType: string;
  featuresIds: number[];
  reason: string;
  since: Date | null;
  until: Date | null;
  description: string;
  link: string | null;
  isClosed: boolean;
}

const announcementSchema = new Schema<Announcement>(
  {
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    featuresType: {
      type: String,
      required: true,
    },
    featuresIds: {
      type: [Number],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    since: {
      type: Date,
      default: null,
    },
    until: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: null,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Announcement = mongoose.model<Announcement>(
  'Announcement',
  announcementSchema,
);
