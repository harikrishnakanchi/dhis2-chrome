define(["lodash", "platformUtils", "customAttributes", "properties", "interpolate", "metadataConf", "hustlePublishUtils"], function(_, platformUtils, customAttributes, properties, interpolate, metadataConf, hustlePublishUtils) {
    return function($q, $scope, $location, $rootScope, $hustle, $timeout, $modal, sessionHelper, orgUnitRepository, systemSettingRepository, changeLogRepository, dhisMonitor) {
        $scope.projects = [];

        $scope.canChangeProject = function(hasUserLoggedIn, isCoordinationApprover) {
            return hasUserLoggedIn && isCoordinationApprover;
        };

        $scope.isActive = function(viewLocationRegex) {
            var re = new RegExp(viewLocationRegex);
            return re.test($location.path());
        };

        $scope.hideSyncStatus = function () {
            return $location.path() == '/downloadingMetadata' || $location.path() == '/productKeyPage';
        };

        $scope.isProductKeyPage = function () {
            return $location.path() == '/productKeyPage';
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
                            "name": module.name,
                            "isLineListService": customAttributes.getBooleanAttributeValue(module.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE)
                        };
                    });
                });
            }
        };

        var getModulesInOpUnit = function(opUnit) {
            return orgUnitRepository.getAllModulesInOrgUnits(opUnit.id, "Module").then(function(modules) {
                return {
                    'name': opUnit.name,
                    'id': opUnit.id,
                    'modules': _.map(modules, function(module) {
                        return {
                            "id": module.id,
                            "name": module.name,
                            "isLineListService": customAttributes.getBooleanAttributeValue(module.attributeValues, customAttributes.LINE_LIST_ATTRIBUTE_CODE)
                        };
                    })
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
            var resourceBundleKey = $rootScope.remainingJobs == 1 ? 'job' : 'jobs';
            return $rootScope.remainingJobs + ' ' + _.get($scope.resourceBundle, resourceBundleKey);
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
            return $scope.resourceBundle && $scope.resourceBundle[networkStatus];
        };

        $scope.uninstallPraxis = function () {
            var modalMessages = {
                "ok": $scope.resourceBundle.uninstall.okMessage,
                "title": $scope.resourceBundle.uninstall.title,
                "confirmationMessage": $scope.resourceBundle.uninstall.confirmationMessage
            };

            showModal(function () {
                $scope.startLoading();
                platformUtils.uninstall().then(function () {
                    document.getElementById('loadingPraxis').style.display = 'block';
                    document.getElementById('loadingPraxis').style.color = 'white';
                    document.getElementById('loadingPraxis').style.margin = '150px 550px 0';
                    document.getElementById('loadingPraxis').style.fontWeight = 'bold';
                    document.getElementById('loadingPraxis').innerHTML = $scope.resourceBundle.uninstall.successMessage;
                    document.getElementById('praxis').style.display = 'none';
                    $scope.stopLoading();
                });

            }, modalMessages);
        };

        var clearMetadataChangeLog = function () {
            var metadataTypes = _.keys(metadataConf.fields);
            metadataTypes = metadataTypes.concat(['pivotTables', 'charts']);
            _.each(metadataTypes, function (metadataType) {
                changeLogRepository.clear(metadataType);
            });
        };

        var downloadMetadata = function () {
            $location.path('/downloadingMetadata');
            platformUtils.sendMessage("stopBgApp");
            $scope.logout();
        };

        $scope.forceDownloadMetadata = function () {
            var modalMessages = {
                "ok": $scope.resourceBundle.forceDownloadMetadata.okMessage,
                "title": $scope.resourceBundle.forceDownloadMetadata.title,
                "confirmationMessage": $scope.resourceBundle.forceDownloadMetadata.confirmationMessage
            };

            showModal(function () {
                clearMetadataChangeLog();
                downloadMetadata();
            }, modalMessages);
        };

        var clearProjectDataChangeLog = function () {
            var projectDataTypes = ['dataValues:', 'monthlyChartData:', 'monthlyPivotTableData:',  'weeklyChartData:',
                'weeklyPivotTableData:',  'yearlyChartData:', 'yearlyPivotTableData:', 'yearlyDataValues:'];
            _.each(projectDataTypes, function (projectDataType) {
                changeLogRepository.clear(projectDataType);
            });
        };

        var downloadProjectData = function () {
            hustlePublishUtils.publishDownloadProjectData($hustle, $scope.locale);
        };

        $scope.forceDownloadProjectData = function () {
            var modalMessages = {
                "ok": $scope.resourceBundle.forceDownloadProjectData.okMessage,
                "title": $scope.resourceBundle.forceDownloadProjectData.title,
                "confirmationMessage": $scope.resourceBundle.forceDownloadProjectData.confirmationMessage
            };

            showModal(function () {
                clearProjectDataChangeLog();
                downloadProjectData();
            }, modalMessages);
        };

        $scope.showForceDownload = function () {
          return !$scope.isOffline && !$scope.isChromeApp;
        };

        var turnOffSync = function () {
            var modalMessage = {
                "ok": $scope.resourceBundle.okLabel,
                "title": $scope.resourceBundle.sync.turnOff,
                "confirmationMessage": $scope.resourceBundle.sync.turnOffConfirmationMessage
            };

            showModal(function () {
                $scope.isOffline = true;
                systemSettingRepository.upsertSyncSetting($scope.isOffline).then(function () {
                    platformUtils.sendMessage("stopBgApp");
                });
            }, modalMessage);
        };

        var turnOnSync = function () {
            var modalMessage = {
                "ok": $scope.resourceBundle.okLabel,
                "title": $scope.resourceBundle.sync.turnOn,
                "confirmationMessage": $scope.resourceBundle.sync.turnOnConfirmationMessage
            };

            showModal(function () {
                $scope.isOffline = false;
                if(platformUtils.platform == 'pwa') {
                    window.Praxis.update();
                }
                systemSettingRepository.upsertSyncSetting($scope.isOffline).then(function () {
                    platformUtils.sendMessage("startBgApp");
                });
            }, modalMessage);
        };

        var showModal = function(okCallback, messages) {
            var scope = $rootScope.$new();
            scope.modalMessages = messages;

            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: scope
            });

            return modalInstance.result.then(okCallback);
        };

        $scope.toggleSync = function () {
            if ($scope.isOffline) {
                turnOnSync();
            } else {
                turnOffSync();
            }
        };

        var init = function() {
            $scope.isChromeApp = platformUtils.platform == 'chrome';

            systemSettingRepository.isSyncOff().then(function (isOffline) {
                $scope.isOffline = isOffline;
            }).then(checkConnectionQuality);
        };

        init();
    };
});
