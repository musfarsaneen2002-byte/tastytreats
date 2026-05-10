import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'products.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to SQLite database');
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'tea'
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES admins(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_name TEXT NOT NULL,
        user_email TEXT NOT NULL,
        product_id INTEGER,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    db.all("PRAGMA table_info(products)", [], (err, rows) => {
      if (!err && rows && !rows.some(col => col.name === 'category')) {
        db.run("ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'tea'");
      }
    });
    db.all("PRAGMA table_info(users)", [], (err, rows) => {
      if (!err && rows && !rows.some(col => col.name === 'password')) {
        db.run("ALTER TABLE users ADD COLUMN password TEXT");
      }
    });
    db.all("PRAGMA table_info(blogs)", [], (err, rows) => {
      if (!err && rows && !rows.some(col => col.name === 'image')) {
        db.run("ALTER TABLE blogs ADD COLUMN image TEXT");
      }
    });
  }
});

export default db;

