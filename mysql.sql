-- Users Table
/* CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL CHECK (LENGTH(name) >= 20 AND LENGTH(name) <= 60),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    address TEXT CHECK (LENGTH(address) <= 400),
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER', 'OWNER')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
*/
-- Stores Table
/* CREATE TABLE stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    address TEXT,
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);
*/
-- Ratings Table
/* CREATE TABLE ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, store_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);
*/
/* PRAGMA foreign_keys = ON; */



-- Insert multiple stores
 /*INSERT INTO stores (name, email, address, owner_id , image)
VALUES 
  ('NS COMPUTERS', 'ns@computers.com', 'Khadi New market, Boyawada, Metpally, Telangana 505325', 4 , 'https://res.cloudinary.com/doyaebals/image/upload/v1744541171/Ns_computers_umpgok.jpg'),
  ('Nestine Furniture', 'nestine@haven.com', '44 lane , metpally', 5,'https://res.cloudinary.com/doyaebals/image/upload/v1744541388/Nestine_Furniture_gbonca.jpg'),
  ('medplus', 'medplus@pharmacy.com', 'adarsha nagar , metpally, TX', 6 , 'https://res.cloudinary.com/doyaebals/image/upload/v1744541713/medplus_phrixf.jpg');
 



-- Insert multiple ratings
/* INSERT INTO ratings (user_id, store_id, rating_value)
VALUES 
  (2, 1, 5),
  (3, 1, 4),
  (4, 2, 3),
  (5, 3, 2);
  */

-- Admin
--DROP TABLE IF EXISTS users;
/* CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  password TEXT, -- No CHECK constraint
  address TEXT,
  role TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
); 

--DROP TABLE users; */
--ALTER TABLE stores ADD COLUMN owner_name TEXT; 
UPDATE stores SET owner_name = 'Rachu' WHERE id = 5;

/*SELECT ratings.user_id AS userId, users.name AS username, ratings.rating_value AS rating
FROM ratings 
JOIN users ON ratings.user_id = users.id
WHERE ratings.store_id = 6;*/ 






