import cors from 'cors';
import express from 'express';
import route from '../routes/route';

const app = express();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

app.listen(8080, () => {
  console.log('Server started at http://localhost:8080');
});

app.use('/route', route);
