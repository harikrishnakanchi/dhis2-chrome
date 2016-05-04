define(["properties", "moment", "dateUtils", "lodash"], function(properties, moment, dateUtils, _) {
    return function($scope, $hustle, $q, $rootScope, $modal, $timeout, $location, approvalDataRepository, moduleDataBlockFactory) {

        var deregisterSelectedProjectListener = $rootScope.$on('selectedProjectUpdated', function() {
            init();
        });

        $scope.$on('$destroy', function() {
            deregisterSelectedProjectListener();
        });

        $scope.formatPeriods = function(period) {
            m = moment(period, "GGGG[W]W");
            return m.format("[W]W") + " - " + m.startOf("isoWeek").toDate().toLocaleDateString() + " - " + m.endOf("isoWeek").toDate().toLocaleDateString();
        };

        $scope.toggleSelectAll = function(selectedAllItemsForApproval) {
            var itemsAwaitingApprovalAtUserLevel = [];

            if ($rootScope.hasRoles(['Project Level Approver']))
                itemsAwaitingApprovalAtUserLevel = _.filter($scope.moduleDataBlocks, { awaitingActionAtProjectLevelApprover: true });

            if ($rootScope.hasRoles(['Coordination Level Approver']))
                itemsAwaitingApprovalAtUserLevel = _.filter($scope.moduleDataBlocks, { awaitingActionAtCoordinationLevelApprover: true });

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

                var periodsAndOrgUnitsToBeApproved = _.transform($scope.moduleDataBlocks, function(results, item) {
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

        var loadDashboard = function() {
            var periodRange = dateUtils.getPeriodRange(properties.weeksToDisplayStatusInDashboard);

            return moduleDataBlockFactory.createForProject($rootScope.currentUser.selectedProject.id, periodRange).then(function(moduleDataBlocks) {
                moduleDataBlocks = _.sortByAll(moduleDataBlocks, "moduleName", "period");
                $scope.moduleDataBlocks = moduleDataBlocks;

                $scope.itemsAwaitingSubmission = _.sortBy(_.union(
                    _.filter(moduleDataBlocks, { awaitingActionAtDataEntryLevel: true }),
                    _.filter(moduleDataBlocks, { isNotSynced: true })
                ), 'moduleName');
                $scope.itemsAwaitingApprovalAtUserLevel = [];
                $scope.itemsAwaitingApprovalAtOtherLevels = _.sortBy(_.union(
                    _.filter(moduleDataBlocks, { awaitingActionAtProjectLevelApprover: true, isNotSynced: false }),
                    _.filter(moduleDataBlocks, { awaitingActionAtCoordinationLevelApprover: true, isNotSynced: false })
                ), 'moduleName');

                if ($rootScope.hasRoles(['Project Level Approver'])) {
                    $scope.itemsAwaitingApprovalAtUserLevel = _.filter(moduleDataBlocks, { awaitingActionAtProjectLevelApprover: true, isNotSynced: false });
                    $scope.itemsAwaitingApprovalAtOtherLevels = _.filter(moduleDataBlocks, { awaitingActionAtCoordinationLevelApprover: true, isNotSynced: false });
                }

                if ($rootScope.hasRoles(['Coordination Level Approver'])) {
                    $scope.itemsAwaitingApprovalAtUserLevel = _.filter(moduleDataBlocks, { awaitingActionAtCoordinationLevelApprover: true, isNotSynced: false });
                    $scope.itemsAwaitingApprovalAtOtherLevels = _.filter(moduleDataBlocks, { awaitingActionAtProjectLevelApprover: true, isNotSynced: false });
                }
            });
        };

        $scope.getTemplateUrl = function(item) {

            if (item.lineListService && $scope.hasRoles(['Data entry user'])) {
                var m = moment(item.period, "GGGG[W]W");

                var startOfWeek = m.startOf("isoWeek").format("YYYY-MM-DD");
                var endOfWeek = m.endOf("isoWeek").format("YYYY-MM-DD");
                return "#/line-list-summary/" + item.moduleId + "/?filterBy=dateRange&startDate=" + startOfWeek + "&endDate=" + endOfWeek;
            }

            if ($scope.hasRoles(['Project Level Approver', 'Coordination Level Approver', 'Observer'])) {
                return "#/data-approval/" + item.moduleId + "/" + item.period;
            }

            return "#/aggregate-data-entry/" + item.moduleId + "/" + item.period;
        };

        var init = function() {
            if ($rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                $scope.loading = true;
                return loadDashboard().finally(function() {
                    $scope.loading = false;
                });
            }
        };

        init();
    };
});
