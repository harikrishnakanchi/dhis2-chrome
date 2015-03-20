define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment", "datasetTransformer"],
    function(_, dataValuesMapper, groupSections, orgUnitMapper, moment, datasetTransformer) {
        return function($scope, $routeParams, $q, $location, $rootScope, orgUnitRepository, programRepository) {

            var isDataEntryUser = function(user) {
                return _.any(user.userCredentials.userRoles, function(userAuth) {
                    return userAuth.name === 'Data entry user';
                });
            };

            $scope.$watchCollection('[week, currentModule]', function() {
                if ($scope.week && $scope.currentModule) {
                    programRepository.getProgramForOrgUnit($scope.currentModule.id).then(function(program) {
                        if (_.isEmpty(program) || !isDataEntryUser($rootScope.currentUser)) {
                            $scope.programsInCurrentModule = undefined;
                            $scope.formTemplateUrl = "templates/partials/aggregate-data-entry.html" + '?' + moment().format("X");
                        } else {
                            $scope.programsInCurrentModule = program.id;
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
                return orgUnitRepository.getAllModulesInOrgUnitsExceptCurrentModules(_.pluck($rootScope.currentUser.organisationUnits, "id"), true).then(function(modules) {
                    modules = _.map(modules, function(module) {
                        module.displayName = module.parent.name + ' - ' + module.name;
                        return module;
                    });
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
