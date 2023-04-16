import * as dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import z from 'zod';
import { User } from '../models/user';
import { hashPassword } from '../utils/password-utils';

const router = express.Router();
dotenv.config();

router.post('/register', async (req, res) => {
  try {
    const nameSchema = z.string().min(3, {
      message: 'Nazwa użytkownika musi mieć co najmniej 3 znaki!',
    });
    const emailSchema = z
      .string()
      .email({ message: 'Niepoprawny adres email!' });
    const passwordSchema = z
      .string()
      .min(3, { message: 'Hasło musi mieć co najmniej 3 znaki!' });
    const name = nameSchema.parse(req.body.name);
    const email = emailSchema.parse(req.body.email);
    const password = passwordSchema.parse(req.body.password);

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).send({
        status: 400,
        message: 'Użytkownik o podanym adresie email już istnieje!',
      });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      name,
      email,
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
    if (error instanceof z.ZodError) {
      return res.status(400).send({
        status: 400,
        message: error.issues[0].message,
      });
    }

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
      if (info.message === 'User banned') {
        const until = req.body.until;
        const reason = req.body.reason;
        return res.status(400).send({ message: info.message, until, reason });
      }
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
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send({ message: 'Server error' });
      // return next(err);
    }

    return res.status(201).send({ redirect: '/' });
  });
  // req.logout((err) => {
  //   if (err) {
  //     return res.status(500).send({ message: 'Server error' });
  //     // return next(err);
  //   }

  //   return res.status(201).send({ redirect: '/' });
  // });
});

export default router;
