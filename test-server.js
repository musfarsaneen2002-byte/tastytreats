import express from 'express';

const app = express();
app.use(express.json());

console.log('Registering test route...');

app.post('/api/test', (req, res) => {
  console.log('POST /api/test hit');
  res.json({ success: true });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('Test server on 3001');
});
