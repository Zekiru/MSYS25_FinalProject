const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const db = require('./db');
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(session({
  secret: 'your-secret-key', // Replace with a secure secret
  resave: false,
  saveUninitialized: false,
}));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Show login page if user is not logged in
app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/inventory');
  }
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Show inventory page if user is logged in
app.get('/inventory', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/inventory.html'));
});

// Redirect to login if trying to access inventory without logging in
app.get('/login', (req, res) => {
  res.redirect('/');
});


app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
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
      db.createUser(username, hashedPassword, (err, result) => {
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
    res.json({ success: true, message: 'Logged in successfully' });
  });
});

// Route for user logout
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).send('Could not log out.');
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login');
}


// Temporary route to check session
app.get('/test-session', (req, res) => {
  if (req.session.userId) {
    res.send(`Logged in as user ID: ${req.session.userId}`);
  } else {
    res.send('Not logged in');
  }
});

// Temporary test route
app.get('/test-protected', (req, res) => {
  if (req.session.userId) {
    res.send('You are authorized to view this content.');
  } else {
    res.status(401).send('Unauthorized: Please log in.');
  }
});

// Temporary logout route
app.get('/test-logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.send('Logged out successfully');
  });
});



// Protected inventory routes
app.get('/api/inventory', isAuthenticated, (req, res) => {
  db.getInventoryItems((err, items) => {
    if (err) {
      console.error('Error fetching inventory items:', err);
      return res.status(500).send('Error fetching data');
    }
    res.json(items);
  });
});

app.get('/api/inventory/:id', isAuthenticated, (req, res) => {
  const itemId = req.params.id;
  db.getItemById(itemId, (err, item) => {
    if (err) {
      console.error('Error fetching item:', err);
      return res.status(500).send('Error fetching item data');
    }
    res.json(item);
  });
});

app.post('/api/add-item', isAuthenticated, (req, res) => {
  const { name, status, quantity, description, location } = req.body;

  if (!name || !status || !quantity || !location) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const newItem = { name, status, quantity, description, location };

  db.createItem(newItem, (err, result) => {
    if (err) {
      console.error('Error adding item:', err);
      return res.status(500).json({ success: false, message: 'Error adding item' });
    }
    res.json({ success: true, message: 'Item added successfully' });
  });
});

app.delete('/api/delete-item/:id', isAuthenticated, (req, res) => {
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
