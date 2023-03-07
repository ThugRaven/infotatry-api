import express from 'express';
import { CompletedHike, PlannedHike } from '../models/hike';
import { User } from '../models/user';
import { comparePasswords, hashPassword } from '../utils/password-utils';
import { getPaginationValues } from '../utils/utils';
import { isAuthenticated, isAuthenticatedWithRoles } from './auth';

const router = express.Router();

router.get('/', async (req, res) => {
  console.log(req.session);
  if (req.isAuthenticated()) {
    const user = (await req.user) as User;
    return res.status(200).send({ user });
  }

  return res.status(200).send({ user: null });
});

router.get('/admin', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  return res.status(200).send({ message: 'Ok' });
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

router.get('/hikes/last', isAuthenticated, async (req, res) => {
  const user = (await req.user) as User;

  const plannedHikes = await PlannedHike.find({
    userId: user.id,
  })
    .sort({ createdAt: -1 })
    .limit(5);
  const completedHikes = await CompletedHike.find({
    userId: user.id,
  })
    .sort({ createdAt: -1 })
    .limit(5);

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

router.post('/change_password', isAuthenticated, async (req, res) => {
  const user = (await req.user) as User;
  const currentPassword = req.body.password.current;
  const newPassword = req.body.password.new;
  const confirmPassword = req.body.password.confirm;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).send({ message: 'Missing parameters' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).send({ message: 'Passwords do not match' });
  }

  if (!user.password) {
    return res.status(404).send({ message: "User doesn't have a password" });
  }

  if (await comparePasswords(user.password, currentPassword)) {
    if (await comparePasswords(user.password, newPassword)) {
      return res.status(400).send({ message: 'Password is the same' });
    }
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    const updatedUser = await user.save();
    return res.status(200).send(updatedUser);
  } else {
    return res.status(403).send({ message: 'Incorrect password' });
  }
});

export default router;
