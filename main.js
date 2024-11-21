// Link to extract TSV Data from the Accession Record Spreadsheet:
// let link = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQmt-87iRLXJNLyqg8B-3yjFRU84N2MxI3ekjSW3cn8JiR7E27gXrfalm8kmF__LQ/pub?gid=1587574773&single=true&output=tsv";

const loadingScreen = document.getElementById('loading-screen');

const generateButton = document.getElementById('generate-button');
const dataTable = document.getElementById('acDataTable');
const selectTable = document.getElementById('selectedTable');
const dataPagination = document.getElementById('dataPagination');
const selectPagination = document.getElementById('selectedPagination');
const searchInput = document.getElementById('search-bar');

const dataHeaders = ['Acession number', 'Class', 'Author', 'Title of the Book'];
const headerText = ['ACC NO', 'CALL NO', 'AUTHOR', 'TITLE']; 

let bookObjects = [];
let currentBookObjects = [];
let currentBookSelect = [];


const maxPages = 12;


// let selectMode = true;

// Enable Drag-Selection:
// let mouse_active = false;
// document.addEventListener('mouseup', () => {
//     mouse_active = false;
// });
// document.addEventListener('mousedown', () => {
//     mouse_active = true;
// });

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

    loadTable(new Pagination(searchFilter, 200).getCurrentItems(1));
});

document.addEventListener('DOMContentLoaded', () => {
    // Starting Local Fetch Prompt:
    // fetchLocalData();

    popUp()
});


class Book {
    constructor(json) {
        this.data = json;
        this.id = json[dataHeaders[0]];
        this.selected = false;
    }

    getBookRow() {
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
        if (active && !currentBookSelect.includes(this) && currentBookSelect.length < maxPages) {
            if (currentBookSelect.length == 0) {
                loadBackPage(true);
            }

            this.selected = active;

            this.toggleDataTable(active);

            currentBookSelect.push(this);

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

            loadBookCard(this.data);
        }
        
        if (!active && currentBookSelect.includes(this)) {
            this.selected = active;

            this.toggleDataTable(active);

            currentBookSelect.splice(currentBookSelect.indexOf(this), 1);

            selectTable.removeChild(document.getElementById(this.id));

            document.getElementById('bookCardFormat').removeChild(document.getElementById(this.data[dataHeaders[0]]));

            if (currentBookSelect.length == 0) {
                loadBackPage(false);
            }
        }

        /* // Sorted Selected Table (Slow Performance):

        currentBookSelect = currentBookSelect.sort(function(a, b){return a.id - b.id});

        currentBookSelect.forEach((book) => {
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

        if (currentBookSelect.length == 0 || currentBookSelect.length > maxPages) {
            generateButton.setAttribute('disabled', '');
        } else if (generateButton.hasAttribute('disabled')) {
            generateButton.removeAttribute('disabled')
        }

        selectHeader();

        selectAll(false);
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


function loadTable(objects) {
    dataTable.replaceChildren();

    document.getElementById('dataScroll').scrollTop = 0;

    currentBookObjects = [];
    objects.forEach((book) => {
        currentBookObjects.push(book);
    })

    // Display Column Headers:
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    const cb = document.createElement('input');
    th.setAttribute('class', 'selectHeader');
    cb.setAttribute('type', 'checkbox');
    cb.setAttribute('id', 'selectAll');
    cb.setAttribute('class', 'cb');

    th.addEventListener('click', () => {
        selectAll(true)
    });

    th.appendChild(cb);
    tr.appendChild(th);
    dataHeaders.forEach((key) => {
        var th = document.createElement('th');
        th.innerText = headerText[dataHeaders.indexOf(key)];
        tr.appendChild(th);
    })
    dataTable.appendChild(tr);

    selectHeader();

    // Display Data:
    objects.forEach((book) => {
        dataTable.appendChild(book.getBookRow());
    })

    selectAll(false);
}

function selectHeader() {
    if (selectTable.querySelector('#selectTH')) {
        selectTable.removeChild(document.getElementById('selectTH'));
    }

    const tr = document.createElement('tr');
    const th = document.createElement('th');
    const th2 = document.createElement('th');
    tr.setAttribute('id', 'selectTH');
    th2.setAttribute('class', 'selectHeader x');
    th.innerText = 'SELECTED (' + currentBookSelect.length + ')';
    th2.innerText = '✕';
    tr.appendChild(th);
    th2.addEventListener('click', () => {
        selectNone();
        selectHeader();
    });
    if (currentBookSelect.length != 0) tr.appendChild(th2);
    selectTable.insertBefore(tr, selectTable.firstChild);
}

function selectAll(change) {
    let allSelect = false;
    const cb = document.getElementById('selectAll');

    currentBookObjects.forEach((book) => {
        if (!book.selected) allSelect = true;
    })

    if (!change) {
        if (currentBookSelect.length >= maxPages) {
            cb.setAttribute("checked", "");
            return;
        }

        if (allSelect || currentBookObjects.length == 0) {
            cb.removeAttribute("checked");
        } else {
            cb.setAttribute("checked", "");
        }

        return;
    }

    if (allSelect && currentBookSelect.length < maxPages) {
        cb.setAttribute("checked", "");

        currentBookObjects.forEach((book) => {
            book.toggleSelect(true);
        })
    } else {
        cb.removeAttribute("checked");

        currentBookObjects.forEach((book) => {
            book.toggleSelect(false);
        })
    }
}

function selectNone() {
    while (currentBookSelect.length != 0) {
        currentBookSelect.forEach((book) => {
            book.toggleSelect(false);
        })
    }
}

function popUp() {
    const table = document.getElementById("acDataTable");

    // Create the overlay
    const overlay = document.createElement("div");
    overlay.id = "overlay";
    document.body.appendChild(overlay);

    // Create the pop-up
    const popup = document.createElement("div");
    popup.id = "popup";
    document.body.appendChild(popup);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    popup.appendChild(closeButton);

    // Close pop-up and overlay on button click
    closeButton.addEventListener("click", () => {
        popup.style.display = "none";
        overlay.style.display = "none";
    });

    overlay.addEventListener("click", () => {
        popup.style.display = "none";
        overlay.style.display = "none";
    });

    // Show pop-up with data on row click
    table.addEventListener("click", (e) => {
        const row = e.target.closest("tr");
        if (row && row.rowIndex !== 0) { // Skip header row
            const details = Array.from(row.children).map(cell => cell.textContent);

            popup.innerHTML = `
                <h2>${details[1]}</h2>
                <ul>
                    <li>${details[2]}</li>
                    <li>${details[3]} ${details[4]}</li>
                    <li>${details[5]}</li>
                </ul>
            `;
            popup.appendChild(closeButton); // Re-add the close button
            popup.style.display = "block";
            overlay.style.display = "block";
        }
    });
}





// Data Fetching:
async function fetchLocalData() {
    loadingScreen.style.display = 'flex';

    await fetch('ar_data.json')
    .then((response) => response.json())
    .then((json) => {
        bookObjects = [];
        selectNone();

        json.forEach((book) => {
            if (book[dataHeaders[0]] != '') {
                bookObjects.push(new Book(book));
            }
        })

        bookObjects = bookObjects.sort(function(a, b){return a.id - b.id});

        loadTable(new Pagination(bookObjects, 200).getCurrentItems(1));
    })
    .catch(error => {
        fetchError("Local", error);
    });

    document.getElementById('search-bar').value = '';

    loadingScreen.style.display = 'none';
}

// async function fetchRemoteData() {
//     loadingScreen.style.display = 'flex';

//     await fetch(link)
//     .then((response) => response.text())
//     .then((tsv) => {
//         const json = tsvToJSON(tsv);

//         if (!Object.keys(json[0]).includes(dataHeaders[0])) {
//             fetchError("Remote", "Unreadable Data.");
//             return;
//         };

//         try {
//             let xhr = new XMLHttpRequest();
//             xhr.open('POST', 'write.php');
//             xhr.setRequestHeader('Content-Type', 'application/json');
//             xhr.onload = () => {
//                 fetchLocalData();
//                 if (xhr.status === 200) {
//                     console.log(xhr.responseText);
//                 } else {
//                     console.log('PHP: Request failed.  Returned status of ' + xhr.status);
//                 }
//             };
//             xhr.send(JSON.stringify(json));
//         } catch (error) {
//             fetchError("Remote", "XMLHttp Request Error.");
//         }
//     })
//     .catch(error => {
//         fetchError("Remote", error);
//     });

//     loadingScreen.style.display = 'none';
// }

// function fetchUploadedData() {
//     const fileUpload = document.getElementById('file-upload');
    
//     const file = fileUpload.files[0];

//     if (fileUpload && fileUpload.value) {
//         console.log(`Uploading file: ${file.name}`);

//         const reader = new FileReader();

//         reader.onload = function(event) {
//             const contents = event.target.result;
        
//             const json = tsvToJSON(contents);

//             if (!Object.keys(json[0]).includes(dataHeaders[0])) {
//                 fetchError("Upload", "Unreadable Data.");
//                 return;
//             };
        
//             try {
//                 let xhr = new XMLHttpRequest();
//                 xhr.open('POST', 'write.php');
//                 xhr.setRequestHeader('Content-Type', 'application/json');
//                 xhr.onload = () => {
//                     if (xhr.status === 200) {
//                         fetchLocalData();
//                         console.log(xhr.responseText);
//                     } else {
//                         console.log('PHP: Request failed.  Returned status of ' + xhr.status);
//                     }
//                 };
//                 xhr.send(JSON.stringify(json));
//             } catch (error) {
//                 fetchError("Upload", "XMLHttp Request Error.");
//             }
//         };
//         reader.readAsText(file);
//     } else {
//         console.log('No file has been uploaded.');
//     }
// }

function fetchError(type, error) {
    console.log(type + " Data Fetch Error: " + error);
    
    if (type != "Local") fetchLocalData();
}

// function tsvToJSON(tsv) {
//     const lines = tsv.split('\n');
//     const headers = lines[0].split('\t').filter(header => header.trim() !== '');
//     const result = [];
    
//     for (let i = 1; i < lines.length; i++) {
//         const obj = {};
//         const currentline = lines[i].split('\t');
      
//         for (let j = 0; j < headers.length; j++) {
//             const header = headers[j];
//             const value = currentline[j];
//             if (header.trim() !== '') {
//                 obj[header] = currentline[j];
//             }
//         }
      
//         result.push(obj);
//     }

//     return result;
// }

// async function generatePDF() {
//     if (currentBookSelect.length == 0 || currentBookSelect.length > maxPages) {return}

//     const element = document.getElementById('bookCardFormat');
    
//     // Index Card Size (mm): [76.2, 127]

//     const opt = {
//         margin: 0,

//         pageWidth: '76.2mm',
//         pageHeight: '127mm',

//         filename: 'book_card.pdf',
//         image: { type: 'jpeg', quality: 0.1 },
//         html2canvas: { scale: 10 },
//         jsPDF: { unit: 'mm', format: [76.2, 127], orientation: 'portrait' },
//     };

//     loadingScreen.style.display = 'flex';
    
//     await html2pdf().set(opt).from(element).save();

//     loadingScreen.style.display = 'none';
// }

// function loadBookCard(book) {

//     const bookCardFormat = document.getElementById('bookCardFormat');

//     const page = document.createElement('section');
//     page.setAttribute('class', 'page');
//     page.setAttribute('id', book[dataHeaders[0]]);

//     const pageContent = document.createElement('div');
//     pageContent.setAttribute('class', 'page-content');

//     const mainContent = document.createElement('div');


//     const pageHeaderContainer = document.createElement('div');
//     pageHeaderContainer.setAttribute('class', 'page-title-container flex-row');

//     const iacLogo = document.createElement('img')
//     iacLogo.setAttribute('src', 'Assets/icalogo.png');
//     const libHeader = document.createElement('h1');
//     libHeader.innerText = 'iACADEMY LIBRARY';
//     pageHeaderContainer.appendChild(iacLogo);
//     pageHeaderContainer.appendChild(libHeader);


//     const titleContainer = document.createElement('div');
//     titleContainer.setAttribute('class', 'title-container');
//     const title = document.createElement('h3');

//     title.innerText =  book[dataHeaders[3]]; // TITLE HERE

//     const titleHr = document.createElement('hr');
//     const titleHeader = document.createElement('h5');
//     titleHeader.innerText = '(TITLE)';
//     titleContainer.appendChild(title);
//     titleContainer.appendChild(titleHr);
//     titleContainer.appendChild(titleHeader);


//     const authorContainer = document.createElement('div');
//     authorContainer.setAttribute('class', 'author-container');
//     const author = document.createElement('h3');

//     author.innerText = book[dataHeaders[2]]; // AUTHOR HERE

//     const authorHr = document.createElement('hr');
//     const authorHeader = document.createElement('h5');
//     authorHeader.innerText = '(AUTHOR)';
//     authorContainer.appendChild(author);
//     authorContainer.appendChild(authorHr);
//     authorContainer.appendChild(authorHeader);


//     const callaccContainer = document.createElement('div');
//     callaccContainer.setAttribute('class', 'callacc-container flex-row');

//     const callNoContainer = document.createElement('div');
//     callNoContainer.setAttribute('class', 'call-no flex-row');
//     const callNoHeader = document.createElement('h5');
//     callNoHeader.innerText = 'CALL NO.';
//     const callNo = document.createElement('p')
    
//     callNo.innerText = book[dataHeaders[1]]; // CALL NO HERE

//     callNoContainer.appendChild(callNoHeader);
//     callNoContainer.appendChild(callNo);
//     callaccContainer.appendChild(callNoContainer);

//     const accNoContainer = document.createElement('div');
//     accNoContainer.setAttribute('class', 'acc-no flex-row');
//     const accNoHeader = document.createElement('h5');
//     accNoHeader.innerText = 'ACC NO.';
//     const accNo = document.createElement('p')
    
//     accNo.innerText = book[dataHeaders[0]]; // ACC NO HERE

//     accNoContainer.appendChild(accNoHeader);
//     accNoContainer.appendChild(accNo);
//     callaccContainer.appendChild(accNoContainer);

//     const tableContainer = document.createElement('div');
//     const table = document.createElement('table');
//     const trHeaders = document.createElement('tr');

//     const th1 = document.createElement('th');
//     th1.setAttribute('class', 'date');
//     const th2 = document.createElement('th');
//     th2.setAttribute('class', 'name');
//     const th3 = document.createElement('th');
//     th3.setAttribute('class', 'level');

//     th1.innerText = 'DATE';
//     th2.innerText = 'NAME';
//     th3.innerText = 'LEVEL';
    
//     trHeaders.appendChild(th1);
//     trHeaders.appendChild(th2);
//     trHeaders.appendChild(th3);

//     table.appendChild(trHeaders);

//     const trCount = 30;
    
//     for (let i = 0; trCount > i; i++) {
//         const tr = document.createElement('tr');

//         for (let i = 0; 3 > i; i++) {
//             const td = document.createElement('td');
//             tr.appendChild(td);
//         }

//         table.appendChild(tr);
//     }

//     tableContainer.appendChild(table);


//     mainContent.appendChild(pageHeaderContainer);
//     mainContent.appendChild(titleContainer);
//     mainContent.appendChild(authorContainer);
//     mainContent.appendChild(callaccContainer);

//     pageContent.appendChild(mainContent);
//     pageContent.appendChild(tableContainer);


//     page.appendChild(pageContent);

//     bookCardFormat.insertBefore(page, bookCardFormat.firstChild);



//     const tableHeight = table.offsetHeight;
//     const containerHeight = page.offsetHeight - (page.offsetHeight * 0.1) - mainContent.offsetHeight;

//     if (tableHeight > containerHeight) {
//         // calculate how many rows have overflowed
//         const rowHeight = table.querySelector('tr').offsetHeight;
//         const numRows = Math.floor(containerHeight / rowHeight);
        
//         // remove the overflowing rows
//         const rowsToRemove = Array.from(table.rows).slice(numRows);
//         rowsToRemove.forEach(row => row.remove());
//     }
// }

// function loadBackPage(active) {
//     if (active) {
//         const bookCardFormat = document.getElementById('bookCardFormat');

//         const page = document.createElement('section');
//         page.setAttribute('class', 'page');
//         page.setAttribute('id', 'back-page');

//         const pageContent = document.createElement('div');
//         pageContent.setAttribute('class', 'page-content');


//         const tableContainer = document.createElement('div');
//         const table = document.createElement('table');
//         const trHeaders = document.createElement('tr');

//         const th1 = document.createElement('th');
//         th1.setAttribute('class', 'date');
//         const th2 = document.createElement('th');
//         th2.setAttribute('class', 'name');
//         const th3 = document.createElement('th');
//         th3.setAttribute('class', 'level');

//         th1.innerText = 'DATE';
//         th2.innerText = 'NAME';
//         th3.innerText = 'LEVEL';
        
//         trHeaders.appendChild(th1);
//         trHeaders.appendChild(th2);
//         trHeaders.appendChild(th3);

//         table.appendChild(trHeaders);

//         const trCount = 40;
        
//         for (let i = 0; trCount > i; i++) {
//             const tr = document.createElement('tr');

//             for (let i = 0; 3 > i; i++) {
//                 const td = document.createElement('td');
//                 tr.appendChild(td);
//             }

//             table.appendChild(tr);
//         }

//         tableContainer.appendChild(table);

//         pageContent.appendChild(tableContainer);

//         page.appendChild(pageContent);

//         bookCardFormat.insertBefore(page, bookCardFormat.firstChild);



//         const tableHeight = table.offsetHeight;
//         const containerHeight = page.offsetHeight - (page.offsetHeight * 0.1);

//         if (tableHeight > containerHeight) {
//             // calculate how many rows have overflowed
//             const rowHeight = table.querySelector('tr').offsetHeight;
//             const numRows = Math.floor(containerHeight / rowHeight);
            
//             // remove the overflowing rows
//             const rowsToRemove = Array.from(table.rows).slice(numRows);
//             rowsToRemove.forEach(row => row.remove());
//         }
//     } else {
//         document.getElementById('back-page').remove();
//     }
// }


// const currentUrl = window.location.href;

// const adminInput = document.getElementById('file-upload');
// const adminButton = document.getElementById('upload-button');

// if (currentUrl.includes('MgHiUF8lqrI7hrcHk2PIlskBnEuQMM4BEZh4lzSdd4w=')) {
//     adminInput.addEventListener('input', function() {
//         if (adminInput.value.trim() === '') {
//             adminButton.disabled = true;
//         } else {
//             adminButton.disabled = false;
//         }
//     });
// } else {
//     adminInput.remove();
//     adminButton.remove();
// }