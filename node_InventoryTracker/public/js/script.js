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
    enablePopUp()
});


class Item {
    constructor(json) {
        this.data = json;
        this.id = json[dataHeaders[0]];
        this.selected = false;
    }

    getItemRow() {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        const cb = document.createElement('input');
        cb.setAttribute('type', 'checkbox');
        cb.setAttribute('class', 'cb');

        td.appendChild(cb);
        tr.appendChild(td);

        dataHeaders.forEach((key) => {
            const td = document.createElement('td');
            td.textContent = this.data[[key]];
            tr.appendChild(td);
        })

        tr.addEventListener("mousedown", () => {
            selectMode = ((tr.hasAttribute("checked") ? false : true));
            this.toggleSelect(selectMode);
        });

        tr.addEventListener("mouseenter", () => {
            if (!mouse_active) {return};
            this.toggleSelect(selectMode);
        });

        this.tr = tr;
        this.cb = cb;

        if (this.selected) this.toggleDataTable(true);

        return tr;
    }

    toggleDataTable(active) {
        if (active && !this.tr.hasAttribute('checked')) {
            this.tr.setAttribute("checked", "");
            this.cb.setAttribute("checked", "");
        } 
        
        if (!active && this.tr.hasAttribute('checked')) {
            this.tr.removeAttribute("checked");
            this.cb.removeAttribute("checked");
        }
    }

    toggleSelect(active) {
        if (active && !currentItemSelect.includes(this) && currentItemSelect.length < maxPages) {
            if (currentItemSelect.length == 0) {
                loadBackPage(true);
            }

            this.selected = active;

            this.toggleDataTable(active);

            currentItemSelect.push(this);

            const tr = document.createElement('tr');
            const td = document.createElement('td');
            const td2 = document.createElement('td');

            tr.setAttribute('id', this.id)
            td2.setAttribute('class', 'x')

            td.innerText = this.id + " - " + this.data[dataHeaders[3]];
            td2.innerText = '✕';
            tr.appendChild(td);
            tr.appendChild(td2);

            tr.addEventListener('click', () => {
                this.toggleSelect(false);
            });

            selectTable.insertBefore(tr, selectTable.firstChild);

            loadItemCard(this.data);
        }
        
        if (!active && currentItemSelect.includes(this)) {
            this.selected = active;

            this.toggleDataTable(active);

            currentItemSelect.splice(currentItemSelect.indexOf(this), 1);

            selectTable.removeChild(document.getElementById(this.id));

            document.getElementById('bookCardFormat').removeChild(document.getElementById(this.data[dataHeaders[0]]));

            if (currentItemSelect.length == 0) {
                loadBackPage(false);
            }
        }

        /* // Sorted Selected Table (Slow Performance):

        currentItemSelect = currentItemSelect.sort(function(a, b){return a.id - b.id});

        currentItemSelect.forEach((book) => {
            const tr = document.createElement('tr');
            const td = document.createElement('td');

            tr.setAttribute('id', book.id)
            td.innerText = book.id + " - " + book.data[dataHeaders[3]]
            tr.appendChild(td);

            tr.addEventListener('click', () => {
                this.toggleSelect(false);
            });

            selectTable.appendChild(tr);
        }); */

        // if (currentItemSelect.length == 0 || currentItemSelect.length > maxPages) {
        //     generateButton.setAttribute('disabled', '');
        // } else if (generateButton.hasAttribute('disabled')) {
        //     generateButton.removeAttribute('disabled')
        // }

    }
}

class Pagination {
    constructor(obj, itemsPerPage) {
        this.obj = obj;
        this.itemsPerPage = itemsPerPage;
        this.totalPages = Math.ceil(obj.length / itemsPerPage);
    }

    getTotalPages() {
        return this.totalPages;
    }

    getCurrentItems(currentPage) {
        this.startIndex = (currentPage - 1) * this.itemsPerPage;
        this.endIndex = this.startIndex + this.itemsPerPage;
        this.currentItems = this.obj.slice(this.startIndex, this.endIndex);

        dataPagination.innerHTML = '';
        
        for (let i = 1; this.totalPages >= i; i++) {
            const firstItem = (i - 1) * this.itemsPerPage + 1;
            const lastItem = this.obj.slice(firstItem - 1, firstItem - 1 + this.itemsPerPage).length + (firstItem - 1);

            const p = document.createElement('p');
            
            if (firstItem == lastItem) {p.innerText = firstItem} 
            else {p.innerText = firstItem + "-" + lastItem};

            if (i == currentPage) {
                p.setAttribute('current-page', '');
            }

            p.addEventListener('click', () => {
                loadTable(this.getCurrentItems(i));
                selectAll(false);
            })

            dataPagination.appendChild(p);
        }

        return this.currentItems;
    }
}


function loadTable() {
    // Fetch the inventory items from the backend
    fetch('/api/inventory')
        .then(response => response.json())
        .then(data => {
            // Get the table body element where data will be inserted
            const tableBody = document.querySelector('#dataTable tbody');
            
            // Clear any existing rows (optional)
            tableBody.innerHTML = '';

            // Loop through the fetched data and add rows to the table
            data.forEach(item => {
                const row = document.createElement('tr');
                row.setAttribute('class', item.id);
                
                // Create table data cells and append to the row
                const statusCell = document.createElement('td');
                statusCell.textContent = item.status.toUpperCase();  // Assuming your table has 'status'
                row.appendChild(statusCell);

                const nameCell = document.createElement('td');
                nameCell.textContent = item.name;  // Assuming your table has 'name'
                row.appendChild(nameCell);

                const quantityCell = document.createElement('td');
                quantityCell.textContent = item.quantity;  // Assuming your table has 'quantity'
                row.appendChild(quantityCell);

                const locationCell = document.createElement('td');
                locationCell.textContent = item.location;  // Assuming your table has 'location'
                row.appendChild(locationCell);

                // Append the row to the table
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function enablePopUp() {
    const table = document.getElementById("dataTable");

    // Create the overlay
    const overlay = document.createElement("div");
    overlay.id = "overlay";
    document.body.appendChild(overlay);

    // Create the pop-up
    const popup = document.createElement("div");
    popup.id = "popup";
    document.body.appendChild(popup);

    // Create buttons with unique IDs
    const closeButton = document.createElement("button");
    closeButton.id = "closeButton";
    closeButton.textContent = "Close";

    const updateButton = document.createElement("button");
    updateButton.id = "updateButton";
    updateButton.textContent = "Update";

    const deleteButton = document.createElement("button");
    deleteButton.id = "deleteButton";
    deleteButton.textContent = "Delete";

    // Append buttons to the pop-up
    popup.appendChild(closeButton);
    popup.appendChild(updateButton);
    popup.appendChild(deleteButton);

    // Close pop-up and overlay
    closeButton.addEventListener("click", () => {
        clodePopUp()
    });

    overlay.addEventListener("click", () => {
        clodePopUp()
    });

    // Show pop-up with data on row click
    table.addEventListener("click", (e) => {
        const row = e.target.closest("tr");
        if (row && row.rowIndex !== 0) { // Skip header row
            const details = Array.from(row.children).map(cell => cell.textContent);

            popup.innerHTML = `
                <h2>${details[1]}</h2>
                <ul>
                    <li><b>${details[0]}</b></li>
                    <li>${details[2]}</li>
                    <li>${details[3]}</li>
                </ul>
                <h4>Description</h4>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            `;
            popup.appendChild(updateButton); // Re-add buttons
            popup.appendChild(deleteButton);
            popup.appendChild(closeButton);

            popup.style.display = "block";
            overlay.style.display = "block";

            // Attach action logic for buttons
            attachButtonListeners(details[0]); // Pass unique identifier (e.g., item ID)
        }
    });

    function clodePopUp() {
        popup.style.display = "none";
        overlay.style.display = "none";
    }

    function attachButtonListeners(itemId) {
        updateButton.onclick = () => {
            alert(`Update feature for Item ID: ${itemId} coming soon!`);
        };

        deleteButton.onclick = () => {
            const confirmDelete = confirm(`Are you sure you want to delete Item ID: ${itemId}?`);
            if (confirmDelete) {
                alert(`Item ID: ${itemId} deleted successfully!`);
                clodePopUp()
            }
        };
    }   
}