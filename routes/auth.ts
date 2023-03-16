import * as dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { User } from '../models/user';
import { hashPassword } from '../utils/password-utils';

const router = express.Router();
dotenv.config();

router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await hashPassword(req.body.password);
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      stats: {
        time: 0,
        distance: 0,
        ascent: 0,
        descent: 0,
      },
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
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).send({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(201).send({ redirect: '/' });
    });
  })(req, res, next);
});

router.get('/login/google', passport.authenticate('google'));

router.get(
  '/login/google/callback',
  passport.authenticate('google', {
    successRedirect: `${process.env.WEB_URL}/`,
    failureRedirect: `${process.env.WEB_URL}/login`,
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

export const isAuthenticatedWithRoles = (neededRoles = ['']) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      const user = (await req.user) as User;
      if (neededRoles.every((role) => user.roles.includes(role))) {
        console.log('User authenticated with sufficient roles');
        return next();
      }

      console.log('User not authenticated due to insufficient permissions');
      return res.status(401).send({ message: 'Insufficient permissions' });
    }

    console.log('User not authenticated');
    res.status(401).send({ message: 'Unauthorized' });
  };
};

router.post('/logout', isAuthenticated, (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send({ message: 'Server error' });
      // return next(err);
    }

    return res.status(201).send({ redirect: '/' });
  });
});

export default router;
