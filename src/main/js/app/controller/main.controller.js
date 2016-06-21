define(["chromeUtils", "lodash"], function(chromeUtils, _) {
    return function($q, $scope, $location, $rootScope, $hustle, $timeout, $interpolate, ngI18nResourceBundle, db, packagedDataImporter, sessionHelper, orgUnitRepository, systemSettingRepository, dhisMonitor) {
        $scope.projects = [];

        $scope.getConnectedToMessage = function() {
            var connectToExpression = $interpolate($scope.resourceBundle.connectedToMessage, false, null, true);
            return connectToExpression({
                praxis_version: chromeUtils.getPraxisVersion(),
                dhis_url: systemSettingRepository.getDhisUrl()
            });
        };

        $scope.canChangeProject = function(hasUserLoggedIn, isCoordinationApprover) {
            return hasUserLoggedIn && isCoordinationApprover;
        };

        $scope.isActive = function(viewLocationRegex) {
            var re = new RegExp(viewLocationRegex);
            return re.test($location.path());
        };

        $scope.hasSelectedProject = function() {
            if (_.isUndefined($rootScope.currentUser.selectedProject))
                return false;

            return true;
        };

        $scope.showTestLogo = function() {
            return !systemSettingRepository.isKeyGeneratedFromProd();
        };

        var buildResourceBundle = $rootScope.$watch("locale", function() {
            ngI18nResourceBundle.get({
                "locale": $rootScope.locale
            }).then(function(data) {
                $rootScope.resourceBundle = data.data;
            });
        });

        var loadProjects = function() {
            if ($rootScope.currentUser && $rootScope.currentUser.organisationUnits) {
                $scope.projects = _.sortBy($rootScope.currentUser.organisationUnits, "name");
                if (!_.isEmpty($scope.projects) && $rootScope.currentUser.selectedProject) {
                    $scope.selectedProject = _.find($scope.projects, "id", $rootScope.currentUser.selectedProject.id);
                }
            }
        };

        var loadUserLineListModules = function() {
            if ($rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                return orgUnitRepository.getAllModulesInOrgUnits($rootScope.currentUser.selectedProject.id).then(function(modules) {
                    $scope.allUserModules = _.map(modules, function(module) {
                        return {
                            "id": module.id,
                            "displayName": module.parent.name + ' - ' + module.name,
                            "isLineListService": _.any(module.attributeValues, {
                                "attribute": {
                                    "code": "isLineListService"
                                },
                                "value": "true"
                            })
                        };
                    });
                });
            }
        };

        var getModulesInOpUnit = function(opUnit) {
            return orgUnitRepository.getAllModulesInOrgUnits(opUnit.id, "Module").then(function(modules) {
                return {
                    'opUnitName': opUnit.name,
                    'modules': modules
                };
            });
        };

        var loadReportOpunitAndModules = function() {
             return orgUnitRepository.getAllOpUnitsInOrgUnits($rootScope.currentUser.selectedProject.id).then(function(opUnits) {
                 return $q.all(_.map(opUnits, getModulesInOpUnit)).then(function(allOpUnitsWithModules) {
                     $scope.allOpUnitsWithModules = allOpUnitsWithModules;
                 });
            });
        };
        $scope.logout = function() {
            sessionHelper.logout();
        };

        $scope.setSelectedProject = function(selectedProject) {
            $rootScope.currentUser.selectedProject = selectedProject;
            loadUserLineListModules();
            loadReportOpunitAndModules();
            $rootScope.$emit('selectedProjectUpdated');
            sessionHelper.saveSessionState();
            $location.path("/dashboard");
        };

        var deregisterUserPreferencesListener = $rootScope.$on('userPreferencesUpdated', function() {
            loadProjects();
            if ($rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                loadUserLineListModules();
                loadReportOpunitAndModules();
            }
        });

        $scope.$on('$destroy', function() {
            deregisterUserPreferencesListener();
            buildResourceBundle();
        });

        var checkConnectionQuality = function() {
            $scope.poorConnection = dhisMonitor.hasPoorConnectivity();
            $timeout(checkConnectionQuality, 5000);
        };

        $scope.gotoProductKeyPage = function () {
            if($location.path() != '/productKeyPage') {
                var currentLocation = $location.path();
                $location.path("/productKeyPage").search({prev: currentLocation});
            }
        };

        var init = function() {

            var validateAndContinue = function(isProductKeySet) {
                if (!isProductKeySet) {
                    $location.path("/productKeyPage");
                } else {
                    chromeUtils.sendMessage("dbReady");
                    $location.path("/login");
                }
            };

            checkConnectionQuality();

            $scope.allUserLineListModules = [];
            packagedDataImporter.run()
                .then(systemSettingRepository.isProductKeySet)
                .then(validateAndContinue);
        };

        init();
    };
});
