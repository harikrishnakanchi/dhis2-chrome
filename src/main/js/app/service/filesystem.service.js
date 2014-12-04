define([], function() {
    return function() {
        var writeFile = function(fileName, contents, blobType, successHandler, errorHandler) {
            var entryType = {
                "type": 'openDirectory'
            };

            var createStrategy = {
                "create": true,
                "exclusive": true
            };

            chrome.fileSystem.chooseEntry(entryType, function(entry) {
                chrome.fileSystem.getWritableEntry(entry, function(writableEntry) {
                    writableEntry.getFile(fileName, createStrategy, function(fileEntry) {
                        fileEntry.createWriter(function(writer) {

                            writer.onerror = errorHandler;
                            writer.onwriteend = function() {
                                successHandler(entry);
                            };
                            writer.write(new Blob([contents], {
                                type: blobType
                            }));
                        }, errorHandler);
                    }, errorHandler);
                });
            });
        };

        var readFile = function(successHandler, errorHandler, extensions) {
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
                    reader.onloadend = successHandler;
                    reader.readAsText(file);
                });
            });
        };

        return {
            "writeFile": writeFile,
            "readFile": readFile
        };
    };
});
