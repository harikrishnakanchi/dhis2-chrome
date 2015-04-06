define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment", "datasetTransformer"],
    function(_, dataValuesMapper, groupSections, orgUnitMapper, moment, datasetTransformer) {
        return function($scope, $routeParams, $q, $location, $rootScope, orgUnitRepository, programRepository) {

            var isLineListService = function(orgUnit) {
                var attr = _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": "isLineListService"
                    }
                });
                return attr && attr.value == "true";
            };

            $scope.$watchCollection('[week, currentModule]', function() {
                $scope.errorMessage = undefined;
                if ($scope.week && $scope.currentModule) {
                    if (isOpeningDateInFuture()) {
                        $scope.errorMessage = $scope.resourceBundle.openingDateInFutureError + moment($scope.currentModule.openingDate).isoWeek();
                        return;
                    } else {
                        return loadTemplate();
                    }
                }
            });

            var loadTemplate = function() {
                if (isLineListService($scope.currentModule) && $scope.hasRoles(['Data entry user'])) {
                    $scope.formTemplateUrl = "templates/partials/line-list-summary.html" + '?' + moment().format("X");
                    return;
                }

                if ($scope.hasRoles(['Project Level Approver', 'Coordination Level Approver'])) {
                    $scope.formTemplateUrl = "templates/partials/data-approval.html" + '?' + moment().format("X");
                    return;
                }

                $scope.formTemplateUrl = "templates/partials/aggregate-data-entry.html" + '?' + moment().format("X");
            };

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

            var setAvailableModules = function() {
                return orgUnitRepository.getAllModulesInOrgUnits(_.pluck($rootScope.currentUser.organisationUnits, "id")).then(function(modules) {
                    modules = _.map(modules, function(module) {
                        module.displayName = module.parent.name + ' - ' + module.name;
                        return module;
                    });
                    $scope.modules = modules;
                });
            };

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

                    if ($routeParams.module && $routeParams.week) {
                        setSelectedModule($routeParams.module);
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
