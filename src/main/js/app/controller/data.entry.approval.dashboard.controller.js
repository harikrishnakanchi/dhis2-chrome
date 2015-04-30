define(["properties", "moment", "dateUtils", "lodash"], function(properties, moment, dateUtils, _) {
    return function($scope, $hustle, $q, $rootScope, $modal, $timeout, $location, orgUnitRepository, approvalDataRepository, dataRepository, programEventRepository) {

        $rootScope.$watch("currentUser.selectedProject", function() {
            init();
        });

        $scope.formatPeriods = function(period) {
            m = moment(period, "GGGG[W]W");
            return m.format("[W]W") + " - " + m.startOf("isoWeek").toDate().toLocaleDateString() + " - " + m.endOf("isoWeek").toDate().toLocaleDateString();
        };

        $scope.toggleSelectAll = function(selectedAllItemsForApproval) {
            var itemsAwaitingApprovalAtUserLevel = [];

            if ($rootScope.hasRoles(['Project Level Approver']))
                itemsAwaitingApprovalAtUserLevel = _.filter($scope.dashboardData, {
                    'isSubmitted': true,
                    'isComplete': false
                });

            if ($rootScope.hasRoles(['Coordination Level Approver']))
                itemsAwaitingApprovalAtUserLevel = _.filter($scope.dashboardData, {
                    'isSubmitted': true,
                    'isComplete': true,
                    'isApproved': false
                });

            _.each(itemsAwaitingApprovalAtUserLevel, function(item) {
                item.selectedForApproval = selectedAllItemsForApproval;
            });
        };

        $scope.bulkApprove = function() {

            var successPromise = function(data) {
                $scope.approveSuccess = true;
                $scope.approveError = false;

                $timeout(function() {
                    $scope.approveSuccess = false;
                }, properties.messageTimeout);

                init();
            };

            var errorPromise = function(data) {
                $scope.approveSuccess = false;
                $scope.approveError = true;

                $timeout(function() {
                    $scope.approveError = false;
                }, properties.messageTimeout);

                init();
            };

            var approve = function() {

                var periodsAndOrgUnitsToBeApproved = _.transform($scope.dashboardData, function(results, item) {
                    if (item.selectedForApproval === true)
                        results.push({
                            "period": item.period,
                            "orgUnit": item.moduleId
                        });
                });

                var publishToDhis = function(messageType, desc) {
                    return $hustle.publish({
                        "data": periodsAndOrgUnitsToBeApproved,
                        "type": messageType,
                        "locale": $scope.currentUser.locale,
                        "desc": desc
                    }, "dataValues");
                };

                if ($rootScope.hasRoles(['Project Level Approver']))
                    return approvalDataRepository.markAsComplete(periodsAndOrgUnitsToBeApproved, $rootScope.currentUser.userCredentials.username)
                        .then(_.partial(publishToDhis, "uploadCompletionData", $scope.resourceBundle.uploadCompletionDataDesc + _.pluck(periodsAndOrgUnitsToBeApproved, "period")));
                if ($rootScope.hasRoles(['Coordination Level Approver']))
                    return approvalDataRepository.markAsApproved(periodsAndOrgUnitsToBeApproved, $rootScope.currentUser.userCredentials.username)
                        .then(_.partial(publishToDhis, "uploadApprovalData", $scope.resourceBundle.uploadApprovalDataDesc + _.pluck(periodsAndOrgUnitsToBeApproved, "period")));
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.dataApprovalConfirmationMessage
            };

            showModal(function() {
                approve().then(successPromise, errorPromise);
            }, modalMessages);
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

        var getUserModules = function() {
            return orgUnitRepository.getAllModulesInOrgUnits([$rootScope.currentUser.selectedProject.id]);
        };

        var getDataSubmissionInfo = function(moduleIds, startPeriod, endPeriod) {
            return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(function(data) {

                data = _.reject(data, 'isDraft', true);

                var dataSubmissionInfo = _.map(data, function(datum) {
                    return {
                        "period": dateUtils.getFormattedPeriod(datum.period),
                        "moduleId": datum.orgUnit,
                        "isSubmitted": true
                    };
                });

                return _.indexBy(dataSubmissionInfo, function(data) {
                    return data.period + data.moduleId;
                });
            });
        };

        var getEventsSubmissionInfo = function(moduleIds, startPeriod, endPeriod) {
            return orgUnitRepository.findAllByParent(moduleIds).then(function(orginOrgUnits) {
                var orginOrgUnitIds = _.pluck(orginOrgUnits, "id");
                var indexedOrginOrgUnits = _.indexBy(orginOrgUnits, "id");

                return programEventRepository.getEventsFromPeriod(startPeriod, orginOrgUnitIds).then(function(data) {

                    data = _.reject(data, function(dataum) {
                        return dataum.localStatus && dataum.localStatus !== "READY_FOR_DHIS";
                    });

                    var eventsSubmissionInfo = _.uniq(_.map(data, function(datum) {
                        return {
                            "period": dateUtils.getFormattedPeriod(datum.period),
                            "moduleId": indexedOrginOrgUnits[datum.orgUnit].parent.id,
                            "isSubmitted": true
                        };
                    }));

                    return _.indexBy(eventsSubmissionInfo, function(data) {
                        return data.period + data.moduleId;
                    });
                });
            });
        };

        var getApprovalsInfo = function(moduleIds, startPeriod, endPeriod) {
            return approvalDataRepository.getApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(function(data) {

                data = _.reject(data, 'status', 'DELETED');

                var approvalData = _.map(data, function(datum) {
                    return {
                        "period": dateUtils.getFormattedPeriod(datum.period),
                        "moduleId": datum.orgUnit,
                        "isComplete": datum.isComplete,
                        "isApproved": datum.isApproved
                    };
                });

                return _.indexBy(approvalData, function(data) {
                    return data.period + data.moduleId;
                });
            });
        };

        var loadDashboard = function(modules) {

            var moduleIds = _.pluck(modules, "id");
            var startPeriod = dateUtils.toDhisFormat(moment().subtract(properties.weeksToDisplayStatusInDashboard, 'week'));
            var endPeriod = dateUtils.toDhisFormat(moment());

            var getDataSubmissionInfoPromise = getDataSubmissionInfo(moduleIds, startPeriod, endPeriod);
            var getEventsSubmissionInfoPromise = getEventsSubmissionInfo(moduleIds, startPeriod, endPeriod);
            var getApprovalsInfoPromise = getApprovalsInfo(moduleIds, startPeriod, endPeriod);

            return $q.all([getDataSubmissionInfoPromise, getEventsSubmissionInfoPromise, getApprovalsInfoPromise]).then(function(data) {

                var submittedData = data[0];
                var submittedEventsData = data[1];
                var approvalData = data[2];

                var results = [];
                _.each(modules, function(module) {
                    var weeksToDisplayStatus = _.min([properties.weeksToDisplayStatusInDashboard, moment().diff(moment(module.openingDate), 'weeks') + 1]);

                    results = results.concat(_.times(weeksToDisplayStatus, function(n) {
                        var period = dateUtils.toDhisFormat(moment().subtract(weeksToDisplayStatus - n - 1, 'weeks'));
                        return {
                            "moduleId": module.id,
                            "moduleName": module.parent.name + " - " + module.name,
                            "period": period,
                            "isSubmitted": submittedData[period + module.id] && submittedData[period + module.id].isSubmitted || submittedEventsData[period + module.id] && submittedEventsData[period + module.id].isSubmitted || false,
                            "isComplete": approvalData[period + module.id] && approvalData[period + module.id].isComplete || false,
                            "isApproved": approvalData[period + module.id] && approvalData[period + module.id].isApproved || false
                        };
                    }));
                });

                $scope.dashboardData = _.sortByAll(results, "moduleName", "period");

                $scope.itemsAwaitingSubmission = _.filter($scope.dashboardData, {
                    'isSubmitted': false
                });

                $scope.itemsAwaitingApprovalAtUserLevel = [];
                $scope.itemsAwaitingApprovalAtOtherLevels = _.filter($scope.dashboardData, {
                    'isSubmitted': true,
                    'isApproved': false
                });

                if ($rootScope.hasRoles(['Project Level Approver'])) {
                    $scope.itemsAwaitingApprovalAtUserLevel = _.filter($scope.dashboardData, {
                        'isSubmitted': true,
                        'isComplete': false
                    });
                    $scope.itemsAwaitingApprovalAtOtherLevels = _.filter($scope.dashboardData, {
                        'isSubmitted': true,
                        'isComplete': true,
                        'isApproved': false
                    });
                }

                if ($rootScope.hasRoles(['Coordination Level Approver'])) {
                    $scope.itemsAwaitingApprovalAtUserLevel = _.filter($scope.dashboardData, {
                        'isSubmitted': true,
                        'isComplete': true,
                        'isApproved': false
                    });
                    $scope.itemsAwaitingApprovalAtOtherLevels = _.filter($scope.dashboardData, {
                        'isSubmitted': true,
                        'isComplete': false
                    });
                }
            });
        };

        var init = function() {
            if ($rootScope.currentUser) {
                $scope.loading = true;
                return getUserModules().then(loadDashboard).finally(function() {
                    $scope.loading = false;
                });
            }
        };

        init();
    };
});
