import MongoStore from 'connect-mongo';
import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import passport from 'passport';
import { User } from '../models/user';
import auth from '../routes/auth';
import hikes from '../routes/hikes';
import route from '../routes/route';
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
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: db.getClient(),
    }),
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
    return await User.findById(id);
  },
);

app.use('/route', route);
app.use('/hikes', hikes);
app.use('/auth', auth);
