define(["properties", "moment", "dateUtils", "lodash"], function(properties, moment, dateUtils, _) {
    return function($scope, $hustle, $q, $rootScope, $modal, $timeout, $location, orgUnitRepository, approvalDataRepository, dataRepository) {
        $scope.approveSuccessForLevelOne = false;
        $scope.approveSuccessForLevelTwo = false;
        $scope.approveSuccessForLevelThree = false;

        $scope.weeks = {
            "approveAllItems": false
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
                        s.nextApprovalLevel = s.nextApprovalLevel < 2 ? s.nextApprovalLevel + 1 : undefined;
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

                    if (!_.isEmpty(approvedItem.status)) {
                        if (!existingOtherLevelItem) {
                            $scope.itemsAwaitingApprovalAtOtherLevels.push(approvedItem);
                        } else {
                            existingOtherLevelItem.status = existingOtherLevelItem.status.concat(approvedItem.status);
                        }
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

                var publishToDhis = function(messageType, desc) {
                    var promises = [];
                    promises.push($hustle.publish({
                        "data": periodsAndOrgUnits,
                        "type": messageType,
                        "locale": $scope.currentUser.locale,
                        "desc": desc
                    }, "dataValues"));
                    return $q.all(promises);
                };

                if ($scope.userApprovalLevel === 1)
                    return approvalDataRepository.markAsComplete(periodsAndOrgUnits, $rootScope.currentUser.userCredentials.username)
                        .then(_.partial(publishToDhis, "uploadCompletionData", $scope.resourceBundle.uploadCompletionDataDesc + _.pluck(periodsAndOrgUnits, "period")));
                if ($scope.userApprovalLevel === 2)
                    return approvalDataRepository.markAsApproved(periodsAndOrgUnits, $rootScope.currentUser.userCredentials.username)
                        .then(_.partial(publishToDhis, "uploadApprovalData", $scope.resourceBundle.uploadApprovalDataDesc + _.pluck(periodsAndOrgUnits, "period")));
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.dataApprovalConfirmationMessage
            };

            showModal(function() {
                approve().then(successPromise, errorPromise);
            }, modalMessages);
        };

        $scope.getApprovalLevelName = function(level) {
            if (level === 1) return "Project Level";
            if (level === 2) return "Coordination Level";
        };

        $rootScope.$watch("currentUser.selectedProject", function() {
            init();
        });

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

        var getApprovalStatus = function(orgUnitId) {
            var getStatus = function(modules, submittedPeriods, approvedPeriodsData) {
                var dataSetCompletePeriods = approvedPeriodsData.dataSetCompletePeriods;
                var approvalData = approvedPeriodsData.approvalData;
                var findIndex = function(array, orgUnitId) {
                    return _.findIndex(array, function(obj) {
                        return obj.orgUnitId === orgUnitId;
                    });
                };

                var isSubmitted = function(submittedPeriods, orgUnitId, period) {
                    var index = findIndex(submittedPeriods, orgUnitId);
                    return index > -1 ? _.contains(submittedPeriods[index].period, period) : false;
                };

                var isComplete = function(dataSetCompletePeriods, orgUnitId, period) {
                    var index = findIndex(dataSetCompletePeriods, orgUnitId);
                    return index > -1 ? _.contains(dataSetCompletePeriods[index].period, period) : false;
                };

                var getApprovalLevel = function(approvalData, orgUnitId, period) {
                    if (approvalData[orgUnitId]) {
                        var data = _.find(approvalData[orgUnitId], {
                            "period": period
                        }) || {};

                        if (data.isApproved) {
                            return 2;
                        }
                    }
                };

                var getNextApprovalLevel = function(currentApprovalLevel, submitted) {
                    if (!currentApprovalLevel && submitted) return 1;
                    return currentApprovalLevel < 2 ? currentApprovalLevel + 1 : undefined;
                };

                var getWeeksToDisplayStatus = function(openingDate) {
                    var orgUnitDuration = moment().diff(moment(openingDate), 'weeks');
                    return orgUnitDuration > properties.weeksToDisplayStatusInDashboard ? properties.weeksToDisplayStatusInDashboard : orgUnitDuration + 1;
                };

                return _.map(modules, function(mod) {
                    var weeksToDisplayStatus = getWeeksToDisplayStatus(mod.openingDate);
                    var status = _.map(_.range(weeksToDisplayStatus - 1, -1, -1), function(i) {
                        var period = dateUtils.toDhisFormat(moment().isoWeek(moment().isoWeek() - i));
                        var submitted = isSubmitted(submittedPeriods, mod.id, period);
                        var approvalLevel = isComplete(dataSetCompletePeriods, mod.id, period) ? 1 : undefined;
                        approvalLevel = getApprovalLevel(approvalData, mod.id, period) || approvalLevel;

                        var nextApprovalLevel = getNextApprovalLevel(approvalLevel, submitted);

                        return {
                            "period": period,
                            "submitted": submitted,
                            "nextApprovalLevel": nextApprovalLevel
                        };
                    });

                    return {
                        "moduleId": mod.id,
                        "moduleName": mod.parent.name + " - " + mod.name,
                        "status": status
                    };
                });
            };

            return orgUnitRepository.getAllModulesInOrgUnits([orgUnitId]).then(function(modules) {
                return $q.all([
                    getSubmittedPeriodsForModules(modules, properties.weeksToDisplayStatusInDashboard),
                    getApprovedPeriodsForModules(modules, properties.weeksToDisplayStatusInDashboard)
                ]).then(function(data) {
                    var submittedPeriods = data[0];
                    var approvedPeriodsData = data[1];
                    return getStatus(modules, submittedPeriods, approvedPeriodsData);
                });
            });
        };

        var getSubmittedPeriodsForModules = function(modules, numOfWeeks) {
            var endPeriod = dateUtils.toDhisFormat(moment());
            var startPeriod = dateUtils.toDhisFormat(moment().subtract(numOfWeeks, 'week'));

            var filterDraftData = function(data) {
                return _.filter(data, function(datum) {
                    return datum.isDraft !== true;
                });
            };

            return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, _.pluck(modules, "id")).then(function(data) {
                data = filterDraftData(data);
                var dataValuesByOrgUnit = _.groupBy(data, 'orgUnit');
                return _.map(_.keys(dataValuesByOrgUnit), function(moduleId) {
                    return {
                        "orgUnitId": moduleId,
                        "period": _.pluck(dataValuesByOrgUnit[moduleId], "period")
                    };
                });
            });
        };

        var filterDeletedData = function(data) {
            return _.filter(data, function(datum) {
                return datum.status !== "DELETED";
            });
        };

        var filterLevelOneApprovedData = function(data) {
            return _.filter(data, function(datum) {
                return datum.isComplete && !datum.isApproved && datum.status !== "DELETED";
            });
        };

        var filterLevelTwoApprovedData = function(data) {
            return _.filter(data, function(datum) {
                return datum.isApproved && datum.status !== "DELETED";
            });
        };

        var getApprovedPeriodsForModules = function(modules, numOfWeeks) {
            var result = {};
            var endPeriod = dateUtils.toDhisFormat(moment());
            var startPeriod = dateUtils.toDhisFormat(moment().subtract(numOfWeeks, 'week'));

            return approvalDataRepository.getApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, _.pluck(modules, "id")).then(function(data) {
                var completeData = filterLevelOneApprovedData(data);
                var approvedData = filterLevelTwoApprovedData(data);

                var completeDataByOrgUnit = _.groupBy(completeData, 'orgUnit');
                result.dataSetCompletePeriods = _.map(_.keys(completeDataByOrgUnit), function(moduleId) {
                    return {
                        "orgUnitId": moduleId,
                        "period": _.pluck(completeDataByOrgUnit[moduleId], "period")
                    };
                });
                result.approvalData = _.groupBy(data, 'orgUnit');
                return result;
            });
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

            if ($rootScope.hasRoles(['Data entry user', 'Project Level Approver', 'Coordination Level Approver']) && $rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                $scope.loading = true;
                getApprovalStatus($rootScope.currentUser.selectedProject.id).then(function(approvalStatusData) {
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
