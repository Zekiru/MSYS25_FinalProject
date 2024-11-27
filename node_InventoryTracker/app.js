const express = require('express');
const db = require('./db');  // Import the db.js functions
const app = express();
const path = require('path');

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Route to fetch all inventory items
app.get('/api/inventory', (req, res) => {
  db.getInventoryItems((err, items) => {
    if (err) {
      console.error('Error fetching inventory items:', err);
      return res.status(500).send('Error fetching data');
    }
    res.json(items);  // Send the inventory data as a JSON response
  });
});

// Route to fetch a specific item by ID
app.get('/api/inventory/:id', (req, res) => {
  const itemId = req.params.id;
  db.getItemById(itemId, (err, item) => {
    if (err) {
      console.error('Error fetching item:', err);
      return res.status(500).send('Error fetching item data');
    }
    res.json(item);  // Send the specific item data as a JSON response
  });
});

// Route to add a new item to the inventory
app.post('/api/add-item', (req, res) => {
  const { name, status, quantity, description, location } = req.body;

  // Ensure the necessary fields are provided
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

// Route to delete an item by ID
app.delete('/api/delete-item/:id', (req, res) => {
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
