define(["moment", "properties", "lodash", "indexedDBLogger", "zipUtils", "interpolate"], function(moment, properties, _, indexedDBLogger, zipUtils, interpolate) {
    return function($scope, $modal, $timeout, indexeddbUtils, filesystemService, sessionHelper, $location, $rootScope) {
        $scope.status = {
            isopen: false
        };

        $scope.fileExtension = "." + properties.praxis.fileExtension;

        $scope.toggleDropdown = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.status.isopen = !$scope.status.isopen;
        };

        $scope.dumpLogs = function() {
            var errorCallback = function(error) {
                if(_.isObject(error)) {
                    var notificationMessages = {
                        "notificationMessage": interpolate($scope.resourceBundle.dumpLogsErrorMessage, { error: error.message }),
                        "notificationTitle": $scope.resourceBundle.errorNotification
                    };
                    showNotification(notificationMessages);
                }
            };

            var successCallback = function(directory) {
                var downloadsDirectory = directory ? interpolate($scope.resourceBundle.downloadsDirectory, { directory: directory.name }): '';
                var notificationMessage = $scope.resourceBundle.dumpLogsSuccessMessage + downloadsDirectory;
                var notificationMessages = {
                    "notificationMessage": notificationMessage,
                    "notificationTitle": $scope.resourceBundle.successNotification
                };
                showNotification(notificationMessages);
            };

            createZip("logs", "logs_dump_", ".logs", _.partial(indexedDBLogger.exportLogs, properties.praxis.dbForLogs))
                .then(successCallback, errorCallback);
        };

        $scope.createClone = function() {
            var errorCallback = function(error) {
                if(_.isObject(error)) {
                    var notificationMessages = {
                        "notificationMessage": interpolate($scope.resourceBundle.createCloneErrorMessage, { error: error.message }),
                        "notificationTitle": $scope.resourceBundle.errorNotification
                    };
                    showNotification(notificationMessages);
                }
            };

            var successCallback = function(directory) {
                var downloadsDirectory = directory ? interpolate($scope.resourceBundle.downloadsDirectory, { directory: directory.name }): '';
                var notificationMessage = $scope.resourceBundle.createCloneSuccessMessage + downloadsDirectory;
                var notificationMessages = {
                    "notificationMessage": notificationMessage,
                    "notificationTitle": $scope.resourceBundle.successNotification
                };
                showNotification(notificationMessages);
            };

            var modalMessages = {
                "ok": $scope.resourceBundle.confirmExport,
                "title": $scope.resourceBundle.confirmExportTitle,
                "confirmationMessage": $scope.resourceBundle.createCloneConfirmationMessage
            };

            showModal(function() {
                createZip("praxis_idb", "praxis_idb_", ".clone", indexeddbUtils.backupEntireDB).then(successCallback, errorCallback);
            }, modalMessages);
        };

        $scope.loadClone = function() {
            var errorCallback = function(error) {
                var notificationMessages = {
                    "notificationMessage": interpolate($scope.resourceBundle.loadCloneErrorMessage, { error: error.message }),
                    "notificationTitle": $scope.resourceBundle.errorNotification
                };
                showNotification(notificationMessages);
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
                $rootScope.startLoading();
                $timeout(function () {
                    var zipFiles = zipUtils.readZipFile(fileData.target.result);

                    var result = {};
                    _.each(zipFiles, function(file) {
                        if (_.endsWith(file.name, ".clone")) {
                            var content = JSON.parse(arrayBufferToString(file._data.getContent()));
                            return _.merge(result, content);
                        }
                    });



                    indexeddbUtils.restore(result)
                        .then(function() {
                            sessionHelper.logout();
                        }, errorCallback)
                        .finally($rootScope.stopLoading);
                }, 1000);
            };

            var modalMessages = {
                "ok": $scope.resourceBundle.confirmImport,
                "title": $scope.resourceBundle.confirmImportTitle,
                "confirmationMessage": $scope.resourceBundle.loadCloneConfirmationMessage
            };

            var onImportFileSelect = function (e) {
                if (e.target.files) {
                    var file = e.target.files[0];
                    filesystemService.readFile(file).then(successCallback, errorCallback);
                }
            };

            showModal(function() {
                var importClone = document.getElementById('importClone');
                importClone.addEventListener('change', onImportFileSelect);
                importClone.click();
            }, modalMessages);
        };

        var createZip = function(folderName, fileNamePrefix, fileNameExtn, backupCallback) {
            $rootScope.startLoading();
            return backupCallback().then(function(data) {
                $rootScope.stopLoading();
                var zippedData = zipUtils.zipData(folderName, fileNamePrefix, fileNameExtn, data);
                var fileName = fileNamePrefix + moment().format("YYYYMMDD-HHmmss") + $scope.fileExtension;
                return filesystemService.writeFile(fileName, zippedData);
            }).finally($rootScope.stopLoading);
        };

        var showNotification = function(message) {
            $scope.notificationMessage = message.notificationMessage;
            $scope.notificationTitle = message.notificationTitle;
            var modalInstance = $modal.open({
                templateUrl: 'templates/notification-dialog.html',
                controller: 'notificationDialogController',
                scope: $scope
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
