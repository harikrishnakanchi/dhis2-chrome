define(['lodash', 'platformUtils'], function(_, platformUtils) {
    return function($rootScope, $q, $modal) {
        var FILE_TYPE_OPTIONS = {
            XLSX: {
                accepts: [{
                    description: 'Microsoft Excel 2007-2013 XML (.xlsx)',
                    extensions: ['xlsx']
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

        var replaceSpecialCharsInFileName = function (fileName) {
            var charMap = {
                '<': String.fromCharCode(0x02C2),
                '>': String.fromCharCode(0x02C3)
            };

            for(var symbol in charMap) {
                var regex = new RegExp(symbol, 'g');
                fileName = fileName.replace(regex, charMap[symbol]);
            }

            return fileName;
        };

        var promptAndWriteFile = function(fileName, contents, options) {

            if(platformUtils.getOS() == 'win')
                fileName = replaceSpecialCharsInFileName(fileName);

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

        var readFile = function(file) {
            var deferred = $q.defer();
            var reader = new FileReader();
            reader.onerror = function (err) {
                deferred.reject(err);
            };
            reader.onloadend = function (data) {
                deferred.resolve(data);
            };
            reader.readAsArrayBuffer(file);
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
