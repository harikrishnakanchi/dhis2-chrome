define(['lodash'], function(_) {
    return function($q) {
        var FILE_TYPE_OPTIONS = {
            CSV: {
                accepts: [{
                    description: 'Text CSV (.csv)',
                    mimeTypes: ['text/csv'],
                    extensions: ['csv']
                }],
                acceptsAllTypes: false
            },
            PNG: {
                accepts: [{
                    description: 'PNG File (.png)',
                    mimeTypes: ['image/png'],
                    extensions: ['png']
                }],
                acceptsAllTypes: false
            }
        };

        var promptAndWriteFile = function(fileName, contents, options) {
            var deferred = $q.defer(),
                defaultOptions = {
                    type: 'saveFile',
                    suggestedName: fileName
                };

            var errorHandler = function(err) {
                deferred.reject(err);
            };

            chrome.fileSystem.chooseEntry(_.merge(defaultOptions, options), function(fileEntry) {
                if (chrome.runtime.lastError || fileEntry === undefined) {
                    // Evaluate chrome.runtime.lastError in case user clicked cancel
                    errorHandler('No download path was selected');
                } else {
                    fileEntry.createWriter(function(writer) {
                        writer.onerror = errorHandler;
                        writer.truncate(0);
                        writer.onwriteend = function() {
                            writer.onwriteend = _.partial(deferred.resolve, fileEntry);
                            writer.write(contents);
                        };
                    }, errorHandler);
                }
            });

            return deferred.promise;
        };

        var writeFile = function(fileName, contents) {
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
                                writer.write(contents);
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
                    reader.readAsArrayBuffer(file);
                });
            });

            return deferred.promise;
        };

        return {
            "FILE_TYPE_OPTIONS": FILE_TYPE_OPTIONS,
            "promptAndWriteFile": promptAndWriteFile,
            "writeFile": writeFile,
            "readFile": readFile
        };
    };
});
