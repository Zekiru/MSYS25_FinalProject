const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
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

// Fetch all inventory items with optional status filtering
function getInventory(statusFilters, callback) {
  let query = 'SELECT * FROM inventory ';
  const queryParams = [];

  // Add status filter condition if any
  if (statusFilters && statusFilters.length > 0) {
    const placeholders = statusFilters.map(() => '?').join(', ');
    query += `WHERE status IN (${placeholders}) `;
    queryParams.push(...statusFilters);
  }

  // Add sorting
  query += 'ORDER BY GREATEST(created_at, updated_at) DESC';

  executeQuery(query, queryParams, callback);
}


// Search for inventory items by Name OR Location with optional status filters
function searchInventory({ searchTerm, searchBy, statusFilters }, callback) {
  let query = 'SELECT * FROM inventory WHERE ';
  const queryParams = [];

  // If searchTerm is provided, add the search condition
  if (searchTerm && searchTerm.length > 0) {
    if (searchBy === 'name') {
      query += 'name LIKE ? ';
    } else if (searchBy === 'location') {
      query += 'location LIKE ? ';
    }
    queryParams.push(`%${searchTerm}%`); // Wrap search term with '%' for partial match
  } else {
    // If no searchTerm, don't add a search condition
    query += '1 ';  // "1" is a true condition that selects all rows
  }

  // Add status filter condition if any
  if (statusFilters && statusFilters.length > 0) {
    const placeholders = statusFilters.map(() => '?').join(', ');
    query += `AND status IN (${placeholders}) `;
    queryParams.push(...statusFilters);
  }

  // Add sorting
  query += 'ORDER BY GREATEST(created_at, updated_at) DESC';

  executeQuery(query, queryParams, callback);
}

// Fetch a specific item by ID
function getItemById(itemId, callback) {
  executeQuery('SELECT * FROM inventory WHERE id = ?', [itemId], callback);
}

// Check if an item with the same name and status exists
function checkItemExists(name, status, location, callback) {
  const query = 'SELECT COUNT(*) AS count FROM inventory WHERE name = ? AND status = ? AND location = ?';
  executeQuery(query, [name, status, location], (err, results) => {
    if (err) {
      return callback(err);
    }
    callback(null, results[0].count > 0); // Return true if count > 0
  });
}

function checkItemExistsExcludingCurrent(name, status, location, itemId, callback) {
  const query = `
    SELECT 1 FROM inventory 
    WHERE name = ? AND status = ? AND location = ? AND id != ?
    LIMIT 1
  `;
  
  // Assuming you have a MySQL connection established (db.connection)
  executeQuery(query, [name, status, location, itemId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return callback(err);
    }

    // If results length is greater than 0, it means an item with the same attributes exists
    callback(null, results.length > 0); // Returns true if a match is found
  });
}

// Add a new item to the inventory
function createItem(newItem, callback) {
  const { name, status, quantity, description, location } = newItem;
  const query = 'INSERT INTO inventory (name, status, quantity, description, location) VALUES (?, ?, ?, ?, ?)';
  executeQuery(query, [name, status, quantity, description, location], callback);
}

// Update an item in the inventory
function updateItem(itemId, updatedItem, callback) {
  const { name, status, quantity, description, location } = updatedItem;
  const query = `
    UPDATE inventory 
    SET name = ?, status = ?, quantity = ?, description = ?, location = ?
    WHERE id = ?`;
  
  executeQuery(query, [name, status, quantity, description, location, itemId], callback);
}

// Split and transfer an item
function splitAndTransferItem(originalId, newItem, transferQuantity, callback) {
  const checkExistQuery = 'SELECT * FROM inventory WHERE name = ? AND status = ? AND location = ?';
  const getOriginalQuery = 'SELECT quantity FROM inventory WHERE id = ?';
  const updateExistingQuery = 'UPDATE inventory SET quantity = quantity + ? WHERE id = ?';
  const deleteOriginalQuery = 'DELETE FROM inventory WHERE id = ?';
  const updateOriginalQuery = 'UPDATE inventory SET quantity = quantity - ? WHERE id = ?';
  const createNewQuery = 'INSERT INTO inventory (name, status, quantity, description, location) VALUES (?, ?, ?, ?, ?)';

  pool.getConnection((err, connection) => {
    if (err) return callback(err);

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return callback(err);
      }

      // Step 1: Get the original item's quantity
      connection.query(getOriginalQuery, [originalId], (err, results) => {
        if (err || results.length === 0) {
          return connection.rollback(() => {
            connection.release();
            callback(err || new Error('Original item not found'));
          });
        }

        const originalQuantity = results[0].quantity;

        if (transferQuantity === originalQuantity) {
          // Step 2: If transfer quantity matches original, delete the original item
          connection.query(deleteOriginalQuery, [originalId], (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }

            // Step 3: Handle the destination item (update existing or create new)
            handleDestinationItem(connection, newItem, transferQuantity, (err, result) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  callback(err);
                });
              }

              connection.commit(err => {
                connection.release();
                if (err) return callback(err);
                callback(null, { deleted: true, ...result });
              });
            });
          });
        } else {
          // Step 2: Update the original item's quantity
          connection.query(updateOriginalQuery, [transferQuantity, originalId], (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                callback(err);
              });
            }

            // Step 3: Handle the destination item (update existing or create new)
            handleDestinationItem(connection, newItem, transferQuantity, (err, result) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  callback(err);
                });
              }

              connection.commit(err => {
                connection.release();
                if (err) return callback(err);
                callback(null, { updatedOriginal: true, ...result });
              });
            });
          });
        }
      });
    });
  });

  // Helper function to handle destination item logic
  function handleDestinationItem(connection, newItem, transferQuantity, callback) {
    const { name, status, location, description } = newItem;

    connection.query(checkExistQuery, [name, status, location], (err, results) => {
      if (err) return callback(err);

      const existingItem = results[0];

      if (existingItem) {
        // Update existing item's quantity
        connection.query(updateExistingQuery, [transferQuantity, existingItem.id], (err) => {
          if (err) return callback(err);
          callback(null, { updated: true });
        });
      } else {
        // Create new item
        connection.query(
          createNewQuery,
          [name, status, transferQuantity, description, location],
          (err, result) => {
            if (err) return callback(err);
            callback(null, { created: true });
          }
        );
      }
    });
  }
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

function getUserByUsername(username, callback) {
  executeQuery('SELECT * FROM users WHERE username = ?', [username], callback);
}

function updateUser(userId, updatedUser, callback) {
  const { username, password, role } = updatedUser;
  let query = 'UPDATE users SET username = ?, role = ?';
  const params = [username, role];

  // If a password is provided, hash it and update it
  if (password) {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return callback(err);
      }
      query += ', password = ?';
      params.push(hashedPassword);

      query += ' WHERE id NOT IN (1, 2) AND id = ?';
      params.push(userId);

      executeQuery(query, params, callback);
    });
  } else {
    query += ' WHERE id NOT IN (1, 2) AND id = ?';
    params.push(userId);

    executeQuery(query, params, callback);
  }
}

function deleteUser(userId, callback) {
  const query = 'DELETE FROM users WHERE id NOT IN (1, 2) AND id = ?';
  executeQuery(query, [userId], callback);
}

function getUsers(callback) {
  const query = 'SELECT id, username, role FROM users WHERE id NOT IN (1, 2)';
  executeQuery(query, [], callback);
}

function searchUsersByName(searchTerm, callback) {
  const query = 'SELECT * FROM users WHERE id NOT IN (1, 2) AND username LIKE ?';
  const searchQuery = `%${searchTerm}%`; // Wrap search term with '%' for partial match
  executeQuery(query, [searchQuery], callback);
}

function getUsersByRole(filterName, callback) {
  const query = 'SELECT * FROM users WHERE id NOT IN (1, 2) AND role = ?';
  executeQuery(query, [filterName], callback);
}


module.exports = {
  getInventory,
  searchInventory,
  getItemById,
  checkItemExists,
  checkItemExistsExcludingCurrent,
  createItem,
  updateItem,
  splitAndTransferItem,
  deleteItem,
  getUserById,
  createUser,
  getUserByUsername,
  updateUser,
  deleteUser,
  getUsers,
  searchUsersByName,
  getUsersByRole
};