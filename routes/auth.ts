import express, { NextFunction, Request, Response } from 'express';
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
    passport.authenticate('local');
    return res.status(201).send({ redirect: '/' });

    // return res.status(201).send(user);
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

router.post('/login', passport.authenticate('local'), (req, res) => {
  res.status(201).send({ redirect: '/' });
});

router.get('/login/google', passport.authenticate('google'));

router.get(
  '/login/google/callback',
  passport.authenticate('google', {
    successRedirect: 'http://localhost:3000/',
    failureRedirect: 'http://localhost:3000/login',
  }),
);

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).send({ message: 'Unauthorized' });
};

router.post('/logout', isAuthenticated, (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    return res.status(201).send({ redirect: '/' });
  });
});

router.get('/user', async (req, res) => {
  console.log(req.session);
  if (req.isAuthenticated()) {
    const user = (await req.user) as User;
    return res.status(200).send({ user });
  }

  return res.status(200).send({ user: null });
});

export default router;
