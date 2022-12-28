import express from 'express';
import passport from 'passport';
import { User } from '../models/user';
import { hashPassword } from '../utils/password-utils';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.password);
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    return res.status(201).send(user);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({
        status: 400,
        message: error.message,
      });
    }
  }

  return res.status(200).send();
});

router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: process.env.WEB_URL + '/',
    failureRedirect: process.env.WEB_URL + '/login',
  }),
);

export default router;
