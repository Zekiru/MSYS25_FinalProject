const express = require('express');
const db = require('./db');  // Import db.js
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));  // Serve static files like HTML, CSS, JS

// Route to fetch all inventory items
app.get('/api/inventory', (req, res) => {
  db.getInventoryItems((err, items) => {
    if (err) {
      res.status(500).send('Error fetching data');
    } else {
      res.json(items);  // Send the inventory data as JSON response
    }
  });
});

// Route to fetch a specific item by ID
app.get('/api/inventory/:id', (req, res) => {
  const itemId = req.params.id;
  db.getItemById(itemId, (err, item) => {
    if (err) {
      res.status(500).send('Error fetching item data');
    } else {
      res.json(item);  // Send the specific item data as JSON response
    }
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
