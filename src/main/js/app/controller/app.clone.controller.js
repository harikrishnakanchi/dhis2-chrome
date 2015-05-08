define(["moment", "properties", "lodash", "indexedDBLogger", "zipUtils"], function(moment, properties, _, indexedDBLogger, zipUtils) {
    return function($scope, $modal, $timeout, indexeddbUtils, filesystemService, sessionHelper, $location) {
        $scope.status = {
            isopen: false
        };

        $scope.toggleDropdown = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.status.isopen = !$scope.status.isopen;
        };

        $scope.dumpLogs = function() {
            var errorCallback = function(error) {
                $scope.displayMessage($scope.resourceBundle.dumpLogsErrorMessage + error.name, true);
            };

            var successCallback = function(directory) {
                $scope.displayMessage($scope.resourceBundle.dumpLogsSuccessMessage + directory.name, false);
            };

            createZip("logs", "logs_dump_", ".logs", _.partial(indexedDBLogger.exportLogs, "msfLogs"))
                .then(successCallback, errorCallback);
        };

        $scope.createClone = function() {
            var errorCallback = function(error) {
                $scope.displayMessage($scope.resourceBundle.createCloneErrorMessage + error.name, true);
            };

            var successCallback = function(directory) {
                $scope.displayMessage($scope.resourceBundle.createCloneSuccessMessage + directory.name, false);
            };

            var modalMessages = {
                "ok": $scope.resourceBundle.confirmExport,
                "title": $scope.resourceBundle.confirmExportTitle,
                "confirmationMessage": $scope.resourceBundle.createCloneConfirmationMessage
            };

            showModal(function() {
                createZip("dhis_idb", "dhis_idb_", ".clone", indexeddbUtils.backupEntireDB).then(successCallback, errorCallback);
            }, modalMessages);
        };

        $scope.loadClone = function() {
            var errorCallback = function(error) {
                $scope.displayMessage($scope.resourceBundle.loadCloneErrorMessage + error, true);
            };

            var arrayBufferToString = function(buffer) {
                var bufView = new Uint16Array(buffer);
                var length = bufView.length;
                var result = '';
                for (var i = 0; i < length; i += 65535) {
                    var addition = 65535;
                    if (i + 65535 > length) {
                        addition = length - i;
                    }
                    result += String.fromCharCode.apply(null, bufView.subarray(i, i + addition));
                }
                return result;
            };

            var successCallback = function(fileData) {
                $scope.cloning = true;
                var zipFiles = zipUtils.readZipFile(fileData.target.result);

                var result = {};
                _.each(zipFiles, function(file) {
                    if (file.name.endsWith(".clone")) {
                        var content = JSON.parse(arrayBufferToString(file._data.getContent()));
                        return _.merge(result, content);
                    }
                });



                indexeddbUtils.restore(result)
                    .then(function() {
                        sessionHelper.logout();
                        $location.path("#/login");
                    }, errorCallback)
                    .finally(function() {
                        $scope.cloning = false;
                    });
            };

            var modalMessages = {
                "ok": $scope.resourceBundle.confirmImport,
                "title": $scope.resourceBundle.confirmImportTitle,
                "confirmationMessage": $scope.resourceBundle.loadCloneConfirmationMessage
            };

            showModal(function() {
                filesystemService.readFile(["msf"]).then(successCallback, errorCallback);
            }, modalMessages);
        };

        var createZip = function(folderName, fileNamePrefix, fileNameExtn, backupCallback) {
            $scope.cloning = true;
            return backupCallback().then(function(data) {
                $scope.cloning = false;
                var zippedData = zipUtils.zipData(folderName, fileNamePrefix, fileNameExtn, data);
                return filesystemService.writeFile(fileNamePrefix + moment().format("YYYYMMDD-HHmmss") + ".msf", zippedData);
            }).finally(function() {
                $scope.cloning = false;
            });
        };

        var showModal = function(okCallback, message) {
            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            return modalInstance.result.then(okCallback);
        };
    };
});
