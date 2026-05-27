CREATE TABLE IF NOT EXISTS jerseys (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  sku           TEXT    UNIQUE NOT NULL,
  name          TEXT    NOT NULL,
  team          TEXT    NOT NULL,
  country       TEXT    NOT NULL,
  type          TEXT    NOT NULL CHECK(type IN ('home','away','third')),
  price         REAL    NOT NULL,
  originalPrice REAL,
  imageUrl      TEXT    NOT NULL,
  inStock       INTEGER NOT NULL DEFAULT 1,
  sizes         TEXT    NOT NULL DEFAULT '["S","M","L","XL","XXL"]',
  rating        REAL    NOT NULL DEFAULT 4.5,
  reviewCount   INTEGER NOT NULL DEFAULT 0,
  isFeatured    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id               TEXT PRIMARY KEY,
  status           TEXT NOT NULL DEFAULT 'confirmed',
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city             TEXT,
  postal_code      TEXT,
  country          TEXT,
  items            TEXT NOT NULL,
  total_amount     REAL NOT NULL,
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL,
  code       TEXT    NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  token      TEXT,
  expires_at TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now'))
);
