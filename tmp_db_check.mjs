import sqlite3 from 'sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';

const dbPath = join(process.cwd(), 'products.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('open_error', err);
    process.exit(1);
  }
});

db.all('PRAGMA table_info(products)', [], (err, rows) => {
  console.log('schema_err', err);
  console.log(JSON.stringify(rows, null, 2));
  db.all('SELECT id, name, category FROM products LIMIT 5', [], (err2, rows2) => {
    console.log('rows_err', err2);
    console.log(JSON.stringify(rows2, null, 2));
    db.close();
  });
});
