define([], function() {
    return function() {
        var writeFile = function(fileName, contents, blobType) {
            console.log(fileName);
            var entryType = {
                type: 'openDirectory'
            };

            var createStrategy = {
                create: true
            };

            chrome.fileSystem.chooseEntry(entryType, function(entry) {
                chrome.fileSystem.getWritableEntry(entry, function(entry) {
                    entry.getFile(fileName, createStrategy, function(entry) {
                        entry.createWriter(function(writer) {
                            writer.write(new Blob([contents], {
                                type: blobType
                            }));
                        });
                    });
                });
            });
        };

        return {
            "writeFile": writeFile
        };
    };
});
