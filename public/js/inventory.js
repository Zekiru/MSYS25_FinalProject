// Define elements outside functions
const searchInput = document.getElementById('search-bar');
const logoutButton = document.getElementById('logoutButton');
const addItemButton = document.getElementById("addItemButton");
const addItemForm = document.getElementById("itemForm");
const addItemPopup = document.getElementById("itemPopup");
const addCloseButton = document.getElementById("formCloseButton");
const updateButton = document.getElementById("updateButton");
const transferButton = document.getElementById("transferButton");
const deleteButton = document.getElementById("deleteButton");
const closeButton = document.getElementById("closeButton");
const usernameDisplay = document.getElementById('username');
const popup = document.getElementById("popup");
const tableBody = document.querySelector('#dataTable tbody');
const itemDetails = document.getElementById("itemDetails");
const descriptionField = document.getElementById("description");
const itemHeader = document.getElementById('itemHeader');
const itemIdField = document.getElementById('itemId');
const itemNameField = document.getElementById('itemName');
const itemStatusField = document.getElementById('itemStatus');
const itemQuantityField = document.getElementById('itemQuantity');
const itemDescriptionField = document.getElementById('itemDescription');
const itemLocationField = document.getElementById('itemLocation');
const formSubmitButton = document.getElementById('formSubmitButton');
const itemDescriptionLabel = document.getElementById('itemDescriptionLabel');
const overlay = document.getElementById("overlay");

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    updateTable();
    updateUser();
    enablePopUpActions();
    enableAddItems();
});

searchInput.addEventListener('input', () => updateTable());

function updateUser() {
    fetch('/api/user-info')
        .then(response => response.ok ? response.json() : Promise.reject('Failed to fetch user info'))
        .then(data => {
            usernameDisplay.textContent = data.username;

            manageAccountsButton = document.getElementById('manageAccountsButton');
            if (data.role != 'admin') {
                manageAccountsButton.style.display = 'none';
            } else {
                manageAccountsButton.style.display = 'inline';
            }

            if (data.role === 'reader') {
                const editButtons = document.getElementsByClassName('editButton');
                for (let button of editButtons) {
                    button.setAttribute('hidden', '');
                }
            } else {
                const editButtons = document.getElementsByClassName('editButton');
                for (let button of editButtons) {
                    button.removeAttribute('hidden');
                }
            }
        })
        .catch(error => {
            console.error(error);
            window.location.href = '/login.html';
        });
}

function updateTable() {
    const input = searchInput.value;
    const url = input.length < 3 ? '/api/inventory' : `/api/search-items?query=${input}`;
    fetch(url)
        .then(response => response.json())
        .then(loadTable)
        .catch(console.error);
}

function loadTable(data) {
    tableBody.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="${item.status === 'available' ? 'green' : item.status === 'in-use' ? 'red' : ''}">${item.status.toUpperCase()}</td>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.location}</td>
        `;
        row.addEventListener('click', () => {
            loadItemCard(item);
            populateFormForUpdate(item);
            showPopUp(popup);
        });
        tableBody.appendChild(row);
    });
}

function loadItemCard(item) {
    const color = item.status === 'available' ? 'green' : item.status === 'in-use' ? 'red' : '';
    document.querySelector("#popup h2").textContent = item.name;
    itemDetails.innerHTML = `
        <li><h3 class="${color}">${item.status.toUpperCase()}</h3></li>
        <li><b>Quantity:</b> ${item.quantity}</li>
        <li><b>Location:</b> ${item.location}</li>
    `;
    descriptionField.textContent = item.description;
    popup.dataset.itemId = item.id;
}

function showPopUp(element) {
    overlay.style.display = "block";
    element.style.display = "block";
}

function closePopUp(element) {
    element.style.display = "none";
    overlay.style.display = "none";
}

function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        fetch(`/api/delete-item/${itemId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) updateTable();
                else alert('Failed to delete item');
                closePopUp(popup);
            })
            .catch(error => {
                console.error(error);
                alert('An error occurred while deleting the item');
            });
    }
}

async function addItem() {
    const itemData = {
        name: itemNameField.value,
        status: itemStatusField.value,
        quantity: itemQuantityField.value,
        description: itemDescriptionField.value,
        location: itemLocationField.value
    };

    try {
        const response = await fetch('/api/add-item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData),
        });
        const data = await response.json();
        if (data.success) {
            updateTable();
            closePopUp(addItemPopup);
            addItemForm.reset();
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred while adding the item.');
    }
}

function enablePopUpActions() {
    updateButton.addEventListener('click', () => {
        const itemId = popup.dataset.itemId;
        if (itemId) {
            closePopUp(popup);
            showPopUp(addItemPopup);
        }
    });

    transferButton.addEventListener('click', () => {
        const itemId = popup.dataset.itemId;
        if (itemId) {
            closePopUp(popup);
            prepareFormForTransfer();
            showPopUp(addItemPopup);
        }
    });

    deleteButton.addEventListener('click', () => {
        const itemId = popup.dataset.itemId;
        if (itemId) deleteItem(itemId);
    });

    closeButton.addEventListener('click', () => closePopUp(popup));
}

function enableAddItems() {
    addItemButton.addEventListener("click", () => {
        prepareFormForAdd();
        showPopUp(addItemPopup);
    });

    addCloseButton.addEventListener("click", () => closePopUp(addItemPopup));

    addItemForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleItemForm();
    });
}

async function handleItemForm() {
    const id = itemIdField.value;
    const itemData = {
        name: itemNameField.value,
        status: itemStatusField.value,
        quantity: parseInt(itemQuantityField.value, 10),
        description: itemDescriptionField.value,
        location: itemLocationField.value
    };

    try {
        let response;

        if (id && formSubmitButton.textContent === 'Transfer') {
            const transferQuantity = itemData.quantity;
            const newItem = { ...itemData, quantity: transferQuantity };
            response = await fetch('/api/split-transfer-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalId: id, newItem, transferQuantity }),
            });
        } else if (id) {
            response = await fetch(`/api/update-item/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData),
            });
        } else {
            response = await fetch('/api/add-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData),
            });
        }

        const data = await response.json();
        if (data.success) {
            clearForm();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Failed to process the form');
    }

    updateTable();
    closePopUp(addItemPopup);
}

function clearForm() {
    addItemForm.reset();
    itemIdField.value = '';
}

function populateFormForUpdate(item) {
    itemHeader.textContent = 'Update Item';
    itemIdField.value = item.id;
    itemNameField.value = item.name;
    itemStatusField.value = item.status;
    itemQuantityField.value = item.quantity;
    itemDescriptionField.value = item.description;
    itemLocationField.value = item.location;
    formSubmitButton.textContent = 'Update';
    itemDescriptionLabel.removeAttribute('hidden');
    itemDescriptionField.removeAttribute('hidden');
    itemQuantityField.removeAttribute('max');
}

function prepareFormForAdd() {
    clearForm();
    itemHeader.textContent = 'Create Item';
    formSubmitButton.textContent = 'Create';
    itemDescriptionLabel.removeAttribute('hidden');
    itemDescriptionField.removeAttribute('hidden');
    itemQuantityField.removeAttribute('max');
}

function prepareFormForTransfer() {
    itemHeader.textContent = 'Transfer Item/s';
    formSubmitButton.textContent = 'Transfer';
    itemDescriptionLabel.setAttribute('hidden', true);
    itemDescriptionField.setAttribute('hidden', true);
    itemQuantityField.setAttribute('max', itemQuantityField.value);
}

function updateQuantity(value) {
    itemQuantityField.setAttribute("max", value);
}
