define(["moment", "approvalDataTransformer", "properties", "fileSystemUtils", "lodash"], function(moment, approvalDataTransformer, properties, fileSystemUtils, _) {
    return function($scope, $hustle, $q, $rootScope, approvalHelper, dataSetRepository, $modal, $timeout, indexeddbUtils) {
        var dataValues = [];
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
            $scope.isSyncRunning = true;

            var onSuccess = function(response) {
                $scope.isSyncRunning = false;
                $scope.isSyncDone = true;
            };

            var downloadData = $hustle.publish({
                "type": "downloadData"
            }, "dataValues");

            var downloadEvents = $hustle.publish({
                "type": "downloadEventData"
            }, "dataValues")

            return downloadData.then(downloadEvents).then(onSuccess);
        };

        $scope.formatPeriods = function(period) {
            var year = period.substring(0, 4);
            var week = period.substring(4);
            m = moment(year + "-" + week);
            return "W" + m.isoWeek() + " - " + m.startOf("isoWeek").format("YYYY-MM-DD") + " - " + m.endOf("isoWeek").format("YYYY-MM-DD");
        };

        $scope.toggleSelectAllOption = function(status) {
            if (status === false) {
                $scope.weeks.approveAllItems = false;
            } else {
                var selectWeekFlag = true;
                _.forEach($scope.itemsAwaitingApprovalAtUserLevel, function(item) {
                    _.forEach(item.status, function(status) {
                        if (status.shouldBeApproved === false)
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

            var getPeriodsToBeApproved = function() {
                return _.map(itemsToBeApproved, function(item) {
                    return {
                        "orgUnitId": item.moduleId,
                        "period": _.pluck(item.status, "period")
                    };
                });
            };

            var getApprovalFunction = function() {
                if ($scope.userApprovalLevel == 1)
                    return approvalHelper.markDataAsComplete;
                if ($scope.userApprovalLevel == 2)
                    return approvalHelper.markDataAsApproved;
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

            var showModal = function(okCallback, message) {
                $scope.modalMessage = message;
                var modalInstance = $modal.open({
                    templateUrl: 'templates/confirm.dialog.html',
                    controller: 'confirmDialogController',
                    scope: $scope
                });

                modalInstance.result.then(approve);
            };

            var approve = function() {
                return dataSetRepository.getAll().then(function(dataSets) {
                    var bulkApprovalData = approvalDataTransformer.generateBulkApprovalData(getPeriodsToBeApproved(), dataSets, $rootScope.currentUser.userCredentials.username);
                    var approvalFunction = getApprovalFunction();

                    return $q.all(_.map(bulkApprovalData, function(datum) {
                        return approvalFunction(datum);
                    })).then(successPromise, errorPromise);
                });
            };

            showModal(approve, $scope.resourceBundle.dataApprovalConfirmationMessage);
        };

        $scope.getApprovalLevelName = function(level) {
            if (level === 1) return "Project Level";
            if (level === 2) return "Coordination Level";
            if (level === 3) return "Desk Level";
        };

        $scope.createClone = function() {
            indexeddbUtils.backupEntireDB().then(function(data) {
                var cloneFileName = "dhis_idb_" + moment().format("YYYY-MM-DD:HH:mm:ss") + ".clone";
                fileSystemUtils.writeFile(cloneFileName, JSON.stringify(data), "application/json");
            });
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
