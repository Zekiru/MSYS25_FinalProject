const loadingScreen = document.getElementById('loading-screen');

const generateButton = document.getElementById('generate-button');
const dataTable = document.getElementById('dataTable');
const selectTable = document.getElementById('selectedTable');
const dataPagination = document.getElementById('dataPagination');
const selectPagination = document.getElementById('selectedPagination');
const searchInput = document.getElementById('search-bar');

const headerText = ['Status', 'Name', 'Quantity', 'Location']; 

let bookObjects = [];
let currentItemObjects = [];
let currentItemSelect = [];


const maxPages = 12;


// Search Implementation:
searchInput.addEventListener('input', function() {
    const input = this.value;

    const searchFilter = bookObjects.filter((book) => {
        let status = false;

        dataHeaders.forEach((head) => {
            if (book.data[head].toLowerCase().includes(input.toLowerCase())) {status = true};
        });

        return status;
    });

    // loadTable(new Pagination(searchFilter, 200).getCurrentItems(1));
});

document.addEventListener('DOMContentLoaded', () => {
    // Initialization
    loadTable()
    enableCRUD()
    enablePopUpActions(); // Enable popup buttons
});

document.getElementById('logoutButton').addEventListener('click', async () => {
    const response = await fetch('/logout', { method: 'POST' });
    if (response.ok) {
      window.location.href = '/';
    } else {
      alert('Logout failed');
    }
});


// class Item {
//     constructor(json) {
//         this.data = json;
//         this.id = json[dataHeaders[0]];
//         this.selected = false;
//     }

//     getItemRow() {
//         const tr = document.createElement('tr');
//         const td = document.createElement('td');
//         const cb = document.createElement('input');
//         cb.setAttribute('type', 'checkbox');
//         cb.setAttribute('class', 'cb');

//         td.appendChild(cb);
//         tr.appendChild(td);

//         dataHeaders.forEach((key) => {
//             const td = document.createElement('td');
//             td.textContent = this.data[[key]];
//             tr.appendChild(td);
//         })

//         tr.addEventListener("mousedown", () => {
//             selectMode = ((tr.hasAttribute("checked") ? false : true));
//             this.toggleSelect(selectMode);
//         });

//         tr.addEventListener("mouseenter", () => {
//             if (!mouse_active) {return};
//             this.toggleSelect(selectMode);
//         });

//         this.tr = tr;
//         this.cb = cb;

//         if (this.selected) this.toggleDataTable(true);

//         return tr;
//     }

//     toggleDataTable(active) {
//         if (active && !this.tr.hasAttribute('checked')) {
//             this.tr.setAttribute("checked", "");
//             this.cb.setAttribute("checked", "");
//         } 
        
//         if (!active && this.tr.hasAttribute('checked')) {
//             this.tr.removeAttribute("checked");
//             this.cb.removeAttribute("checked");
//         }
//     }

//     toggleSelect(active) {
//         if (active && !currentItemSelect.includes(this) && currentItemSelect.length < maxPages) {
//             if (currentItemSelect.length == 0) {
//                 loadBackPage(true);
//             }

//             this.selected = active;

//             this.toggleDataTable(active);

//             currentItemSelect.push(this);

//             const tr = document.createElement('tr');
//             const td = document.createElement('td');
//             const td2 = document.createElement('td');

//             tr.setAttribute('id', this.id)
//             td2.setAttribute('class', 'x')

//             td.innerText = this.id + " - " + this.data[dataHeaders[3]];
//             td2.innerText = '✕';
//             tr.appendChild(td);
//             tr.appendChild(td2);

//             tr.addEventListener('click', () => {
//                 this.toggleSelect(false);
//             });

//             selectTable.insertBefore(tr, selectTable.firstChild);

//             loadItemCard(this.data);
//         }
        
//         if (!active && currentItemSelect.includes(this)) {
//             this.selected = active;

//             this.toggleDataTable(active);

//             currentItemSelect.splice(currentItemSelect.indexOf(this), 1);

//             selectTable.removeChild(document.getElementById(this.id));

//             document.getElementById('bookCardFormat').removeChild(document.getElementById(this.data[dataHeaders[0]]));

//             if (currentItemSelect.length == 0) {
//                 loadBackPage(false);
//             }
//         }
//     }
// }

// class Pagination {
//     constructor(obj, itemsPerPage) {
//         this.obj = obj;
//         this.itemsPerPage = itemsPerPage;
//         this.totalPages = Math.ceil(obj.length / itemsPerPage);
//     }

//     getTotalPages() {
//         return this.totalPages;
//     }

//     getCurrentItems(currentPage) {
//         this.startIndex = (currentPage - 1) * this.itemsPerPage;
//         this.endIndex = this.startIndex + this.itemsPerPage;
//         this.currentItems = this.obj.slice(this.startIndex, this.endIndex);

//         dataPagination.innerHTML = '';
        
//         for (let i = 1; this.totalPages >= i; i++) {
//             const firstItem = (i - 1) * this.itemsPerPage + 1;
//             const lastItem = this.obj.slice(firstItem - 1, firstItem - 1 + this.itemsPerPage).length + (firstItem - 1);

//             const p = document.createElement('p');
            
//             if (firstItem == lastItem) {p.innerText = firstItem} 
//             else {p.innerText = firstItem + "-" + lastItem};

//             if (i == currentPage) {
//                 p.setAttribute('current-page', '');
//             }

//             p.addEventListener('click', () => {
//                 loadTable(this.getCurrentItems(i));
//                 selectAll(false);
//             })

//             dataPagination.appendChild(p);
//         }

//         return this.currentItems;
//     }
// }


function loadTable() {
    // Fetch the inventory items from the backend
    fetch('/api/inventory')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.querySelector('#dataTable tbody');
            tableBody.innerHTML = ''; // Clear existing rows

            try {
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.setAttribute('class', item.id);
    
                    const statusCell = document.createElement('td');
                    statusCell.textContent = item.status.toUpperCase();
                    row.appendChild(statusCell);
    
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
                return
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function loadItemCard(item) {
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

function showPopUp(element) {
    document.getElementById("overlay").style.display = "block";
    element.style.display = "block";
}

function closePopUp(element) {
    element.style.display = "none";
    document.getElementById("overlay").style.display = "none";
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

        // Send delete request to the server
        fetch(`/api/delete-item/${itemId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                console.log('Item deleted:', data);
                loadTable(); // Reload the table to reflect the changes
                closePopUp(popup); // Close the popup after deleting
            })
            .catch(error => {
                console.error('Error deleting item:', error);
            });
    });

    // Close pop-up action
    closeButton.addEventListener('click', () => {
        closePopUp(popup); // Close the popup without any action
    });
}

// Enable Add Item functionality
function enableCRUD() {
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
                loadTable(); // Reload the table after adding
                closePopUp(addItemPopup); // Close the popup
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