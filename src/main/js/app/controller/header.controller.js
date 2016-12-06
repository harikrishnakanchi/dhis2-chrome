define(["lodash", "platformUtils", "customAttributes", "properties", "interpolate"], function(_, platformUtils, customAttributes, properties, interpolate) {
    return function($q, $scope, $location, $rootScope, $hustle, $timeout, db, sessionHelper, orgUnitRepository, systemSettingRepository, dhisMonitor) {
        $scope.projects = [];

        $scope.canChangeProject = function(hasUserLoggedIn, isCoordinationApprover) {
            return hasUserLoggedIn && isCoordinationApprover;
        };

        $scope.isActive = function(viewLocationRegex) {
            var re = new RegExp(viewLocationRegex);
            return re.test($location.path());
        };

        $scope.hasSelectedProject = function() {
            return !!$rootScope.currentUser.selectedProject;
        };

        $scope.showTestLogo = function() {
            return !systemSettingRepository.isKeyGeneratedFromProd();
        };

        $scope.getSupportEmailMessage = function () {
            return interpolate(_.get($scope.resourceBundle, 'contactSupport'), {supportEmail: properties.support_email});
        };

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
                return orgUnitRepository.getAllModulesInOrgUnits($rootScope.currentUser.selectedProject.id)
                    .then(orgUnitRepository.enrichWithParent)
                    .then(function(modules) {
                    $scope.allUserModules = _.map(modules, function(module) {
                        return {
                            "id": module.id,
                            "displayName": module.parent.name + ' - ' + module.name,
                            "isLineListService": customAttributes.getBooleanAttributeValue(module.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE)
                        };
                    });
                });
            }
        };

        var getModulesInOpUnit = function(opUnit) {
            return orgUnitRepository.getAllModulesInOrgUnits(opUnit.id, "Module").then(function(modules) {
                return {
                    'opUnitName': opUnit.name,
                    'opUnitId': opUnit.id,
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

        $rootScope.$on('userPreferencesUpdated', function() {
            loadProjects();
            if ($rootScope.currentUser && $rootScope.currentUser.selectedProject) {
                loadUserLineListModules();
                loadReportOpunitAndModules();
            }
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

        $scope.versionNumber = function () {
            var praxisVersion = platformUtils.getPraxisVersion();
            if (!praxisVersion) return '';
            return praxisVersion;
        };

        $scope.getRemainingJobs = function () {
            var resourceBundleKey = $rootScope.remainingJobs == 1 ? 'jobRemaining' : 'jobsRemaining';
            return $rootScope.remainingJobs + ' ' + $scope.resourceBundle[resourceBundleKey];
        };

        $scope.networkStatus = function () {
            var networkStatus;
            if ($scope.isDhisOnline && $scope.poorConnection) {
                networkStatus = 'poorConnectivity';
            } else if ($scope.isDhisOnline) {
                networkStatus = 'online';
            }
            else {
                networkStatus = 'offline';
            }
            return $scope.resourceBundle[networkStatus];
        };

        var init = function() {
            checkConnectionQuality();
        };

        init();
    };
});
