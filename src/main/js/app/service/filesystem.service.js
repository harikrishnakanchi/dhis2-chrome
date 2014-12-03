define([], function() {
    return function() {
        var writeFile = function(fileName, contents, blobType, successHandler, errorHandler) {
            console.log(fileName);
            var entryType = {
                type: 'openDirectory'
            };

            var createStrategy = {
                create: true,
                exclusive: true
            };

            chrome.fileSystem.chooseEntry(entryType, function(entry) {
                chrome.fileSystem.getWritableEntry(entry, function(writableEntry) {
                    writableEntry.getFile(fileName, createStrategy, function(fileEntry) {
                        fileEntry.createWriter(function(writer) {
                            writer.onerror = function(e) {
                                errorHandler(e);
                            };
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

        return {
            "writeFile": writeFile
        };
    };
});
