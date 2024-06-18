import MongoStore from 'connect-mongo';
import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import passport from 'passport';
import { Profile } from 'passport-google-oauth20';
import { Account } from '../models/account';
import { User } from '../models/user';
import announcements from '../routes/announcements';
import auth from '../routes/auth';
import avalanches from '../routes/avalanches';
import hikes from '../routes/hikes';
import route from '../routes/route';
import user from '../routes/user';
import users from '../routes/users';
import weather from '../routes/weather';
import { initializeGoogleStrategy } from '../utils/google';
import { initializePassport } from '../utils/passport';

dotenv.config();

const app = express();
mongoose.set('strictQuery', false);
mongoose.set('debug', true);
mongoose.connect(process.env.DB_URL!);
export const db = mongoose.connection;

db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Server connected to the database'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: process.env.WEB_URL,
    credentials: true,
  }),
);
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    unset: 'destroy',
    proxy: process.env.NODE_ENV === 'production',
    store: MongoStore.create({
      client: db.getClient(),
      touchAfter: 24 * 60 * 60, // 24 hours
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : undefined,
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server started at ${process.env.SERVER_URL}`);
});

initializePassport(
  passport,
  async (email: string) => {
    console.log('get user by email');
    return await User.findOne({ email });
  },
  async (id: string) => {
    console.log('get user by id');
    return await User.findById(id);
  },
);

initializeGoogleStrategy(
  passport,
  async (provider: string, id: string) => {
    console.log('find account');
    return await Account.findOne({ provider, providerId: id });
  },
  async (profile: Profile) => {
    console.log('create user');
    const newUser = new User({
      name: profile.displayName,
      email: profile.emails ? profile.emails[0].value : '',
      image: profile.photos ? profile.photos[0].value : '',
      stats: {
        time: 0,
        distance: 0,
        ascent: 0,
        descent: 0,
      },
    });

    try {
      const user = await newUser.save();
      return user;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        return null;
      }
      return null;
    }
  },
  async (provider: string, providerId: string, userId: string) => {
    console.log('create account');
    const newAccount = new Account({
      provider,
      providerId,
      userId,
    });

    try {
      const account = await newAccount.save();
      return account;
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        return null;
      }
      return null;
    }
  },
  async (id: string) => {
    console.log('find user');
    return await User.findById(id);
  },
);

app.use('/route', route);
app.use('/hikes', hikes);
app.use('/auth', auth);
app.use('/user', user);
app.use('/weather', weather);
app.use('/announcements', announcements);
app.use('/users', users);
app.use('/avalanches', avalanches);
