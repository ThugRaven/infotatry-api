import express from 'express';
import { Announcement } from '../models/announcement';

const router = express.Router();

router.get('/closures', async (req, res) => {
  const announcements = await Announcement.find({
    type: 'closure',
    isClosed: false,
  });

  return res.status(200).send(announcements);
});

router.get('/history', async (req, res) => {
  const announcements = await Announcement.find();

  return res.status(200).send(announcements);
});

export default router;
