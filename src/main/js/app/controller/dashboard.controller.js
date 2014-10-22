define(["moment", "lodash"], function(moment, _) {
    return function($scope, $hustle, $q, $rootScope, approvalHelper) {
        var dataValues = [];

        $scope.syncNow = function() {
            $scope.isSyncRunning = true;

            var onSuccess = function(response) {
                $scope.isSyncRunning = false;
                $scope.isSyncDone = true;
            };

            var downloadData = $hustle.publish({
                "type": "downloadData"
            }, "dataValues");

            return downloadData.then(onSuccess);
        };

        $scope.formatPeriods = function(period) {
            var year = period.substring(0, 4);
            var week = period.substring(4);
            m = moment(year + "-" + week);
            return "W" + m.isoWeek() + " - " + m.startOf("isoWeek").format("YYYY-MM-DD") + " - " + m.endOf("isoWeek").format("YYYY-MM-DD");
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
                    if (roleName === "Approver - Level 1") return 1;
                    if (roleName === "Approver - Level 2") return 2;
                    if (roleName === "Approver - Level 3") return 3;
                };

                var approvalRole = _.filter($rootScope.currentUser.userCredentials.userAuthorityGroups, function(role) {
                    return role.name.indexOf("Approver - Level") > -1;
                });

                return approvalRole[0] ? getApproverLevelFromRole(approvalRole[0].name) : undefined;
            };

            if ($rootScope.currentUser && $rootScope.currentUser.organisationUnits) {
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