import express from 'express';
const app = express();
app.use(express.json());
app.use(express.static('public'));

app.post('/api/auth/login', (req, res) => {
  console.log('LOGIN called');
  res.json({ success: true });
});

app.listen(3003, () => console.log('on 3003'));
