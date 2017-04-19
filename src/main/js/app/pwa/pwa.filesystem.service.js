define(['fileSaver', 'interpolate'], function (saveAs, interpolate) {
   return function ($rootScope, $q, $modal) {
       var FILE_TYPE_OPTIONS = {
           XLSX: { extension: 'xlsx' },
           PNG: { extension: 'png' }
       };

       var writeFileWithOptions = function (fileName, contents, options) {
           var fileNameWithExtension = [fileName, options.extension].join('.');
           saveAs(contents, fileNameWithExtension);
       };

       var writeFile = function (fileName, contents) {
           saveAs(contents, fileName);
       };

       var readFile = function (file) {
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
           "promptAndWriteFile": writeFileWithOptions,
           "writeFile": writeFile,
           "readFile": readFile
       };
   };
});