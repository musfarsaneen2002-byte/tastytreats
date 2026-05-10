import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3005', 'http://localhost:5174', 'http://127.0.0.1:3005'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('dist'));
app.use(express.static('.'));

// Setup Multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    db.get('SELECT id, email, name FROM admins WHERE id = ?', [user.id], (dbErr, admin) => {
      if (dbErr) {
        return res.status(500).json({ error: dbErr.message });
      }
      if (!admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      req.admin = admin;
      next();
    });
  });
};

// Auth Routes
console.log('Registering auth routes...');
app.post('/api/auth/login', (req, res) => {
  console.log('POST /api/auth/login called');
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  db.get('SELECT * FROM admins WHERE email = ?', [email], (err, admin) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    bcrypt.compare(password, admin.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, name: admin.name, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
    });
  });
});

// User Auth Routes
app.post('/api/user/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid email or password' });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
  });
});

app.post('/api/user/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, password and name required' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPassword, name], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, message: 'User registered successfully' });
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const createAdmin = () => {
    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
      'INSERT INTO admins (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name || 'Admin'],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, email, name });
      }
    );
  };

  db.get('SELECT COUNT(*) as count FROM admins', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row.count === 0) {
      createAdmin();
      return;
    }

    authenticateToken(req, res, createAdmin);
  });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

// Products Routes
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/products', authenticateToken, upload.single('image'), (req, res) => {
  const { name, description, price, category } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/images/default.jpg';
  const parsedPrice = parseFloat(price) || 0;
  const productCategory = category || 'tea';

  db.run(
    'INSERT INTO products (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)',
    [name, description, parsedPrice, imageUrl, productCategory],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, name, description, price: parsedPrice, image: imageUrl, category: productCategory });
    }
  );
});

app.put('/api/products/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { name, description, price, category } = req.body;
  const parsedPrice = parseFloat(price) || 0;
  const productCategory = category || 'tea';

  db.get('SELECT image FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : row.image;

    db.run(
      'UPDATE products SET name = ?, description = ?, price = ?, image = ?, category = ? WHERE id = ?',
      [name, description, parsedPrice, imageUrl, productCategory, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id, name, description, price: parsedPrice, image: imageUrl, category: productCategory });
      }
    );
  });
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Product deleted successfully', deleted: this.changes });
  });
});

// Blogs Routes
app.get('/api/blogs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  let query = 'SELECT b.*, a.name as author_name FROM blogs b LEFT JOIN admins a ON b.author_id = a.id ORDER BY b.created_at DESC';
  let params = [];

  if (limit) {
    query += ' LIMIT ?';
    params = [limit];
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.post('/api/blogs', authenticateToken, upload.single('image'), (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    'INSERT INTO blogs (title, content, author_id, category, image) VALUES (?, ?, ?, ?, ?)',
    [title, content, req.admin.id, category || 'general', imageUrl],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, title, content, author_id: req.admin.id, category, image: imageUrl });
    }
  );
});

app.put('/api/blogs/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  db.get('SELECT image FROM blogs WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : row.image;

    db.run(
      'UPDATE blogs SET title = ?, content = ?, category = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, category, imageUrl, id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id, title, content, category, image: imageUrl });
      }
    );
  });
});

app.delete('/api/blogs/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM blogs WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Blog deleted successfully' });
  });
});

// Users Routes
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, name, email, phone, address, created_at FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Admins Routes
app.get('/api/admins', authenticateToken, (req, res) => {
  db.all('SELECT id, email, name, created_at FROM admins', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

app.delete('/api/admins/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  // Don't allow deleting the last admin or yourself if you want to be safe,
  // but for now I'll just implement simple delete.
  db.run('DELETE FROM admins WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Admin deleted successfully' });
  });
});

// Review Routes
// Get all reviews (general business reviews)
app.get('/api/reviews', (req, res) => {
  db.all(
    'SELECT * FROM reviews WHERE product_id IS NULL ORDER BY created_at DESC LIMIT 50',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

// Get reviews for a specific product
app.get('/api/reviews/product/:productId', (req, res) => {
  const { productId } = req.params;
  db.all(
    'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 50',
    [productId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    }
  );
});

// Post a new review
app.post('/api/reviews', (req, res) => {
  const { user_name, user_email, rating, review_text, product_id } = req.body;

  // Validation
  if (!user_name || !user_email || !rating || !review_text) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  if (review_text.trim().length < 10) {
    return res.status(400).json({ error: 'Review must be at least 10 characters long' });
  }

  // Insert review
  db.run(
    'INSERT INTO reviews (user_name, user_email, rating, review_text, product_id) VALUES (?, ?, ?, ?, ?)',
    [user_name.trim(), user_email.trim(), rating, review_text.trim(), product_id || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        message: 'Review submitted successfully',
        id: this.lastID
      });
    }
  );
});

// Delete a review (admin only)
app.delete('/api/reviews/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM reviews WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Review deleted successfully' });
  });
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port === 3000) {
      console.log('Port 3000 is in use, trying http://localhost:3005');
      startServer(3005);
      return;
    }

    throw err;
  });
};

startServer(PORT);
