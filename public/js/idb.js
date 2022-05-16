//variable for db connection
let db;
//Establishes connection to IndexedBD db and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

//this will update the version when db changes
request.onupgradeneeded = function(event) {
    //save reference to db
    const db = event.target.result;
    //create an object store, set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

//creating a db with its object store
request.onsuccess = function(event) {
    //save reference to db in global variable
    db = event.target.result;
};

//checking if app is online, if yes run uploadTransaction() function to send all local db data to API
if (navigator.onLine) {
    uploadTransaction();
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

//This function is executed when submitting a new transaction without internet connection
function saveRecord(record) {
    //opens new transaction with read/write permissions
    const transaction = db.transaction(['new_transaction',], 'readwrite');
    //access the object store
    const budgetObjectStore = transaction.budgetObjectStore('new_transaction');
    //add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadTransaction() {
    //open a transaction on db
    const transaction = db.transaction(['new_transaction',], 'readwrite');
    //access object store for 'new_transaction'
    const budgetObjectStore = transaction.budgetObjectStore('new_transaction');
    //get all records from store and set to a variable number
    const getAll = budgetObjectStore.getAll();

    //execute .getAll()
    getAll.onsuccess = function() {
        //if there was data in IndexedDB's store, lets send it to API Server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //To open one more transaction
                const transaction = db.transaction(['new_transaction',], 'readwrite');
                //To access the new_transaction object store
                const budgetObjectStore = transaction.budgetObjectStore('new_transaction');
                //To clear all items in your store
                budgetObjectStore.clear();
            })
            .catch(err => {
                //Set reference to redirect back here
                console.log(err);
            });

        }
    };
}
