const searchInput = document.getElementById('search-bar');

document.addEventListener('DOMContentLoaded', () => {
    // Initialization
    updateTable();
    updateUsername();
    enableAddItems();
    enablePopUpActions();
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
    updateTable();
});

function updateUsername() {
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

function updateTable() {
    const input = searchInput.value;

    if (input.length < 3) { // Only search if at least 3 characters are entered
        fetch('/api/inventory')
            .then(response => response.json())
            .then(data => {
                loadTable(data);
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
            loadTable(data)
        })
        .catch(error => {
            console.error('Error fetching search results:', error);
        });
}

function loadTable(data) {
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
                loadItemCard(item); // Populate the popup
                showPopUp(popup);    // Show the popup
            });
        });
    } catch(err) {
        return;
    }
}

function loadItemCard(item) {
    let color = '';

    switch(item.status) {
        case 'available':
            color = 'green';
            break;
        case 'in-use':
            color = 'red';
            break;
        default:
            break;
    }

    // Populate the popup with the clicked item data
    document.querySelector("#popup h2").textContent = item.name;
    document.getElementById("itemDetails").innerHTML = `
        <li><h3 class="${color}">${item.status.toUpperCase()}</h3></li>
        <li><b>Quantity:</b> ${item.quantity}</li>
        <li><b>Location:</b> ${item.location}</li>
    `;
    document.getElementById("description").textContent = item.description;

    // Store item ID for future use (e.g., updating or deleting)
    popup.dataset.itemId = item.id;
}

function showPopUp(element) {
    document.getElementById("overlay").style.display = "block";
    element.style.display = "block";
}

function closePopUp(element) {
    element.style.display = "none";
    document.getElementById("overlay").style.display = "none";
}



function deleteItem(itemId) {
    const confirmDelete = confirm('Are you sure you want to delete this item?');
  
    if (confirmDelete) {
        // Proceed with the delete request if confirmed
        fetch(`/api/delete-item/${itemId}`, {
        method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
        if (data.success) {
            // alert(data.message);
            updateTable();
            closePopUp(popup);
        } else {
        alert('Failed to delete item');
        }
        })
        .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting the item');
        });
    } else {
        console.log('Item deletion cancelled.');
    }
}

function addItem() {
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
            if (!data.success) {
                // Alert the user with the error message
                alert(data.message);
                return;
            }
        // alert(data.message);
        updateTable(); // Reload the table after adding
        closePopUp(addItemPopup); // Close the popup
        addItemForm.reset(); // Reset the form fields
    })
    .catch(error => {
        console.error('Error adding item:', error);
        alert('An error occurred while adding the item.');
    });
}



// Enable buttons in the pop-up for updating, deleting, and closing
function enablePopUpActions() {
    const updateButton = document.getElementById("updateButton");
    const deleteButton = document.getElementById("deleteButton");
    const closeButton = document.getElementById("closeButton");

    // Update item action
    updateButton.addEventListener('click', () => {
        const itemId = popup.dataset.itemId;
        if (!itemId) return;

        // Logic to update item (for example, redirect to edit page or open a form)
        console.log(`Updating item with ID: ${itemId}`);
        closePopUp(popup); // Close popup after updating (or after redirect)
    });

    // Delete item action
    deleteButton.addEventListener('click', () => {
        const itemId = popup.dataset.itemId;
        if (!itemId) return;

        deleteItem(itemId);
    });

    // Close pop-up action
    closeButton.addEventListener('click', () => {
        closePopUp(popup); // Close the popup without any action
    });
}

// Enable Add Item functionality
function enableAddItems() {
    const addItemButton = document.getElementById("addItemButton");
    const addItemPopup = document.getElementById("addItemPopup");
    const addCloseButton = document.getElementById("addCloseButton");
    const addItemForm = document.getElementById("addItemForm");

    // Show Add Item pop-up
    addItemButton.addEventListener("click", () => {
        showPopUp(addItemPopup);
    });

    // Close Add Item pop-up
    addCloseButton.addEventListener("click", () => {
        closePopUp(addItemPopup);
    });

    // Handle Add Item form submission
    addItemForm.addEventListener("submit", (e) => {
        e.preventDefault();
    
        addItem();
    });
}