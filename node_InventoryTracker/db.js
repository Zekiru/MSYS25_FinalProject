const mysql = require('mysql2');

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',         // Replace with your MySQL username
  password: '',         // Replace with your MySQL password
  database: 'inventorytracker',  // Replace with your database name
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

module.exports = {
  getInventoryItems,
  getItemById,
  createItem,
  deleteItem
};
