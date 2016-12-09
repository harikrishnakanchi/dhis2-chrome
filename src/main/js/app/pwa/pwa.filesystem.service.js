define(['fileSaver'], function (saveAs) {
   return function () {
       var FILE_TYPE_OPTIONS = {
           XLSX: { extension: 'xlsx' },
           PNG: { extension: 'png' }
       };

       var writeFile = function (fileName, contents, options) {
           var fileNameWithExtension = [fileName, options.extension].join('.');
           saveAs(contents, fileNameWithExtension);
       };

       var fakeFunction = function () {

       };

       return {
           "FILE_TYPE_OPTIONS": FILE_TYPE_OPTIONS,
           "promptAndWriteFile": writeFile,
           "writeFile": fakeFunction,
           "readFile": fakeFunction
       };
   };
});