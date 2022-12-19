import cors from 'cors';
import * as dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import hikes from '../routes/hikes';
import route from '../routes/route';

dotenv.config();

const app = express();
mongoose.set('strictQuery', false);
mongoose.set('debug', true);
mongoose.connect(process.env.DB_URL!);
const db = mongoose.connection;

db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Server connected to the database'));

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

app.listen(8080, () => {
  console.log('Server started at http://localhost:8080');
});

app.use('/route', route);
app.use('/hikes', hikes);
