var runTest = function(testNumber) {
    var STORE_NAME = 'organisationUnits',
        req, transaction, objectStore;

    var PARENT_IDS = ["a0f9b7ceb46", "a4113d91a74", "a8549a1f334", "a87c87ab3aa", "a2b5312f50c", "a6e473b1bc9", "a92f69580e8", "ab31ea68dca", "a69cc45b4b4", "a8fcd3619d8", "a9437a0828c", "ad272fbcb70", "a329cd98589", "a6fbd65eccf", "a74f119e557", "abd19473a1d", "a24d00fde4a", "a3e5a22bcd0", "a8f472b5d40", "acd5b3f9503", "a2937f49aea", "a3103f88b25", "a4bf24606fe", "a4c1b6d17ac", "a4e705cc3c3", "a563a821021", "a5740b2e6c9", "a7db412f24f", "ab47122e0cd", "ae62ff677bb"];

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

    var testGetWithCursorAndKeyRangeOnly = function(db) {
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testGetWithCursorAndKeyRangeOnly');
        var orgUnits = [];
        req = objectStore.openCursor(IDBKeyRange.only('ac942b0f314'));
        req.onsuccess = function(e) {
            var cursor = e.target.result;
            if(cursor) {
                orgUnits.push(cursor.value);
                cursor.continue();
            } else {
                console.timeEnd('testGetWithCursorAndKeyRangeOnly');
                console.log('orgUnits: ', orgUnits.length);
            }
        };
    };

    var testGetWithCursorAndKeyRangeBound = function(db) {
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testGetWithCursorAndKeyRangeBound');
        var orgUnits = [];
        req = objectStore.openCursor(IDBKeyRange.bound('ac942b0f314', 'ac942b0f314'));
        req.onsuccess = function(e) {
            var cursor = e.target.result;
            if(cursor) {
                orgUnits.push(cursor.value);
                cursor.continue();
            } else {
                console.timeEnd('testGetWithCursorAndKeyRangeBound');
                console.log('orgUnits: ', orgUnits.length);
            }
        };
    };

    var testFindAllWithCursor = function(db) {
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testFindAllWithCursor');
        req = objectStore.index('by_parent').openCursor(null, 'next');
        var sortedParentIds = PARENT_IDS.sort();
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

    var testFindAllWithCursorWithHalfArray = function(db) {
        var parentIds = ["a0f9b7ceb46", "a4113d91a74", "a8549a1f334", "a87c87ab3aa", "a2b5312f50c", "a6e473b1bc9", "a92f69580e8", "ab31ea68dca", "a69cc45b4b4", "a8fcd3619d8", "a9437a0828c", "ad272fbcb70", "a329cd98589", "a6fbd65eccf", "a74f119e557", "abd19473a1d", "a24d00fde4a", "a3e5a22bcd0", "a8f472b5d40", "acd5b3f9503", "a2937f49aea", "a3103f88b25", "a4bf24606fe", "a4c1b6d17ac", "a4e705cc3c3", "a563a821021", "a5740b2e6c9", "a7db412f24f", "ab47122e0cd", "ae62ff677bb"];
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testFindAllWithCursorWithHalfArray');
        req = objectStore.index('by_parent').openCursor(null, 'next');
        var sortedParentIds = PARENT_IDS.sort().slice(0,15);
        var orgUnits = [];
        req.onsuccess = function(e) {
            var foundAMatch = function() {
                orgUnits.push(cursor.value);
                cursor.continue();
            };

            var finishedQuery = function() {
                console.timeEnd('testFindAllWithCursorWithHalfArray');
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

    var testFindAllWithCursorAndKeyRange = function(db) {
        var parentIds = ["a0f9b7ceb46", "a4113d91a74", "a8549a1f334", "a87c87ab3aa", "a2b5312f50c", "a6e473b1bc9", "a92f69580e8", "ab31ea68dca", "a69cc45b4b4", "a8fcd3619d8", "a9437a0828c", "ad272fbcb70", "a329cd98589", "a6fbd65eccf", "a74f119e557", "abd19473a1d", "a24d00fde4a", "a3e5a22bcd0", "a8f472b5d40", "acd5b3f9503", "a2937f49aea", "a3103f88b25", "a4bf24606fe", "a4c1b6d17ac", "a4e705cc3c3", "a563a821021", "a5740b2e6c9", "a7db412f24f", "ab47122e0cd", "ae62ff677bb"];
        transaction = db.transaction(STORE_NAME, "readwrite");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testFindAllWithCursorAndKeyRange');
        var sortedParentIds = PARENT_IDS.sort();
        var orgUnits = [];
        req = objectStore.index('by_parent').openCursor(IDBKeyRange.bound(sortedParentIds[0], sortedParentIds[sortedParentIds.length - 1]), 'next');
        req.onsuccess = function(e) {
            var foundAMatch = function() {
                orgUnits.push(cursor.value);
                cursor.continue();
            };

            var finishedQuery = function() {
                console.timeEnd('testFindAllWithCursorAndKeyRange');
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

    var testFindAllWithCursorInBatches = function(db) {
        var orgUnits = [],
            requestsToComplete = 0;

        var executeRequestForBatch = function(batchOfIds, completedFn) {
            console.log('Created batch for ids: ', batchOfIds.length, batchOfIds);
            requestsToComplete++;
            var thisRequest = objectStore.index('by_parent').openCursor(IDBKeyRange.lowerBound(batchOfIds[0]), 'next');
            var lastMatchedKey = null;
            thisRequest.onsuccess = function(e) {
                var foundAMatch = function() {
                    lastMatchedKey = cursor.key;
                    orgUnits.push(cursor.value);
                    cursor.continue();
                };

                var finishedQuery = function() {
                    requestsToComplete--;
                    if(requestsToComplete == 0) {
                        completedFn();
                    }
                };

                var cursor = e.target.result;
                if (!cursor) {
                    finishedQuery();
                    return;
                }

                var j = 0;
                var currentId = cursor.key;
                while (currentId != lastMatchedKey && currentId > batchOfIds[j]) {
                    j++;
                    if (j === batchOfIds.length) {
                        finishedQuery();
                        return;
                    }
                }
                (currentId === batchOfIds[j] || currentId === lastMatchedKey) ? foundAMatch() : cursor.continue(batchOfIds[j]);
            };
        };


        var parentIds = ["a0f9b7ceb46", "a4113d91a74", "a8549a1f334", "a87c87ab3aa", "a2b5312f50c", "a6e473b1bc9", "a92f69580e8", "ab31ea68dca", "a69cc45b4b4", "a8fcd3619d8", "a9437a0828c", "ad272fbcb70", "a329cd98589", "a6fbd65eccf", "a74f119e557", "abd19473a1d", "a24d00fde4a", "a3e5a22bcd0", "a8f472b5d40", "acd5b3f9503", "a2937f49aea", "a3103f88b25", "a4bf24606fe", "a4c1b6d17ac", "a4e705cc3c3", "a563a821021", "a5740b2e6c9", "a7db412f24f", "ab47122e0cd", "ae62ff677bb"];
        transaction = db.transaction(STORE_NAME, "readonly");
        objectStore = transaction.objectStore(STORE_NAME);

        console.time('testFindAllWithCursorInBatches');
        var sortedParentIds = PARENT_IDS.sort();

        var BATCH_SIZE = 3;
        for(i = 0; i < sortedParentIds.length; i += BATCH_SIZE) {
            var batchOfIds = sortedParentIds.slice(i, i + BATCH_SIZE);
            executeRequestForBatch(batchOfIds, function() {
                console.timeEnd('testFindAllWithCursorInBatches');
                console.log('orgUnits: ', orgUnits.length);
            });
        }
    };

    var init = function() {
        openDb('msf', function(db) {
            var tests = [
                testGetAll,
                testGetAllWithReadWriteTransaction,
                testGetAllWithCursor,
                testGet,
                testGetWithCursorAndKeyRangeOnly,
                testGetWithCursorAndKeyRangeBound,
                testFindAllWithCursor,
                testFindAllWithCursorWithHalfArray,
                testFindAllWithCursorAndKeyRange,
                testFindAllWithCursorInBatches
            ]
            tests[testNumber](db);
        });
    };

    init();
};