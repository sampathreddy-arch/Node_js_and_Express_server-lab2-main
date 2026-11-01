-- Lab 2 starting data
-- Rebuild the database with: sqlite3 books.db < seed.sql

DROP TABLE IF EXISTS book;

CREATE TABLE book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);

-- These ten books are sample rows for the lab. Replace them with the
-- books given by the faculty member if a different list is required.
INSERT INTO book (title, author, price, pages) VALUES
    ('Learning JavaScript Basics', 'Ravi Kumar', 349, 240),
    ('Understanding SQL Queries', 'Meera Sharma', 425, 310),
    ('Express Web Development', 'Arjun Nair', 399, 275),
    ('Data Structures in Practice', 'Priya Menon', 299, 208),
    ('Clean Coding Habits', 'Karthik Rao', 450, 260),
    ('Computer Networks Simplified', 'Anita Desai', 375, 330),
    ('Operating Systems Notes', 'Suresh Babu', 320, 290),
    ('Database Design Workbook', 'Lakshmi Iyer', 280, 190),
    ('Problem Solving with Algorithms', 'Vikram Singh', 499, 410),
    ('Web Security Essentials', 'Neha Gupta', 525, 350);
