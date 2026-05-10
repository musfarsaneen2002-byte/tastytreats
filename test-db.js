import express from 'express';
import db from './database.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

console.log('Server loaded');

app.post('/api/auth/login', (req, res) => {
  console.log('LOGIN called');
  res.json({ success: true });
});

app.listen(3004, () => console.log('on 3004'));
