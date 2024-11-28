const searchInput = document.getElementById('search-bar');

document.addEventListener('DOMContentLoaded', () => {
    // Initialization
    UpdateTable();
    UpdateUsername();
    EnableCRUD();
    EnablePopUpActions();
});

document.getElementById('logoutButton').addEventListener('click', async () => {
    const response = await fetch('/logout', { method: 'POST' });
    if (response.ok) {
      window.location.href = '/';
    } else {
      alert('Logout failed');
    }
});

// Search Implementation:
searchInput.addEventListener('input', function() {
    UpdateTable();
});

function UpdateUsername() {
    fetch('/api/user-info')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }
            return response.json();
        })
        .then(data => {
            const usernameElement = document.getElementById('username');
            usernameElement.textContent = data.username; // Update the text
        })
        .catch(error => {
            console.error('Error fetching user info:', error);
            // Optionally redirect to login if not logged in
            window.location.href = '/login.html';
        });
}

function UpdateTable() {
    const input = searchInput.value;

    if (input.length < 3) { // Only search if at least 3 characters are entered
        fetch('/api/inventory')
            .then(response => response.json())
            .then(data => {
                LoadTable(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
        return;
    }

    // Fetch search results from the backend
    fetch(`/api/search-items?query=${input}`)
        .then(response => response.json())
        .then(data => {
            LoadTable(data)
        })
        .catch(error => {
            console.error('Error fetching search results:', error);
        });
}

function LoadTable(data) {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    try {
        data.forEach(item => {
            const row = document.createElement('tr');

            const statusCell = document.createElement('td');
            statusCell.textContent = item.status.toUpperCase();
            row.appendChild(statusCell);

            switch(item.status) {
                case 'available':
                    statusCell.setAttribute('class', 'green');
                    break;
                case 'in-use':
                    statusCell.setAttribute('class', 'red');
                    break;
                default:
                    break;
            }

            const nameCell = document.createElement('td');
            nameCell.textContent = item.name;
            row.appendChild(nameCell);

            const quantityCell = document.createElement('td');
            quantityCell.textContent = item.quantity;
            row.appendChild(quantityCell);

            const locationCell = document.createElement('td');
            locationCell.textContent = item.location;
            row.appendChild(locationCell);

            tableBody.appendChild(row);

            // Add event listener for clicking a row
            row.addEventListener('click', () => {
                LoadItemCard(item); // Populate the popup
                ShowPopUp(popup);    // Show the popup
            });
        });
    } catch(err) {
        return;
    }
}

function LoadItemCard(item) {
    // Populate the popup with the clicked item data
    document.querySelector("#popup h2").textContent = item.name;
    document.getElementById("itemDetails").innerHTML = `
        <li><b>Status:</b> ${item.status.toUpperCase()}</li>
        <li><b>Quantity:</b> ${item.quantity}</li>
        <li><b>Location:</b> ${item.location}</li>
    `;
    document.getElementById("description").textContent = item.description;

    // Store item ID for future use (e.g., updating or deleting)
    popup.dataset.itemId = item.id;
}

function ShowPopUp(element) {
    document.getElementById("overlay").style.display = "block";
    element.style.display = "block";
}

function ClosePopUp(element) {
    element.style.display = "none";
    document.getElementById("overlay").style.display = "none";
}

// Enable buttons in the pop-up for updating, deleting, and closing
function EnablePopUpActions() {
    const updateButton = document.getElementById("updateButton");
    const deleteButton = document.getElementById("deleteButton");
    const closeButton = document.getElementById("closeButton");

    // Update item action
    updateButton.addEventListener('click', () => {
        const itemId = popup.dataset.itemId;
        if (!itemId) return;

        // Logic to update item (for example, redirect to edit page or open a form)
        console.log(`Updating item with ID: ${itemId}`);
        ClosePopUp(popup); // Close popup after updating (or after redirect)
    });

    // Delete item action
    deleteButton.addEventListener('click', () => {
        const itemId = popup.dataset.itemId;
        if (!itemId) return;

        // Send delete request to the server
        fetch(`/api/delete-item/${itemId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                console.log('Item deleted:', data);
                UpdateTable(); // Reload the table to reflect the changes
                ClosePopUp(popup); // Close the popup after deleting
            })
            .catch(error => {
                console.error('Error deleting item:', error);
            });
    });

    // Close pop-up action
    closeButton.addEventListener('click', () => {
        ClosePopUp(popup); // Close the popup without any action
    });
}

// Enable Add Item functionality
function EnableCRUD() {
    const addItemButton = document.getElementById("addItemButton");
    const addItemPopup = document.getElementById("addItemPopup");
    const addCloseButton = document.getElementById("addCloseButton");
    const addItemForm = document.getElementById("addItemForm");

    // Show Add Item pop-up
    addItemButton.addEventListener("click", () => {
        ShowPopUp(addItemPopup);
    });

    // Close Add Item pop-up
    addCloseButton.addEventListener("click", () => {
        ClosePopUp(addItemPopup);
    });

    // Handle Add Item form submission
    addItemForm.addEventListener("submit", (e) => {
        e.preventDefault();
    
        const itemName = document.getElementById("itemName").value;
        const itemStatus = document.getElementById("itemStatus").value;
        const itemQuantity = document.getElementById("itemQuantity").value;
        const itemDescription = document.getElementById("itemDescription").value;
        const itemLocation = document.getElementById("itemLocation").value;
    
        const itemData = {
            name: itemName,
            status: itemStatus,
            quantity: itemQuantity,
            description: itemDescription,
            location: itemLocation
        };
    
        // Send POST request to add the item
        fetch('/api/add-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Item added:', data);
                UpdateTable(); // Reload the table after adding
                ClosePopUp(addItemPopup); // Close the popup
                addItemForm.reset(); // Reset the form fields
            } else {
                console.error('Error adding item:', data.message);
            }
        })
        .catch(error => {
            console.error('Error adding item:', error);
        });
    });
    
}