-- Fix UTF8MB4 encoding for products table
-- Run this SQL script directly in your MySQL database if the migration doesn't work

-- Ensure the database uses utf8mb4
ALTER DATABASE react_node_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convert description column to utf8mb4
ALTER TABLE products 
MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convert specifications column to utf8mb4 (if it exists)
ALTER TABLE products 
MODIFY COLUMN specifications TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Convert name column to utf8mb4
ALTER TABLE products 
MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;

