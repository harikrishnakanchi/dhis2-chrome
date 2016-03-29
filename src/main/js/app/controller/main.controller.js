define(["chromeUtils", "lodash"], function(chromeUtils, _) {
    return function($q, $scope, $location, $rootScope, $hustle, $timeout, ngI18nResourceBundle, db, packagedDataImporter, sessionHelper, orgUnitRepository, systemSettingRepository, dhisMonitor) {
        $scope.projects = [];

        $scope.getConnectedToMessage = function() {
            var praxisVersionMessage = 'Version ' + chrome.runtime.getManifest().version + ' ';
            var dhisUrl = systemSettingRepository.getDhisUrl();
            var message = $scope.resourceBundle ? $scope.resourceBundle.connectedTo + " " + dhisUrl : "";
            return dhisUrl ? praxisVersionMessage + message : praxisVersionMessage;
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

        var deregisterCurrentUserLocaleWatcher = $rootScope.$watch("currentUser.locale", function() {
            var getResourceBundle = function(locale, shouldFetchTranslations) {
                var fetchResourceBundleFromDb = function() {
                    var store = db.objectStore('translations');
                    var query = db.queryBuilder().$index('by_locale').$eq($rootScope.currentUser.locale).compile();
                    return store.each(query).then(function(translations) {
                        _.transform(translations, function(acc, translation) {
                            if (translation.className === "DataElement" && translation.property !== "formName")
                                return;
                            acc[translation.objectUid] = translation.value;
                        }, $rootScope.resourceBundle);
                    });
                };

                var getTranslationsForCurrentLocale = function() {
                    if (!$rootScope.currentUser.locale) $rootScope.currentUser.locale = "en";
                    fetchResourceBundleFromDb();
                };

                ngI18nResourceBundle.get({
                    "locale": locale
                }).then(function(data) {
                    $rootScope.resourceBundle = data.data;
                    if (shouldFetchTranslations) getTranslationsForCurrentLocale();
                });
            };

            return $rootScope.currentUser ? getResourceBundle($rootScope.currentUser.locale, true) : getResourceBundle("en", false);
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
            deregisterCurrentUserLocaleWatcher();
        });

        var checkConnectionQuality = function() {
            $scope.poorConnection = dhisMonitor.hasPoorConnectivity();
            $timeout(checkConnectionQuality, 5000);
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
