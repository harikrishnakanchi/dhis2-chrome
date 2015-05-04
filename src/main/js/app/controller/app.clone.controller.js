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

            var successCallback = function(fileData) {
                $scope.cloning = true;
                var fileContents = fileData.target.result;
                indexeddbUtils.restore(JSON.parse(fileContents))
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
                filesystemService.readFile(["clone"]).then(successCallback, errorCallback);
            }, modalMessages);
        };

        var createZip = function(folderName, fileNamePrefix, fileNameExtn, backupCallback) {
            $scope.cloning = true;
            return backupCallback().then(function(data) {
                $scope.cloning = false;
                var zippedData = zipUtils.zipData(folderName, fileNamePrefix, fileNameExtn, data);
                return filesystemService.writeFile(fileNamePrefix + moment().format("YYYYMMDD-HHmmss") + ".zip", zippedData);
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
