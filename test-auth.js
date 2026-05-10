import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

console.log('Starting server...');

const JWT_SECRET = 'test-secret';

app.post('/api/auth/login', (req, res) => {
  console.log('AUTH LOGIN CALLED', req.body);
  const { email, password } = req.body;
  res.json({ success: true });
});

app.post('/api/auth/register', (req, res) => {
  console.log('AUTH REGISTER CALLED', req.body);
  res.json({ success: true });
});

app.listen(3002, () => {
  console.log('Test auth server on 3002');
});
