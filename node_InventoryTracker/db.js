const mysql = require('mysql2');

// Create a connection to the database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',  // Replace with your database username
  password: '',  // Replace with your database password
  database: 'inventorytracker'  // Replace with your database name
});

// Function to fetch all items from the 'inventory' table
function getInventoryItems(callback) {
  connection.query('SELECT * FROM inventory', (err, results) => {
    if (err) {
      console.error('Error fetching data from database:', err);
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
}

// Function to fetch a specific item by its ID
function getItemById(itemId, callback) {
  connection.query('SELECT * FROM inventory WHERE id = ?', [itemId], (err, results) => {
    if (err) {
      console.error('Error fetching data from database:', err);
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
}

// Export the functions so they can be used in other files
module.exports = {
  getInventoryItems,
  getItemById
};
