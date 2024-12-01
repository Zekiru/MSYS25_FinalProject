const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('dotenv').config();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/inventory');
  }
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/inventory', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/inventory.html'));
});

app.get('/login', (req, res) => {
  res.redirect('/');
});

app.get('/manageusers', isAuthenticated, (req, res) => {
  if (req.session.role !== 'admin') {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public/manageUsers.html'));
});


app.post('/register', isAuthenticated, checkRole(['admin']), async (req, res) => {
  const { username, password, role } = req.body;

  // Validate input
  if (!username || !password || !role) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  // Check if username already exists
  db.getUserByUsername(username, async (err, rows) => {
    if (err) {
      console.error('Error checking username:', err);
      return res.status(500).send('Internal server error');
    }

    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists.' });
    }

    // Hash the password
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the user
      db.createUser(username, hashedPassword, role, (err, result) => {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).send('Error creating user');
        }
        res.json({ success: true, message: 'User registered successfully!' });
      });
    } catch (err) {
      console.error('Error hashing password:', err);
      res.status(500).send('Internal server error');
    }
  });
});

// Route for user login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.getUserByUsername(username, async (err, rows) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).send('Internal server error');
    }

    if (rows.length === 0) {
      return res.status(400).send('Invalid username or password.');
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).send('Invalid username or password.');
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    res.json({ success: true, message: 'Logged in successfully' });
  });
});

// Route for user logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.redirect('/'); // Redirect to homepage after logging out
  });
});

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    const userRole = req.session.role; // Assume role is stored in the session during login

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access forbidden: insufficient privileges' });
    }
    next();
  };
}

// Route to get all users with their roles
app.get('/api/users', isAuthenticated, checkRole(['admin']), (req, res) => {
  db.getUsers((err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    // Return users with their roles only (excluding passwords)
    res.json({ users });
  });
});

// Route for searching users by name
app.get('/api/search-users', isAuthenticated, checkRole(['admin']), (req, res) => {
  const searchTerm = req.query.searchTerm; // Get search term from query parameters

  // Ensure the searchTerm is provided
  if (!searchTerm) {
    return res.status(400).json({ message: 'Search term is required' });
  }

  // Search users by name
  db.searchUsersByName(searchTerm, (err, users) => {
    if (err) {
      console.error('Error searching users:', err);
      return res.status(500).json({ message: 'Error searching users' });
    }

    res.json(users); // Return the users found
  });
});

// Route for getting users by role
app.get('/api/users-by-role', isAuthenticated, checkRole(['admin']), (req, res) => {
  const filterName = req.query.role; // Get role from query parameters

  // Ensure the role is provided
  if (!filterName) {
    return res.status(400).json({ message: 'Role is required' });
  }

  // Get users by role
  db.getUsersByRole(filterName, (err, users) => {
    if (err) {
      console.error('Error getting users by role:', err);
      return res.status(500).json({ message: 'Error fetching users by role' });
    }

    res.json(users); // Return users with the specified role
  });
});

// Route for updating user account (including role)
app.put('/api/update-user/:id', isAuthenticated, checkRole(['admin']), (req, res) => {
  const userId = req.params.id;
  const { username, password, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ message: 'Username and role are required' });
  }

  const validRoles = ['reader', 'editor', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const updatedUser = { username, role };

  if (password && password.trim() !== '') {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      updatedUser.password = hashedPassword;

      db.updateUser(userId, updatedUser, (err, result) => {
        if (err) {
          console.error('Error updating user:', err);
          return res.status(500).json({ message: 'Error updating user' });
        }

        res.json({ success: true, message: 'User updated successfully' });
      });
    });
  } else {
    db.updateUser(userId, updatedUser, (err, result) => {
      if (err) {
        console.error('Error updating user:', err);
        return res.status(500).json({ message: 'Error updating user' });
      }

      res.json({ success: true, message: 'User updated successfully' });
    });
  }
});

// Route for deleting user account
app.delete('/api/delete-user/:id', isAuthenticated, checkRole(['admin']), (req, res) => {
  const userId = req.params.id;

  // Ensure that the admin is not deleting their own account
  if (req.session.userId == userId) {
    return res.status(400).json({ message: 'Admin cannot delete their own account' });
  }

  // Delete the user from the database
  db.deleteUser(userId, (err, result) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).json({ message: 'Error deleting user' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  });
});

app.get('/api/user-info', isAuthenticated, (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  // Assuming you store the username and role in the database
  db.getUserById(req.session.userId, (err, user) => {
    if (err) {
      console.error('Error fetching user info:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the username and role in the response
    res.json({ username: user.username, role: user.role });
  });
});



// Temporary route to check session
app.get('/test-session', (req, res) => {
  if (req.session.userId) {
    res.send(`Logged in as user ID: ${req.session.userId}`);
  } else {
    res.send('Not logged in');
  }
});



// Protected inventory routes
app.get('/api/inventory', isAuthenticated, (req, res) => {
  const { statuses } = req.query;  // Extract 'statuses' query parameter if it exists

  // Parse statuses into an array if provided
  const statusFilters = statuses ? statuses.split(',') : [];

  // Fetch inventory items with optional status filters
  db.getInventory(statusFilters, (err, items) => {
    if (err) {
      console.error('Error fetching inventory items:', err);
      return res.status(500).send('Error fetching data');
    }
    res.json(items); // Send matching items as a JSON response
  });
});

// Route to search inventory items
app.get('/api/search-inventory', isAuthenticated, (req, res) => {
  const { query, searchBy, statuses } = req.query; // Extract query, searchBy, and statuses from query parameters

  // Validate required parameters
  if (!query || !searchBy) {
    return res.status(400).json({
      success: false,
      message: 'Query and searchBy parameters are required',
    });
  }

  // Parse statuses into an array if provided
  const statusFilters = statuses ? statuses.split(',') : [];

  // Search inventory items using the modified function
  db.searchInventory({ searchTerm: query, searchBy, statusFilters }, (err, items) => {
    if (err) {
      console.error('Error searching inventory:', err);
      return res.status(500).send('Error searching inventory');
    }

    res.json(items); // Send matching items as a JSON response
  });
});

app.post('/api/add-item', isAuthenticated, checkRole(['editor', 'admin']), (req, res) => {
  const { name, status, quantity, description, location } = req.body;

  if (!name || !status || !quantity || !location) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const newItem = { name, status, quantity, description, location };

  db.checkItemExists(name, status, location, (err, exists) => {
    if (err) {
      console.error('Error checking for duplicates:', err);
      return res.status(500).json({ success: false, message: 'Error checking for duplicates' });
    }

    if (exists) {
      return res.status(400).json({ success: false, message: 'Item with the same attributes already exists' });
    }

    db.createItem(newItem, (err, result) => {
      if (err) {
        console.error('Error adding item:', err);
        return res.status(500).json({ success: false, message: 'Error adding item' });
      }
      res.json({ success: true, message: 'Item added successfully' });
    });
  });
});

app.put('/api/update-item/:id', isAuthenticated, checkRole(['editor', 'admin']), (req, res) => {
  const itemId = req.params.id;
  const { name, status, quantity, description, location } = req.body;

  if (!name || !status || !quantity || !location) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Fetch the current item from the database to compare its current attributes
  db.getItemById(itemId, (err, currentItem) => {
    if (err) {
      console.error('Error fetching current item:', err);
      return res.status(500).json({ success: false, message: 'Error fetching current item' });
    }

    // Check if the attributes in the request match the current item attributes
    if (
      name === currentItem.name &&
      status === currentItem.status &&
      location === currentItem.location &&
      quantity === currentItem.quantity &&
      description === currentItem.description
    ) {
      // If the attributes haven't changed, skip the update and return success
      return res.json({ success: true, message: 'No changes detected, update skipped' });
    }

    const updatedItem = { name, status, quantity, description, location };

    // Check if an item with the same attributes (name, status, location) already exists, excluding the current item
    db.checkItemExistsExcludingCurrent(name, status, location, itemId, (err, exists) => {
      if (err) {
        console.error('Error checking for duplicates:', err);
        return res.status(500).json({ success: false, message: 'Error checking for duplicates' });
      }

      if (exists) {
        return res.status(400).json({ success: false, message: 'Item with the same attributes already exists' });
      }

      // Proceed with updating the item if no duplicate is found
      db.updateItem(itemId, updatedItem, (err, result) => {
        if (err) {
          console.error('Error updating item:', err);
          return res.status(500).json({ success: false, message: 'Error updating item' });
        }
        res.json({ success: true, message: 'Item updated successfully' });
      });
    });
  });
});

// POST endpoint to split and transfer an item
app.post('/api/split-transfer-item', checkRole(['editor', 'admin']), (req, res) => {
  const { originalId, newItem, transferQuantity } = req.body;

  // Input validation
  if (!originalId || !newItem || !transferQuantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.splitAndTransferItem(originalId, newItem, transferQuantity, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json({ success: true, result });
  });
});

app.delete('/api/delete-item/:id', isAuthenticated, checkRole(['editor', 'admin']), (req, res) => {
  const itemId = req.params.id;
  db.deleteItem(itemId, (err, result) => {
    if (err) {
      console.error('Error deleting item:', err);
      return res.status(500).send('Error deleting item');
    }
    res.json({ success: true, message: 'Item deleted successfully' });
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
