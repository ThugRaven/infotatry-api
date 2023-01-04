import express from 'express';
import { CompletedHike, PlannedHike } from '../models/hike';
import { User } from '../models/user';
import { getPaginationValues } from '../utils/utils';
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
  const queryPage = req.query.page?.toString();
  const { page, pageSize, offset } = getPaginationValues(queryPage, 10);

  const count = await PlannedHike.countDocuments({ userId: user.id });
  if (offset >= count) {
    return res.status(200).send({ page, pageSize, count, data: [] });
  }
  const plannedHikes = await PlannedHike.find({ userId: user.id })
    .skip(offset)
    .limit(pageSize);

  return res.status(200).send({ page, pageSize, count, data: plannedHikes });
});

router.get('/hikes/completed', isAuthenticated, async (req, res) => {
  const user = (await req.user) as User;
  const queryPage = req.query.page?.toString();
  const { page, pageSize, offset } = getPaginationValues(queryPage, 10);

  const count = await CompletedHike.countDocuments({ userId: user.id });
  if (offset >= count) {
    return res.status(200).send({ page, pageSize, count, data: [] });
  }
  const completedHikes = await CompletedHike.find({ userId: user.id })
    .skip(offset)
    .limit(pageSize);

  return res.status(200).send({ page, pageSize, count, data: completedHikes });
});

export default router;
