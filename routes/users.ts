import express from 'express';
import { User } from '../models/user';
import { getPaginationValues } from '../utils/utils';
import { isAuthenticatedWithRoles } from './auth';

const router = express.Router();

router.get('/', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const queryPage = req.query.page?.toString();
  const { page, pageSize, offset } = getPaginationValues(queryPage, 10);
  const count = await User.countDocuments();

  if (offset >= count) {
    return res.status(200).send({ page, pageSize, count, data: [] });
  }
  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(pageSize);

  return res.status(200).send({ page, pageSize, count, data: users });
});

router.post(
  '/ban/:id',
  isAuthenticatedWithRoles(['admin']),
  async (req, res) => {
    const id = req.params.id;
    const { duration, reason } = req.body;
    const user = await User.findById(id);
    console.log(duration, reason);

    if (user) {
      user.ban.duration = duration;
      user.ban.bannedAt = new Date();
      user.ban.reason = reason;
      const updatedUser = await user.save();

      return res.status(200).send(updatedUser);
    }

    return res.status(404).send({
      message: 'User not found',
    });
  },
);

router.post(
  '/unban/:id',
  isAuthenticatedWithRoles(['admin']),
  async (req, res) => {
    const id = req.params.id;
    const user = await User.findById(id);

    if (user) {
      user.ban.duration = null;
      user.ban.bannedAt = null;
      user.ban.reason = undefined;
      const updatedUser = await user.save();

      return res.status(200).send(updatedUser);
    }

    return res.status(404).send({
      message: 'User not found',
    });
  },
);

router.put('/:id', isAuthenticatedWithRoles(['admin']), async (req, res) => {
  const id = req.params.id;
  const { name, email, image } = req.body;
  const user = await User.findById(id);

  if (user) {
    user.name = name;
    user.email = email;
    if (image) {
      user.image = image;
    }
    const updatedUser = await user.save();

    return res.status(200).send(updatedUser);
  }

  return res.status(404).send({
    message: 'User not found',
  });
});

export default router;
