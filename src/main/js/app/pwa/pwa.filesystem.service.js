define(['fileSaver'], function (saveAs) {
   return function () {
       var FILE_TYPE_OPTIONS = {
           XLSX: { extension: 'xlsx' },
           PNG: { extension: 'png' }
       };

       var writeFile = function (fileName, contents, options) {
           if (options && options.extension) {
               fileName = [fileName, options.extension].join('.');
           }
           saveAs(contents, fileName);

           return {
               name: 'Downloads Folder'
           };
       };

       var fakeFunction = function () {

       };

       return {
           "FILE_TYPE_OPTIONS": FILE_TYPE_OPTIONS,
           "promptAndWriteFile": writeFile,
           "writeFile": writeFile,
           "readFile": fakeFunction
       };
   };
});