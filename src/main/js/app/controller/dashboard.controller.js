define(["moment", "approvalDataTransformer", "properties", "lodash", "indexedDBLogger", "zipUtils"], function(moment, approvalDataTransformer, properties, _, indexedDBLogger, zipUtils) {
    return function($scope, $hustle, $q, $rootScope, approvalHelper, datasetRepository, $modal, $timeout, indexeddbUtils, filesystemService, sessionHelper, $location, approvalDataRepository) {
        $scope.approveSuccessForLevelOne = false;
        $scope.approveSuccessForLevelTwo = false;
        $scope.approveSuccessForLevelThree = false;
        $scope.weeks = {
            "approveAllItems": false
        };

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
                "type": "downloadMetadata"
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
                "type": "downloadData"
            }, "dataValues");

            var downloadEvents = $hustle.publish({
                "type": "downloadEventData"
            }, "dataValues");

            var downloadDatasets = $hustle.publish({
                "type": "downloadDatasets",
                "data": []
            }, "dataValues");

            return $q.all([downloadMetadata, downloadOrgUnit, downloadOrgUnitGroups, downloadProgram, downloadData, downloadEvents, downloadDatasets]).then(onSuccess);
        };

        $scope.formatPeriods = function(period) {
            m = moment(period, "GGGG[W]W");
            return m.format("[W]W") + " - " + m.startOf("isoWeek").toDate().toLocaleDateString() + " - " + m.endOf("isoWeek").toDate().toLocaleDateString();
        };

        $scope.toggleSelectAllOption = function(status) {
            if (status === false) {
                $scope.weeks.approveAllItems = false;
            } else {
                var selectWeekFlag = true;
                _.forEach($scope.itemsAwaitingApprovalAtUserLevel, function(item) {
                    _.forEach(item.status, function(status) {
                        if (status.shouldBeApproved === false || status.shouldBeApproved === undefined)
                            selectWeekFlag = false;
                    });
                    $scope.weeks.approveAllItems = selectWeekFlag;
                });
            }
        };

        $scope.toggleAllItemsAwaitingApproval = function() {
            _.forEach($scope.itemsAwaitingApprovalAtUserLevel, function(item) {
                _.forEach(item.status, function(status) {
                    status.shouldBeApproved = $scope.weeks.approveAllItems;
                });
            });
        };

        $scope.areApprovalItemsSelected = function() {
            return filterItemsToBeApproved().length > 0;
        };

        $scope.bulkApprove = function() {
            var itemsToBeApproved = filterItemsToBeApproved();

            var moveApprovedItemsToNextLevel = function() {
                var incrementApprovalLevel = function(status) {
                    status = _.map(status, function(s) {
                        s.nextApprovalLevel = s.nextApprovalLevel < 3 ? s.nextApprovalLevel + 1 : undefined;
                        return s;
                    });

                    return _.filter(status, function(s) {
                        return s.nextApprovalLevel !== undefined;
                    });
                };
                _.each(itemsToBeApproved, function(approvedItem) {
                    approvedItem.status = incrementApprovalLevel(approvedItem.status);
                    var existingOtherLevelItem = _.find($scope.itemsAwaitingApprovalAtOtherLevels, function(otherLevelItem) {
                        return approvedItem.moduleId === otherLevelItem.moduleId;
                    });

                    if (!existingOtherLevelItem) {
                        $scope.itemsAwaitingApprovalAtOtherLevels.push(approvedItem);
                    } else {
                        existingOtherLevelItem.status = existingOtherLevelItem.status.concat(approvedItem.status);
                    }
                });
            };


            var successPromise = function(data) {
                $scope.itemsAwaitingApprovalAtUserLevel = filterItems($scope.itemsAwaitingApprovalAtUserLevel, false);
                moveApprovedItemsToNextLevel();
                if ($scope.userApprovalLevel === 1) {
                    $scope.approveSuccessForLevelOne = true;
                    $scope.approveSuccessForLevelTwo = false;
                    $scope.approveSuccessForLevelThree = false;
                } else if ($scope.userApprovalLevel === 2) {
                    $scope.approveSuccessForLevelTwo = true;
                    $scope.approveSuccessForLevelOne = false;
                    $scope.approveSuccessForLevelThree = false;
                } else {
                    $scope.approveSuccessForLevelOne = false;
                    $scope.approveSuccessForLevelTwo = false;
                    $scope.approveSuccessForLevelThree = true;
                }
                $scope.approveError = false;

                $timeout(function() {
                    $scope.approveSuccess = false;
                }, properties.messageTimeout);

                return data;
            };

            var errorPromise = function(data) {
                $scope.approveSuccess = false;
                $scope.approveError = true;

                $timeout(function() {
                    $scope.approveError = false;
                }, properties.messageTimeout);

                return data;
            };

            var approve = function() {
                var periodsAndOrgUnits = _.flatten(_.map(itemsToBeApproved, function(item) {
                    return _.map(item.status, function(status) {
                        return {
                            "period": status.period,
                            "orgUnit": item.moduleId
                        };
                    });
                }));

                var publishToDhis = function(messageType) {
                    var promises = [];
                    promises.push($hustle.publish({
                        "data": periodsAndOrgUnits,
                        "type": messageType
                    }, "dataValues"));
                    return $q.all(promises);
                };

                if ($scope.userApprovalLevel === 1)
                    return approvalDataRepository.markAsComplete(periodsAndOrgUnits, $rootScope.currentUser.userCredentials.username)
                        .then(_.partial(publishToDhis, "uploadCompletionData"));
                if ($scope.userApprovalLevel === 2)
                    return approvalDataRepository.markAsApproved(periodsAndOrgUnits, $rootScope.currentUser.userCredentials.username)
                        .then(_.partial(publishToDhis, "uploadApprovalData"));
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.dataApprovalConfirmationMessage
            };

            showModal(approve, modalMessages).then(successPromise, errorPromise);
        };

        $scope.getApprovalLevelName = function(level) {
            if (level === 1) return "Project Level";
            if (level === 2) return "Coordination Level";
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
                "ok": $scope.resourceBundle.confirmExport,
                "title": $scope.resourceBundle.confirmExportTitle,
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

        var showModal = function(okCallback, message) {
            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            return modalInstance.result.then(okCallback);
        };

        var filterItems = function(items, withSelectedItems) {
            items = _.map(items, function(item) {
                item.status = _.filter(item.status, function(status) {
                    status.shouldBeApproved = status.shouldBeApproved ? status.shouldBeApproved : false;
                    return status.shouldBeApproved === withSelectedItems;
                });
                return item;
            });

            return _.filter(items, function(item) {
                return item.status.length > 0;
            });
        };

        var filterItemsToBeApproved = function() {
            return filterItems(_.cloneDeep($scope.itemsAwaitingApprovalAtUserLevel), true);
        };

        var init = function() {
            var filterModulesWithNoItems = function(data) {
                return _.filter(data, function(datum) {
                    return datum.status.length > 0;
                });
            };

            var filterItemsAwaitingSubmission = function(approvalStatusData) {
                var itemsAwaitingSubmissionPerModule = _.map(approvalStatusData, function(data) {
                    var filteredData = _.cloneDeep(data);
                    filteredData.status = _.filter(filteredData.status, function(status) {
                        return !status.submitted;
                    });
                    return filteredData;
                });

                return filterModulesWithNoItems(itemsAwaitingSubmissionPerModule);
            };

            var filterItemsAwaitingApprovalAtUserLevel = function(approvalStatusData, userApprovalLevel) {
                var itemsAwaitingApprovalPerModule = _.map(approvalStatusData, function(data) {
                    var filteredData = _.cloneDeep(data);
                    filteredData.status = _.filter(filteredData.status, function(status) {
                        return status.nextApprovalLevel === userApprovalLevel;
                    });
                    return filteredData;
                });

                return filterModulesWithNoItems(itemsAwaitingApprovalPerModule);
            };

            var filterItemsAwaitingApprovalAtOtherLevels = function(approvalStatusData, userApprovalLevel) {
                var itemsAwaitingApprovalPerModule = _.map(approvalStatusData, function(data) {
                    var filteredData = _.cloneDeep(data);
                    filteredData.status = _.filter(filteredData.status, function(status) {
                        return status.nextApprovalLevel && status.nextApprovalLevel !== userApprovalLevel;
                    });
                    return filteredData;
                });
                return filterModulesWithNoItems(itemsAwaitingApprovalPerModule);
            };

            var getUserApprovalLevel = function() {
                var getApproverLevelFromRole = function(roleName) {
                    if (roleName === "Project Level Approver") return 1;
                    if (roleName === "Coordination Level Approver") return 2;
                    if (roleName === "Desk Level Approver") return 3;
                };

                var approvalRole = _.filter($rootScope.currentUser.userCredentials.userRoles, function(role) {
                    return role.name.indexOf("Approver") > -1;
                });

                return approvalRole[0] ? getApproverLevelFromRole(approvalRole[0].name) : undefined;
            };

            if ($rootScope.hasRoles(['Superuser']) && $rootScope.currentUser && $rootScope.currentUser.organisationUnits) {
                $scope.$parent.currentUserProject = _.find($scope.$parent.projects, {
                    "id": $rootScope.currentUser.organisationUnits[0].id
                });
            }
            if ($rootScope.hasRoles(['Data entry user', 'Project Level Approver', 'Coordination Level Approver']) && $rootScope.currentUser && $rootScope.currentUser.organisationUnits) {
                $scope.loading = true;
                approvalHelper.getApprovalStatus($rootScope.currentUser.organisationUnits[0].id).then(function(approvalStatusData) {
                    $scope.userApprovalLevel = getUserApprovalLevel();
                    $scope.itemsAwaitingSubmission = filterItemsAwaitingSubmission(approvalStatusData);
                    $scope.itemsAwaitingApprovalAtUserLevel = $scope.userApprovalLevel ? filterItemsAwaitingApprovalAtUserLevel(approvalStatusData, $scope.userApprovalLevel) : [];
                    $scope.itemsAwaitingApprovalAtOtherLevels = filterItemsAwaitingApprovalAtOtherLevels(approvalStatusData, $scope.userApprovalLevel);

                    $scope.loading = false;
                });
            }
        };

        init();
    };
});