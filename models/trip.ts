import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
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
  color: {
    type: [String],
    required: true,
  },
  distance: {
    type: Number,
    required: true,
  },
  startEndTime: {
    type: Number,
    required: true,
  },
  endStartTime: {
    type: Number,
    required: true,
  },
  encoded: {
    type: String,
    required: true,
  },
});

const hikeSchema = new mongoose.Schema({
  dateStart: {
    type: Date,
    required: true,
  },
  dateEnd: {
    type: Date,
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
  segments: {
    type: [segmentSchema],
    required: true,
  },
});

const tripSchema = new mongoose.Schema({
  dateStart: {
    type: Date,
    required: true,
  },
  dateEnd: {
    type: Date,
    required: true,
  },
  hikes: {
    type: [hikeSchema],
    required: true,
  },
});

export const Trip = mongoose.model('Trip', tripSchema);
