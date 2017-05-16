define(["lodash", "moment", "interpolate", "customAttributes"],
    function(_, moment, interpolate, customAttributes) {
        return function($scope, $routeParams, $q, $location, $rootScope, $modal, orgUnitRepository) {

            var deregisterWeekModulerWatcher = $scope.$watchCollection('[week, currentModule, resourceBundle]', function() {
                $scope.errorMessage = undefined;
                if ($scope.week && $scope.currentModule) {
                    if (isOpeningDateInFuture()) {
                        $scope.errorMessage = interpolate($scope.resourceBundle.openingDateInFutureError, {
                            week: moment($scope.currentModule.openingDate).isoWeek(),
                            year: moment($scope.currentModule.openingDate).year()
                        });
                        $scope.$emit('errorInfo', $scope.errorMessage);
                        return;
                    }
                    $scope.$emit('moduleWeekInfo', [$scope.currentModule, $scope.week]);
                }
            });

            var isOpeningDateInFuture = function() {
                return moment($scope.currentModule.openingDate).isAfter(moment($scope.week.endOfWeek));
            };

            var confirmAndProceed = function(okCallback, message) {
                $scope.modalMessages = message;
                var modalInstance = $modal.open({
                    templateUrl: 'templates/confirm-dialog.html',
                    controller: 'confirmDialogController',
                    scope: $scope
                });

                return modalInstance.result
                    .then(function() {
                        $scope.cancelSubmit = false;
                        return okCallback();
                    }, function() {
                        $scope.cancelSubmit = true;
                    });
            };

            var deregisterSelf = $scope.$on('$routeChangeStart', function(event, newUrl) {
                var okCallback = function() {
                    deregisterSelf();
                    var url = _.reduce(newUrl.pathParams, function(path, value, key) {
                        var regex = new RegExp(':'+ key, "gi");
                        return path.replace(regex, value.toString());
                        }, newUrl.originalPath);
                    $location.url(url);
                };
                var message = {
                    "confirmationMessage": $scope.resourceBundle.leavePageConfirmationMessage
                };
                if ($scope.preventNavigation) {
                    confirmAndProceed(okCallback, message);
                    event.preventDefault();
                }
            });

            var isLineListService = function(orgUnit) {
                return customAttributes.getBooleanAttributeValue(orgUnit.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE);
            };

            var getAggregateModules = function(modules) {
                return _.filter(modules, function(module) {
                    return !isLineListService(module);
                });
            };

            var getFilteredModulesWithDisplayNames = function(modules) {
                if ($scope.dataType == "aggregate")
                    modules = getAggregateModules(modules);

                return _.map(modules, function(module) {
                    module.displayName = module.parent.name + ' - ' + module.name;
                    return module;
                });
            };

            var setAvailableModules = function() {
                if ($rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                    return orgUnitRepository.getAllModulesInOrgUnits($rootScope.currentUser.selectedProject.id)
                        .then(orgUnitRepository.enrichWithParent)
                        .then(function(modules) {
                        $scope.modules = getFilteredModulesWithDisplayNames(modules);
                    });
                } else {
                    $scope.modules = [];
                    return $q.when({});
                }
            };

            var deregisterSelectedProjectListener = $scope.$on('selectedProjectUpdated', init);

            $scope.$on('$destroy', function() {
                deregisterSelectedProjectListener();
                deregisterWeekModulerWatcher();
            });

            var init = function() {
                var setInitialModuleAndWeek = function() {
                    var setSelectedModule = function(moduleId) {
                        $scope.currentModule = _.find($scope.modules, function(module) {
                            return module.id === moduleId;
                        });
                    };

                    var setSelectedWeek = function(period) {
                        var m = moment(period, "GGGG[W]W");

                        $scope.year = m.year();
                        $scope.month = m.month();
                        $scope.week = {
                            "weekNumber": m.isoWeek(),
                            "weekYear": m.isoWeekYear(),
                            "startOfWeek": m.startOf("isoWeek").format("YYYY-MM-DD"),
                            "endOfWeek": m.endOf("isoWeek").format("YYYY-MM-DD")
                        };
                    };

                    if ($routeParams.module) {
                        setSelectedModule($routeParams.module);
                    }

                    if ($routeParams.module && $routeParams.week) {
                        setSelectedWeek($routeParams.week);
                    }
                };

                $location.hash('top');

                setAvailableModules().then(setInitialModuleAndWeek);
            };

            init();
        };
    });
