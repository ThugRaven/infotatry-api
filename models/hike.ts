import mongoose from 'mongoose';

export interface Segment {
  name: string;
  color: string[];
  distance: number;
  time: number;
  length: number;
}

export interface Hike {
  query: string;
  name: {
    start: string;
    end: string;
  };
  date: {
    start: Date;
    end: Date;
  };
  ascent: number;
  descent: number;
  encoded: string;
  elevations: number[];
  segments: Segment[];
}

const segmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    color: {
      type: [String],
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    length: {
      type: Number,
      required: true,
    },
  },
  { autoCreate: false, _id: false },
);

const hikeSchema = new mongoose.Schema(
  {
    query: {
      type: String,
      required: true,
    },
    name: {
      start: {
        type: String,
        default: '',
      },
      end: {
        type: String,
        default: '',
      },
    },
    date: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    ascent: {
      type: Number,
      default: 0,
    },
    descent: {
      type: Number,
      default: 0,
    },
    encoded: {
      type: String,
      default: '',
    },
    elevations: {
      type: [Number],
      required: true,
    },
    segments: {
      type: [segmentSchema],
      required: true,
    },
  },
  { timestamps: true },
);

export const Segment = mongoose.model<Segment>('Segment', segmentSchema);
export const Hike = mongoose.model<Hike>('Hike', hikeSchema);
