let db;
const request = indexedDB.open('Budget_tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('new_tracker', { autoIncrement: true });
};

request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        uploadData();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('new_tracker');

    // add record to your store with add method.
    budgetObjectStore.add(record);
}

function uploadData() {
    // open a transaction on your pending db
    const transaction = db.transaction(['new_tracker'], 'readwrite');

    // access your pending object store
    const budgetObjectStore = transaction.objectStore('new_tracker');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }

                    const transaction = db.transaction(['new_tracker'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('new_tracker');
                    // clear all items in your store
                    budgetObjectStore.clear();
                })
                .catch(err => {
                    // set reference to redirect back here
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadData);
