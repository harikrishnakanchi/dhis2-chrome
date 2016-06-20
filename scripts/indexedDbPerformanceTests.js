var runTest = function() {
    var STORE_NAME = 'organisationUnits',
        req, transaction, objectStore;

    var openDb = function(dbName, successFn) {
        if(!("indexedDB" in window)) {
            throw "error: indexedDB not supported."
        } else {
            var openRequest = indexedDB.open(dbName);

            openRequest.onsuccess = function(e) {
                successFn(e.target.result);
            };

            openRequest.onerror = function(e) {
                console.log("Error: could not open database");
            };
        }
    };

    var testGetAll = function(db) {
        transaction = db.transaction(STORE_NAME, "readonly");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testGetAll');
        req = objectStore.getAll();
        req.onsuccess = req.onerror = function(e) {
            console.timeEnd('testGetAll');
            var orgUnits = e.target.result;
            console.log('orgUnits: ', orgUnits.length);
        };
    };

    var testGetAllWithReadWriteTransaction = function(db) {
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testGetAllWithReadWriteTransaction');
        req = objectStore.getAll();
        req.onsuccess = req.onerror = function(e) {
            console.timeEnd('testGetAllWithReadWriteTransaction');
            var orgUnits = e.target.result;
            console.log('orgUnits: ', orgUnits.length);
        };
    };

    var testGetAllWithCursor = function(db) {
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testGetAllWithCursor');
        var orgUnits = [];
        req = objectStore.openCursor();
        req.onsuccess = function(e) {
            var cursor = e.target.result;
            if(cursor) {
                orgUnits.push(cursor.value);
                cursor.continue();
            } else {
                console.timeEnd('testGetAllWithCursor');
                console.log('orgUnits: ', orgUnits.length);
            }
        };
    };

    var testGet = function(db) {
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testGet');
        req = objectStore.get('ac942b0f314');
        req.onsuccess = function(e) {
            var cursor = e.target.result;
            console.timeEnd('testGet');
            console.log('orgUnit: ', cursor.value);
        };
    };

    var testCursorWithKeyRangeOnly = function(db) {
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testCursorWithKeyRangeOnly');
        var orgUnits = [];
        req = objectStore.openCursor(IDBKeyRange.only('ac942b0f314'));
        req.onsuccess = function(e) {
            var cursor = e.target.result;
            if(cursor) {
                orgUnits.push(cursor.value);
                cursor.continue();
            } else {
                console.timeEnd('testCursorWithKeyRangeOnly');
                console.log('orgUnits: ', orgUnits.length);
            }
        };
    };

    var testCursorWithKeyRangeBound = function(db) {
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testCursorWithKeyRangeBound');
        var orgUnits = [];
        req = objectStore.openCursor(IDBKeyRange.bound('ac942b0f314', 'ac942b0f314'));
        req.onsuccess = function(e) {
            var cursor = e.target.result;
            if(cursor) {
                orgUnits.push(cursor.value);
                cursor.continue();
            } else {
                console.timeEnd('testCursorWithKeyRangeBound');
                console.log('orgUnits: ', orgUnits.length);
            }
        };
    };

    var testFindAllWithCursor = function(db) {
        var parentIds = ["a0f9b7ceb46", "a4113d91a74", "a8549a1f334", "a87c87ab3aa", "a2b5312f50c", "a6e473b1bc9", "a92f69580e8", "ab31ea68dca", "a69cc45b4b4", "a8fcd3619d8", "a9437a0828c", "ad272fbcb70", "a329cd98589", "a6fbd65eccf", "a74f119e557", "abd19473a1d", "a24d00fde4a", "a3e5a22bcd0", "a8f472b5d40", "acd5b3f9503", "a2937f49aea", "a3103f88b25", "a4bf24606fe", "a4c1b6d17ac", "a4e705cc3c3", "a563a821021", "a5740b2e6c9", "a7db412f24f", "ab47122e0cd", "ae62ff677bb"];
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testFindAllWithCursor');
        req = objectStore.index('by_parent').openCursor(null, 'next');
        var sortedParentIds = parentIds.sort();
        var orgUnits = [];
        req.onsuccess = function(e) {
            var foundAMatch = function() {
                orgUnits.push(cursor.value);
                cursor.continue();
            };

            var finishedQuery = function() {
                console.timeEnd('testFindAllWithCursor');
                console.log('orgUnits: ', orgUnits.length);
            };

            var cursor = e.target.result;
            if (!cursor) {
                finishedQuery();
                return;
            }

            var i = 0;
            var currentId = cursor.key;
            while (currentId > sortedParentIds[i]) {
                i++;
                if (i === sortedParentIds.length) {
                    finishedQuery();
                    return;
                }
            }
            currentId === sortedParentIds[i] ? foundAMatch() : cursor.continue(sortedParentIds[i]);
        };
    };

    var init = function() {
        openDb('msf', function(db) {
            //testGetAll(db);
            //testGetAllWithReadWriteTransaction(db);
            //testGetAllWithCursor(db);
            //testGet(db);
            //testCursorWithKeyRangeOnly(db);
            //testCursorWithKeyRangeBound(db);
            testFindAllWithCursor(db);
        });
    };

    init();
};
runTest();