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
import auth from '../routes/auth';
import hikes from '../routes/hikes';
import route from '../routes/route';
import user from '../routes/user';
import weather from '../routes/weather';
import { initializeGoogleStrategy } from '../utils/google';
import { initializePassport } from '../utils/passport';

dotenv.config();

const app = express();
mongoose.set('strictQuery', false);
mongoose.set('debug', true);
mongoose.connect(process.env.DB_URL!);
const db = mongoose.connection;

db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Server connected to the database'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: db.getClient(),
      touchAfter: 24 * 60 * 60, // 24 hours
    }),
    // cookie: {secure: true}
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.listen(8080, () => {
  console.log('Server started at http://localhost:8080');
});

initializePassport(
  passport,
  async (email: string) => {
    return await User.findOne({ email });
  },
  async (id: string) => {
    return await User.findById(id).select({ password: 0 });
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
