define([], function () {
   return function () {
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
       var fakeFunction = function () {

       };

       return {
           "FILE_TYPE_OPTIONS": FILE_TYPE_OPTIONS,
           "promptAndWriteFile": fakeFunction,
           "writeFile": fakeFunction,
           "readFile": fakeFunction
       };
   };
});