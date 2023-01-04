import express from 'express';
import { CompletedHike, PlannedHike } from '../models/hike';
import { User } from '../models/user';
import { isAuthenticated } from './auth';

const router = express.Router();

router.get('/', async (req, res) => {
  console.log(req.session);
  if (req.isAuthenticated()) {
    const user = (await req.user) as User;
    return res.status(200).send({ user });
  }

  return res.status(200).send({ user: null });
});

router.get('/hikes/count', isAuthenticated, async (req, res) => {
  const user = (await req.user) as User;

  const plannedHikes = await PlannedHike.countDocuments({
    userId: user.id,
  });
  const completedHikes = await CompletedHike.countDocuments({
    userId: user.id,
  });

  return res.status(200).send({ plannedHikes, completedHikes });
});

router.get('/hikes/planned', isAuthenticated, async (req, res) => {
  const user = (await req.user) as User;

  const plannedHikes = await PlannedHike.find({
    userId: user.id,
  }).limit(10);

  return res.status(200).send(plannedHikes);
});

router.get('/hikes/completed', isAuthenticated, async (req, res) => {
  const user = (await req.user) as User;

  const completedHikes = await CompletedHike.find({
    userId: user.id,
  }).limit(10);

  return res.status(200).send(completedHikes);
});

export default router;
