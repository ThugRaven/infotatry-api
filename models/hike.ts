import mongoose, { ObjectId, Schema } from 'mongoose';

export interface Segment {
  name: string;
  color: string[];
  distance: number;
  time: number;
  length: number;
  type: string;
  node_id: number;
  trail_id: number;
}

export interface PlannedHike {
  userId: ObjectId;
  query: string;
  name: {
    start: string;
    end: string;
  };
  date: Date;
}

export interface CompletedHike {
  userId: ObjectId;
  query: string;
  name: {
    start: string;
    end: string;
  };
  date: {
    start: Date;
    end: Date;
  };
  distance: number;
  time: number;
  ascent: number;
  descent: number;
  encoded: string;
  elevations: number[];
  segments: Segment[];
  weatherSite: string;
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
    type: {
      type: String,
      required: true,
    },
    node_id: {
      type: Number,
      required: true,
    },
    trail_id: {
      type: Number,
      required: true,
    },
  },
  { autoCreate: false, _id: false },
);

const plannedHikeSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    name: {
      start: {
        type: String,
        required: true,
      },
      end: {
        type: String,
        required: true,
      },
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const completedhikeSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    name: {
      start: {
        type: String,
        default: '',
        required: true,
      },
      end: {
        type: String,
        default: '',
        required: true,
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
    distance: {
      type: Number,
      default: -1,
      required: true,
    },
    time: {
      type: Number,
      default: -1,
      required: true,
    },
    ascent: {
      type: Number,
      default: -1,
      required: true,
    },
    descent: {
      type: Number,
      default: -1,
      required: true,
    },
    encoded: {
      type: String,
      default: '',
      required: true,
    },
    elevations: {
      type: [Number],
      required: true,
    },
    segments: {
      type: [segmentSchema],
      required: true,
    },
    weatherSite: {
      type: String,
      required: true,
      default: '',
    },
  },
  { timestamps: true },
);

export const Segment = mongoose.model<Segment>('Segment', segmentSchema);
export const PlannedHike = mongoose.model<PlannedHike>(
  'PlannedHike',
  plannedHikeSchema,
);
export const CompletedHike = mongoose.model<CompletedHike>(
  'CompletedHike',
  completedhikeSchema,
);
