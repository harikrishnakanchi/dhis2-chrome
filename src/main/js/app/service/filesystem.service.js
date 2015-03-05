define([], function() {
    return function($q) {
        var writeFile = function(fileName, contents, blobType) {
            var deferred = $q.defer();
            var errorHandler = function(err) {
                deferred.reject(err);
            };

            var entryType = {
                "type": 'openDirectory'
            };

            var createStrategy = {
                "create": true,
                "exclusive": true
            };

            chrome.fileSystem.chooseEntry(entryType, function(entry) {
                if (chrome.runtime.lastError || entry === undefined) {
                    // Need to evaluate chrome.runtime.lastError to avoid an unhandled User Cancelled exception
                    deferred.reject("No download path was selected");
                } else {
                    chrome.fileSystem.getWritableEntry(entry, function(writableEntry) {
                        writableEntry.getFile(fileName, createStrategy, function(fileEntry) {
                            fileEntry.createWriter(function(writer) {
                                writer.onerror = errorHandler;
                                writer.onwriteend = function() {
                                    deferred.resolve(entry);
                                };
                                writer.write(new Blob([contents], {
                                    type: blobType
                                }));
                            }, errorHandler);
                        }, errorHandler);
                    });
                }
            });

            return deferred.promise;
        };

        var readFile = function(extensions) {
            var deferred = $q.defer();
            var errorHandler = function(err) {
                deferred.reject(err);
            };

            var entryType = {
                "type": 'openFile',
                "accepts": [{
                    "extensions": extensions
                }]
            };

            chrome.fileSystem.chooseEntry(entryType, function(readOnlyEntry) {
                readOnlyEntry.file(function(file) {
                    var reader = new FileReader();
                    reader.onerror = errorHandler;
                    reader.onloadend = function(data) {
                        deferred.resolve(data);
                    };
                    reader.readAsText(file);
                });
            });

            return deferred.promise;
        };

        return {
            "writeFile": writeFile,
            "readFile": readFile
        };
    };
});