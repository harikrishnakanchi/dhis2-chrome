define(["lodash", "moment"],
    function(_, moment) {
        return function($scope, $routeParams, $q, $location, $rootScope, orgUnitRepository) {

            $scope.$watchCollection('[week, currentModule]', function() {
                $scope.errorMessage = undefined;
                if ($scope.week && $scope.currentModule) {
                    if (isOpeningDateInFuture()) {
                        $scope.errorMessage = $scope.resourceBundle.openingDateInFutureError + moment($scope.currentModule.openingDate).isoWeek();
                        $scope.$emit('errorInfo', $scope.errorMessage);
                        return;
                    }
                    $scope.$emit('moduleWeekInfo', [$scope.currentModule, $scope.week]);
                }

            });

            var isOpeningDateInFuture = function() {
                return moment($scope.currentModule.openingDate).isAfter(moment($scope.week.endOfWeek));
            };

            var deregisterSelf = $scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
                var okCallback = function() {
                    deregisterSelf();
                    $location.url(newUrl);
                };
                if ($scope.preventNavigation) {
                    confirmAndMove(okCallback);
                    event.preventDefault();
                }
            });

            var isLineListService = function(orgUnit) {
                var attr = _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": "isLineListService"
                    }
                });
                return attr && attr.value == "true";
            };

            var getFilteredModulesWithDisplayNames = function(modules) {
                modules = _.filter(modules, function(module) {
                    return $scope.isAggregateData ? !isLineListService(module) : isLineListService(module);
                });
                return _.map(modules, function(module) {
                    module.displayName = module.parent.name + ' - ' + module.name;
                    return module;
                });
            };

            var setAvailableModules = function() {
                if ($rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                    return orgUnitRepository.getAllModulesInOrgUnits($rootScope.currentUser.selectedProject.id).then(function(modules) {
                        $scope.modules = getFilteredModulesWithDisplayNames(modules);
                    });
                } else {
                    $scope.modules = [];
                    return $q.when({});
                }
            };

            $scope.$on('selectedProjectUpdated', init);

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
                $scope.loading = true;

                setAvailableModules()
                    .then(setInitialModuleAndWeek)
                    .finally(function() {
                        $scope.loading = false;
                    });
            };

            init();
        };
    });
