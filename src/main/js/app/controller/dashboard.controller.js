define(["properties", "moment", "dateUtils", "lodash", "interpolate"], function(properties, moment, dateUtils, _, interpolate) {
    return function($scope, $hustle, $q, $rootScope, $modal, $timeout, $location, $anchorScroll, approvalDataRepository, moduleDataBlockFactory, checkVersionCompatibility, dataSyncFailureRepository) {

        $scope.formatPeriods = function(period) {
            m = moment(period, "GGGG[W]W");
            return m.format("[W]W") + " - " + m.startOf("isoWeek").toDate().toLocaleDateString() + " - " + m.endOf("isoWeek").toDate().toLocaleDateString();
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

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
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
                var currentUsersUsername = $rootScope.currentUser.userCredentials.username,
                    moduleDataBlocksToBeApproved = _.filter($scope.moduleDataBlocks, 'selectedForApproval'),
                    periodsAndOrgUnitsToBeApproved = _.map(moduleDataBlocksToBeApproved, function(moduleDataBlock) {
                        return {
                            "period": moduleDataBlock.period,
                            "orgUnit": moduleDataBlock.moduleId
                        };
                    });

                var publishToDhis = function() {
                    var publishPromises = _.map(moduleDataBlocksToBeApproved, function(moduleDataBlock) {
                        return $hustle.publishOnce({
                            data: {
                                moduleId: moduleDataBlock.moduleId,
                                period: moduleDataBlock.period
                            },
                            type: 'syncModuleDataBlock',
                            locale: $scope.locale,
                            desc: interpolate($scope.resourceBundle.syncModuleDataBlockDesc, {
                                period: moduleDataBlock.period + ", " + moduleDataBlock.moduleName
                            })
                        }, "dataValues");
                    });
                    return $q.all(publishPromises);
                };

                var clearFailedToSync = function (){
                    var resetModuleFailedToSync = _.map(moduleDataBlocksToBeApproved, function(moduleDataBlock) {
                        return dataSyncFailureRepository.delete(moduleDataBlock.moduleId, moduleDataBlock.period);
                    });
                    return $q.all(resetModuleFailedToSync);
                };

                if ($rootScope.hasRoles(['Project Level Approver']))
                    return approvalDataRepository.markAsComplete(periodsAndOrgUnitsToBeApproved, currentUsersUsername)
                        .then(clearFailedToSync)
                        .then(publishToDhis);
                if ($rootScope.hasRoles(['Coordination Level Approver']))
                    return approvalDataRepository.markAsApproved(periodsAndOrgUnitsToBeApproved, currentUsersUsername)
                        .then(clearFailedToSync)
                        .then(publishToDhis);
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.dataApprovalConfirmationMessage
            };

            showModal(function() {
                approve().then(successPromise, errorPromise).then(scrollToTop);
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

        $scope.itemsArePresent = function (object) {
            return !_.isEmpty(object);
        };
        
        $scope.getModuleName = function (moduleName) {
            return moduleName.split(' - ')[1];
        };

        var loadDashboard = function() {
            var periodRange = dateUtils.getPeriodRange(properties.weeksToDisplayStatusInDashboard);

            return moduleDataBlockFactory.createForProject($rootScope.currentUser.selectedProject.id, periodRange).then(function(moduleDataBlocks) {
                moduleDataBlocks = _.sortByAll(moduleDataBlocks, "moduleName", "period");
                $scope.moduleDataBlocks = moduleDataBlocks;

                var itemsAwaitingSubmission = _.sortBy(_.filter(moduleDataBlocks, { awaitingActionAtDataEntryLevel: true }), 'moduleName');

                var itemsAwaitingApprovalAtUserLevel = [];
                var itemsAwaitingApprovalAtOtherLevels = _.sortBy(_.union(
                    _.filter(moduleDataBlocks, { awaitingActionAtProjectLevelApprover: true }),
                    _.filter(moduleDataBlocks, { awaitingActionAtCoordinationLevelApprover: true })
                ), 'moduleName');

                if ($rootScope.hasRoles(['Project Level Approver'])) {
                    itemsAwaitingApprovalAtUserLevel = _.filter(moduleDataBlocks, { awaitingActionAtProjectLevelApprover: true });
                    itemsAwaitingApprovalAtOtherLevels = _.filter(moduleDataBlocks, { awaitingActionAtCoordinationLevelApprover: true });
                }

                if ($rootScope.hasRoles(['Coordination Level Approver'])) {
                    itemsAwaitingApprovalAtUserLevel = _.filter(moduleDataBlocks, { awaitingActionAtCoordinationLevelApprover: true });
                    itemsAwaitingApprovalAtOtherLevels = _.filter(moduleDataBlocks, { awaitingActionAtProjectLevelApprover: true });
                }

                var moduleMap = _.groupBy(moduleDataBlocks, 'opUnitName');
                $scope.moduleMap = _.each(moduleMap, function (modules, opUnitName) {
                    moduleMap[opUnitName] = _.uniq(_.map(modules, 'moduleName'));
                });

                var groupItemsByOpUnitByModule = function (items) {
                    var itemsByOpUnit = _.groupBy(items, 'opUnitName');
                    return _.each(itemsByOpUnit, function (moduleDataBlocks, opUnit) {
                        itemsByOpUnit[opUnit] = _.groupBy(moduleDataBlocks, 'moduleName');
                    });
                };

                $scope.itemsAwaitingSubmission = groupItemsByOpUnitByModule(itemsAwaitingSubmission);
                $scope.itemsAwaitingApprovalAtUserLevel = groupItemsByOpUnitByModule(itemsAwaitingApprovalAtUserLevel);
                $scope.itemsAwaitingApprovalAtOtherLevels = groupItemsByOpUnitByModule(itemsAwaitingApprovalAtOtherLevels);

            });
        };

        var init = function() {
            $scope.contactSupport = interpolate($scope.resourceBundle.contactSupport, {supportEmail: properties.support_email});

            $scope.compatibilityInfo = {};
            checkVersionCompatibility($scope.compatibilityInfo);

            if ($rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                $scope.loading = true;
                return loadDashboard().finally(function() {
                    $scope.loading = false;
                });
            }
        };

        var deregisterSelectedProjectListener = $rootScope.$on('selectedProjectUpdated', function() {
            init();
        });

        $scope.$on('$destroy', function() {
            deregisterSelectedProjectListener();
        });

        init();
    };
});
