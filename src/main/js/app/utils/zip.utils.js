define(["JSZip", "lodash"], function(JSZip, _) {
    var zipData = function(folderName, fileNamePrefix, fileNameExtn, data) {
        var zip = new JSZip();
        var keys = _.keys(data);
        _.forEach(keys, function(key) {
            var fileName = fileNamePrefix + key + fileNameExtn;
            var fileData = {};
            fileData[key] = data[key];
            zip.folder(folderName).file(fileName, JSON.stringify(fileData));
        });

        var contents = zip.generate({
            type: "blob",
            compression: "DEFLATE",
            compressionOptions: {
                level: 6
            }
        });
        return contents;
    };

    var readZipFile = function(file) {
        var zip = new JSZip();
        var zipObject = zip.load(file);
        return zipObject.files;
    };

    return {
        "zipData": zipData,
        "readZipFile": readZipFile
    };
});
