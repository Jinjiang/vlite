import express from 'express';
import { shared } from '../shared/main.ts'

const app = express();

app.get('/', (_, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log({ shared })
  console.log('Server is running on port 3000');
});
