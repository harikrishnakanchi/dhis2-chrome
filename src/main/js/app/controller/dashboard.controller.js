define(["moment", "properties", "lodash", "indexedDBLogger", "zipUtils"], function(moment, properties, _, indexedDBLogger, zipUtils) {
    return function($scope, $hustle, $q, $rootScope, $modal, $timeout, indexeddbUtils, filesystemService, sessionHelper, $location) {
        $scope.status = {
            isopen: false
        };

        $scope.toggleDropdown = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.status.isopen = !$scope.status.isopen;
        };

        $scope.syncNow = function() {
            $scope.showMessage = true;
            $scope.message = $scope.resourceBundle.syncRunning;

            var onSuccess = function(response) {
                displayMessage($scope.resourceBundle.syncComplete, false);
            };

            var downloadMetadata = $hustle.publish({
                "type": "downloadMetadata",
                "data": []
            }, "dataValues");

            var downloadSystemSetting = $hustle.publish({
                "type": "downloadSystemSetting",
                "data": []
            }, "dataValues");

            var downloadPatientOriginDetails = $hustle.publish({
                "type": "downloadPatientOriginDetails",
                "data": []
            }, "dataValues");

            var downloadOrgUnit = $hustle.publish({
                "type": "downloadOrgUnit",
                "data": []
            }, "dataValues");

            var downloadOrgUnitGroups = $hustle.publish({
                "type": "downloadOrgUnitGroups",
                "data": []
            }, "dataValues");

            var downloadProgram = $hustle.publish({
                "type": "downloadProgram",
                "data": []
            }, "dataValues");

            var downloadData = $hustle.publish({
                "type": "downloadData",
                "data": []
            }, "dataValues");

            var downloadEvents = $hustle.publish({
                "type": "downloadEventData",
                "data": []
            }, "dataValues");

            var downloadDatasets = $hustle.publish({
                "type": "downloadDatasets",
                "data": []
            }, "dataValues");

            return $q.all([downloadMetadata, downloadSystemSetting, downloadPatientOriginDetails, downloadOrgUnit, downloadOrgUnitGroups,
                    downloadProgram, downloadData, downloadEvents, downloadDatasets
                ])
                .then(onSuccess);
        };

        $scope.dumpLogs = function() {
            var createZip = function(fileNamePrefix, fileNameExtn, backupCallback) {
                $scope.cloning = true;
                return backupCallback().then(function(data) {
                    $scope.cloning = false;
                    var zippedData = zipUtils.zipData("logs", "log_", ".log", data);
                    return filesystemService.writeFile("logs_" + moment().format("YYYYMMDD-HHmmss") + ".zip", zippedData);
                }).finally(function() {
                    $scope.cloning = false;
                });
            };

            var errorCallback = function(error) {
                displayMessage($scope.resourceBundle.dumpLogsErrorMessage + error.name, true);
            };

            var successCallback = function(directory) {
                displayMessage($scope.resourceBundle.dumpLogsSuccessMessage + directory.name, false);
            };

            createZip("logs_dump_", ".logs", _.partial(indexedDBLogger.exportLogs, "msfLogs"))
                .then(successCallback, errorCallback);
        };

        $scope.createClone = function() {
            var errorCallback = function(error) {
                displayMessage($scope.resourceBundle.createCloneErrorMessage + error.name, true);
            };

            var successCallback = function(directory) {
                displayMessage($scope.resourceBundle.createCloneSuccessMessage + directory.name, false);
            };

            var modalMessages = {
                "ok": $scope.resourceBundle.confirmExport,
                "title": $scope.resourceBundle.confirmExportTitle,
                "confirmationMessage": $scope.resourceBundle.createCloneConfirmationMessage
            };

            showModal(function() {
                saveIdbBackup("dhis_idb_", ".clone", indexeddbUtils.backupEntireDB).then(successCallback, errorCallback);
            }, modalMessages);
        };

        $scope.loadClone = function() {
            var errorCallback = function(error) {
                displayMessage($scope.resourceBundle.loadCloneErrorMessage + error, true);
            };

            var successCallback = function(fileData) {
                var fileContents = fileData.target.result;
                indexeddbUtils.restore(JSON.parse(fileContents))
                    .then(function() {
                        sessionHelper.logout();
                        $location.path("#/login");
                    }, errorCallback);

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

        var saveIdbBackup = function(fileNamePrefix, fileNameExtn, backupCallback) {
            $scope.cloning = true;
            return backupCallback().then(function(data) {
                var cloneFileName = fileNamePrefix + moment().format("YYYYMMDD-HHmmss") + fileNameExtn;
                var cloneFileContents = JSON.stringify(data);
                $scope.cloning = false;
                return filesystemService.writeFile(cloneFileName, new Blob([cloneFileContents], {
                    "type": "application/json"
                }));
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

        var displayMessage = function(messageText, isErrorMessage) {
            var hideMessage = function() {
                $scope.showMessage = false;
                $scope.message = "";
                $scope.messageClass = "";
            };

            $scope.showMessage = true;
            $scope.message = messageText;
            $scope.messageClass = isErrorMessage ? "alert alert-danger" : "alert alert-success";
            $timeout(hideMessage, properties.messageTimeout);
        };

        var init = function() {
            if ($rootScope.hasRoles(['Superuser']) && $rootScope.currentUser && $rootScope.currentUser.organisationUnits) {
                $scope.$parent.currentUserProject = _.find($scope.$parent.projects, {
                    "id": $rootScope.currentUser.organisationUnits[0].id
                });
            }
        };

        init();
    };
});
