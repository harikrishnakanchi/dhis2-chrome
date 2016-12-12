define(['fileSaver', 'interpolate'], function (saveAs, interpolate) {
   return function ($rootScope, $q, $modal) {
       var FILE_TYPE_OPTIONS = {
           XLSX: { extension: 'xlsx' },
           PNG: { extension: 'png' }
       };

       var notify = function (fileName) {
           var scope = $rootScope.$new();
           scope.notificationTitle = scope.resourceBundle.fileSystem.successNotification.title;
           scope.notificationMessage = interpolate(scope.resourceBundle.fileSystem.successNotification.message, { fileName: fileName });

           var modalInstance = $modal.open({
               templateUrl: 'templates/notification-dialog.html',
               controller: 'notificationDialogController',
               scope: scope
           });

           return modalInstance.result;
       };

       var writeFileAndNotify = function (fileName, contents, options) {
           var fileNameWithExtension = [fileName, options.extension].join('.');
           var saveFile = saveAs(contents, fileNameWithExtension);
           saveFile.onwriteend = function () {
               notify(fileNameWithExtension);
           };
       };

       var writeFile = function (fileName, contents) {
           saveAs(contents, fileName);
       };

       var readFile = function () {
           var deferred = $q.defer();

           var prepareImportFileDomElement = function () {
               var createImportFileElement = function () {
                   var domElement = document.createElement('input');
                   domElement.id = 'importClone';
                   domElement.accept = '.msf';
                   domElement.type='file';
                   return domElement;
               };
               var importAppCloneElement = createImportFileElement();
               angular.element(document.body).append(importAppCloneElement);
               importAppCloneElement.addEventListener('change', onImportFileSelect);
               importAppCloneElement.click();
               return importAppCloneElement;
           };

           var importAppCloneElement = prepareImportFileDomElement();
           var onImportFileSelect = function (e) {
               importAppCloneElement.remove();
               if(e.target.files)
               {
                   var file = e.target.files[0];
                   var reader = new FileReader();
                   reader.onerror = function (err) {
                       deferred.reject(err);
                   };
                   reader.onloadend = function (data) {
                       deferred.resolve(data);
                   };
                   reader.readAsArrayBuffer(file);
               }
           };
           return deferred.promise;
       };

       return {
           "FILE_TYPE_OPTIONS": FILE_TYPE_OPTIONS,
           "promptAndWriteFile": writeFileAndNotify,
           "writeFile": writeFile,
           "readFile": readFile
       };
   };
});