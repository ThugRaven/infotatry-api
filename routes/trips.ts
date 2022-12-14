import express from 'express';
import mongoose from 'mongoose';
import features from '../features.json';
import { Hike, Segment, Trip } from '../models/trip';

const router = express.Router();

router.get('/:id', async (req, res) => {
  const id = req.params.id;

  if (id && mongoose.Types.ObjectId.isValid(id)) {
    let trip = null;
    try {
      trip = await Trip.findById(id);
      if (trip == null) {
        return res.status(404).send({
          status: 404,
          message: 'Trip not found',
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).send({
          status: 500,
          message: error.message,
        });
      }
    }

    return res.status(200).send(trip);
  }

  res.status(400).send({
    status: 400,
    message: 'Invalid trip ID',
  });
});

router.post('/', async (req, res) => {
  const trailsIds = req.body.trails;
  const segments: Segment[] = [];
  if (trailsIds && trailsIds instanceof Array) {
    trailsIds.forEach((id) => {
      const trail = features.trails.find((trail) => trail.id === id);
      if (!trail) {
        return;
      }

      const segment = new Segment({
        name: {
          start: trail.name.start,
          end: trail.name.end,
        },
        color: trail.color,
        distance: trail.distance,
        startEndTime: trail.time.start_end,
        endStartTime: trail.time.end_start,
        encoded: trail.encoded,
      });

      segments.push(segment);
    });
  }

  const hike = new Hike({
    dateStart: req.body.dateStart,
    dateEnd: req.body.dateEnd,
    name: {
      start: 'start',
      end: 'end',
    },
    segments,
  });

  const trip = new Trip({
    dateStart: req.body.dateStart,
    dateEnd: req.body.dateEnd,
    hikes: hike,
  });

  try {
    const newTrip = await trip.save();
    return res.status(201).send(newTrip);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        status: 400,
        message: error.message,
      });
    }
  }
});

export default router;
