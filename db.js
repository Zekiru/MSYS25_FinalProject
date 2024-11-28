const mysql = require('mysql2');
require('dotenv').config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to execute queries and return the results
function executeQuery(query, params = [], callback) {
  pool.execute(query, params, (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results);
  });
}

// Fetch all inventory items
function getInventoryItems(callback) {
  executeQuery('SELECT * FROM inventory', [], callback);
}

// Search for inventory items by name (partial match using LIKE)
function searchItemsByName(searchTerm, callback) {
  const query = 'SELECT * FROM inventory WHERE name LIKE ?';
  const searchQuery = `%${searchTerm}%`; // Wrap search term with '%' for partial match
  executeQuery(query, [searchQuery], callback);
}

// Fetch a specific item by ID
function getItemById(itemId, callback) {
  executeQuery('SELECT * FROM inventory WHERE id = ?', [itemId], callback);
}

// Add a new item to the inventory
function createItem(newItem, callback) {
  const { name, status, quantity, description, location } = newItem;
  const query = 'INSERT INTO inventory (name, status, quantity, description, location) VALUES (?, ?, ?, ?, ?)';

  executeQuery(query, [name, status, quantity, description, location], callback);
}

// Delete an item from the inventory
function deleteItem(itemId, callback) {
  executeQuery('DELETE FROM inventory WHERE id = ?', [itemId], callback);
}



function getUserById(userId, callback) {
  const query = 'SELECT * FROM users WHERE id = ?';
  pool.execute(query, [userId], (err, results) => {
      if (err) {
          return callback(err);
      }
      callback(null, results[0]); // Return the first result
  });
}

function createUser(username, hashedPassword, callback) {
  const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
  executeQuery(query, [username, hashedPassword], callback);
}

// Fetch a user by username
function getUserByUsername(username, callback) {
  executeQuery('SELECT * FROM users WHERE username = ?', [username], callback);
}

// Add a new user (e.g., for registration)
function addUser(newUser, callback) {
  const { username, hashedPassword } = newUser;
  const query = 'INSERT INTO users (username, password) VALUES (?, ?)';

  executeQuery(query, [username, hashedPassword], callback);
}

module.exports = {
  getInventoryItems,
  searchItemsByName,
  getItemById,
  createItem,
  deleteItem,
  getUserById,
  createUser,
  getUserByUsername,
  addUser
};