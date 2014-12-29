define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment", "datasetTransformer"],
    function(_, dataValuesMapper, groupSections, orgUnitMapper, moment, datasetTransformer) {
        return function($scope, $routeParams, $q, $location, $rootScope, orgUnitRepository, programRepository) {

            $scope.$watchCollection('[week, currentModule]', function() {
                if ($scope.week && $scope.currentModule) {
                    programRepository.getProgramsForOrgUnit($scope.currentModule.id).then(function(programs) {
                        if (_.isEmpty(programs)) {
                            $scope.programsInCurrentModule = undefined;
                            $scope.formTemplateUrl = "templates/partials/aggregate-data-entry.html" + '?' + moment().format("X");
                        } else {
                            $scope.programsInCurrentModule = _.pluck(programs, "id");
                            $scope.formTemplateUrl = "templates/partials/line-list-data-entry.html" + '?' + moment().format("X");
                        }
                    });
                }
            });

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
                return orgUnitRepository.getAllModulesInProjects(_.pluck($rootScope.currentUser.organisationUnits, "id"), true).then(function(modules) {
                    $scope.modules = modules;
                });
            };

            var setInitialModuleAndWeek = function() {
                var setSelectedModule = function(moduleId) {
                    $scope.currentModule = _.find($scope.modules, function(module) {
                        return module.id === moduleId;
                    });
                };

                var setSelectedWeek = function(period) {
                    var m = moment(period, "GGGG[W]WW");

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

            var init = function() {
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