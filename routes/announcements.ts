import express from 'express';
import { Announcement } from '../models/announcement';
import { isAuthenticated } from './auth';

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

router.post('/', isAuthenticated, async (req, res) => {
  const {
    type,
    title,
    featuresType,
    featuresIds: featuresIdsString,
    reason,
    since,
    until,
    source,
    description,
  } = req.body;

  let featuresIds: number[] = [];
  featuresIdsString.split(',').forEach((id: string) => {
    featuresIds.push(parseInt(id));
  });
  console.log(req.body);
  console.log(featuresIds);

  const announcement = new Announcement({
    type,
    title,
    featuresType,
    featuresIds,
    reason,
    since,
    until,
    source,
    description,
  });

  try {
    const newAnnouncement = await announcement.save();
    return res.status(201).send(newAnnouncement);
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
