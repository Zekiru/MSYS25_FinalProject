const searchInput = document.getElementById('search-bar');
const usernameDisplay = document.getElementById('username');
const tableBody = document.querySelector('#dataTable tbody');
const addItemButton = document.getElementById("addItemButton");
const addItemForm = document.getElementById("itemForm");
const addItemPopup = document.getElementById("itemPopup");
const addCloseButton = document.getElementById("formCloseButton");
const itemIdField = document.getElementById('itemId');
const itemUsernameField = document.getElementById('itemUsername');
const itemRoleField = document.getElementById('itemRole');
const itemPasswordField = document.getElementById('itemPassword');
const formSubmitButton = document.getElementById('formSubmitButton');
const itemUserameLabel = document.getElementById('itemUserameLabel');
const itemRoleLabel = document.getElementById('itemRoleLabel');
const itemPasswordLabel = document.getElementById('itemPasswordLabel');
const overlay = document.getElementById("overlay");

document.addEventListener('DOMContentLoaded', () => {
    updateUser();
    updateTable();  
    enableAddItems();
    enableEventListeners();
});

function enableEventListeners() {
    // Add event listeners
    searchInput.addEventListener('input', updateTable);
}

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
    const input = searchInput.value.trim();

    let url = '/api/users';

    if (input.length >= 1) {
        url = `/api/search-users?searchTerm=${encodeURIComponent(input)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(loadTable)
        .catch(console.error);
}

function loadTable(data) {
    const tableBody = document.querySelector('#dataTable tbody');
    const currentUsername = usernameDisplay.textContent;
    tableBody.innerHTML = '';
    if (Array.isArray(data.users)) {
        data.users.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.username}</td>
                <td>${item.role.toUpperCase()}</td>
                <td class="manageButtons">
                    <button class="edit-btn" data-id="${item.id}">Edit</button>
                    <button class="delete-btn" data-id="${item.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);

            const editButton = row.querySelector('.edit-btn');
            const deleteButton = row.querySelector('.delete-btn');

            if (item.username == currentUsername) {
                editButton.disabled = true; // Disable editing your own account
                deleteButton.disabled = true; // Disable deleting your own account
            } else {
                editButton.addEventListener('click', () => {
                    handleEdit(item);
                });

                deleteButton.addEventListener('click', () => {
                    handleDelete(item.id);
                });
            }
        });
    }
}

function handleEdit(item) {
    populateFormForUpdate(item);
    showPopUp(addItemPopup);
}

function handleDelete(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        fetch(`/api/delete-user/${userId}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) updateTable();
                else alert('Failed to delete user');
            })
            .catch(error => {
                console.error(error);
                alert('An error occurred while deleting the user');
            });
    }
    
}

function showPopUp(element) {
    overlay.style.display = "block";
    element.style.display = "block";
}

function closePopUp(element) {
    element.style.display = "none";
    overlay.style.display = "none";
}

function enablePopUpActions() {
    
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
        username: itemUsernameField.value,
        role: itemRoleField.value,
        password: itemPasswordField.value
    };

    try {
        let response;

        if (id) {
            response = await fetch(`/api/update-user/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData),
            });
        } else {
            response = await fetch('/register', {
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
    itemHeader.textContent = 'Edit User';
    itemIdField.value = item.id;
    itemUsernameField.value = item.username;
    itemRoleField.value = item.role;
    itemPasswordField.value = '';
    formSubmitButton.textContent = 'Edit';

    itemUserameLabel.textContent = 'Change Username:';
    itemRoleLabel.textContent = `Change Role (${item.role.toUpperCase()}):`;
    itemPasswordLabel.textContent = `Change Password:`;

    itemPasswordField.required = false;
}

function prepareFormForAdd() {
    clearForm();
    itemHeader.textContent = 'Create Item';
    formSubmitButton.textContent = 'Create';

    itemUserameLabel.textContent = 'Username:';
    itemRoleLabel.textContent = 'Role:';
    itemPasswordLabel.textContent = 'Password:';

    itemPasswordField.required = true;
}
