import express from 'express';
import mongoose from 'mongoose';
import { Trip } from '../models/trip';

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

router.post('/', (req, res) => {});

export default router;
