define(["lodash", "dataValuesMapper", "orgUnitMapper", "moment", "dataSetTransformer", "properties", "interpolate", "dataElementUtils"], function(_, dataValuesMapper, orgUnitMapper, moment, datasetTransformer, properties, interpolate, dataElementUtils) {
    return function($scope, $routeParams, $q, $hustle, dataRepository, excludedDataElementsRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalDataRepository,
        $timeout, orgUnitRepository, datasetRepository, programRepository, referralLocationsRepository, translationsService, moduleDataBlockFactory, dataSyncFailureRepository) {

        $scope.rowTotal = {};
        var currentPeriod, currentPeriodAndOrgUnit;
        var noReferralLocationConfigured = false;

        var resetForm = function() {
            $scope.isopen = {};
            $scope.isDatasetOpen = {};
            $scope.isSubmitted = false;
            $scope.firstLevelApproveSuccess = false;
            $scope.secondLevelApproveSuccess = false;
            $scope.approveError = false;
            $scope.syncError = false;
            $scope.excludedDataElements = {};
            $scope.rowTotal = {};
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.showForm = function() {
            if($rootScope.hasRoles(['Observer'])) {
                return $scope.isSubmitted;
            } else if($rootScope.hasRoles(['Project Level Approver'])) {
                return $scope.isSubmitted && !$scope.moduleDataBlock.awaitingActionAtDataEntryLevel;
            } else if($rootScope.hasRoles(['Coordination Level Approver'])) {
                var awaitingApprovalAtCoordinationLevel = !($scope.moduleDataBlock.awaitingActionAtDataEntryLevel || $scope.moduleDataBlock.awaitingActionAtProjectLevelApprover);
                return $scope.isSubmitted && (awaitingApprovalAtCoordinationLevel || !$scope.moduleDataBlock.active);
            }
        };

        $scope.getDatasetState = function(id, isFirst) {
            if (isFirst && !(id in $scope.isDatasetOpen)) {
                $scope.isDatasetOpen[id] = true;
            }
            return $scope.isDatasetOpen;
        };

        $scope.getValue = function(dataValues, dataElementId, option, orgUnits) {
            if (dataValues === undefined) return;

            var values = _.chain([orgUnits]).flatten().map(function (orgUnit) {
                return _.get(dataValues, [orgUnit.id, dataElementId, option, 'value'].join('.'));
            }).compact().value();

            if(!_.isEmpty(values)) return _.sum(values, _.parseInt);
        };

        $scope.sum = function(dataValues, orgUnits, dataElementId, catOptComboIdsForTotalling) {
            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];

            var allValues = [];
            _.forEach(orgUnits, function(orgUnit) {
                dataValues[orgUnit.id] = dataValues[orgUnit.id] || {};
                dataValues[orgUnit.id][dataElementId] = dataValues[orgUnit.id][dataElementId] || {};

                _.forEach(catOptComboIdsForTotalling, function(option) {
                    dataValues[orgUnit.id][dataElementId][option] = dataValues[orgUnit.id][dataElementId][option] || {};
                    allValues.push(dataValues[orgUnit.id][dataElementId][option].value);
                });
            });
            var sum = _.sum(allValues);
            $scope.rowTotal[dataElementId] = sum;
            return sum;
        };

        var getReferralDataElementIds = function(dataElements) {
            var dataElementsForReferral = _.filter(dataElements, function(de) {
                return $scope.referralLocations[de.formName] !== undefined;
            });

            return _.pluck(dataElementsForReferral, "id");
        };

        $scope.columnSum = function(dataValues, orgUnits, sectionDataElements, optionId, isReferralDataset) {
            var filteredDataElements = _.filter(sectionDataElements, {"isIncluded": true});
            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];
            var dataElementIds = isReferralDataset ? getReferralDataElementIds(filteredDataElements) : _.pluck(filteredDataElements, "id");

            var allValues = [];
            _.forEach(orgUnits, function(orgUnit) {
                dataValues[orgUnit.id] = dataValues[orgUnit.id] || {};
                _.forEach(dataValues[orgUnit.id], function(value, key) {
                    if (_.includes(dataElementIds, key)) {
                        allValues.push(parseInt(_.get(value, optionId + '.value', 0)));
                    }
                });
            });
            return _.sum(allValues);
        };

        $scope.totalSum = function(dataValues, sectionDataElements) {
            var dataElementsIds = _.pluck(sectionDataElements, "id");

            return _.reduce($scope.rowTotal, function(sum, value, key) {
                if (_.includes(dataElementsIds, key)) {
                    return sum + value;
                } else {
                    return sum;
                }
            }, 0);

        };

        $scope.originSum = function(dataValues, section) {
            return _.sum($scope.originOrgUnits, function(orgUnit) {
                var value = _.chain(dataValues)
                    .get(orgUnit.id)
                    .get(section.dataElements[0].id)
                    .get(section.baseColumnConfiguration[0].categoryOptionComboId)
                    .get('value', '0')
                    .value();
                return parseInt(value);
            });
        };

        $scope.firstLevelApproval = function() {
            var completedBy = $scope.currentUser.userCredentials.username;

            var clearFailedToSync = function(){
                dataSyncFailureRepository.delete($scope.selectedModule.id, currentPeriod);
            };

            var publishToDhis = function() {
                return $hustle.publishOnce({
                    "data": {
                        period: currentPeriod,
                        moduleId: $scope.selectedModule.id
                    },
                    "type": "syncModuleDataBlock",
                    "locale": $scope.locale,
                    "desc": interpolate($scope.resourceBundle.syncModuleDataBlockDesc, {period: currentPeriod + ", " + $scope.selectedModule.name})
                }, "dataValues");
            };

            var onSuccess = function() {
                $scope.firstLevelApproveSuccess = true;
                $scope.approveError = false;
                initializeForm();
            };

            var onError = function() {
                $scope.firstLevelApproveSuccess = false;
                $scope.approveError = true;
            };

            approvalDataRepository.markAsComplete(currentPeriodAndOrgUnit, completedBy)
                .then(clearFailedToSync)
                .then(publishToDhis)
                .then(onSuccess, onError)
                .finally(scrollToTop);
        };

        $scope.secondLevelApproval = function() {

            var clearFailedToSync = function(){
                dataSyncFailureRepository.delete($scope.selectedModule.id, currentPeriod);
            };

            var onSuccess = function() {
                $scope.secondLevelApproveSuccess = true;
                $scope.approveError = false;
                initializeForm();
            };

            var onError = function() {
                $scope.secondLevelApproveSuccess = false;
                $scope.approveError = true;
            };


            var publishToDhis = function() {
                return $hustle.publishOnce({
                    "data": {
                        moduleId: $scope.selectedModule.id,
                        period: currentPeriod
                    },
                    "type": "syncModuleDataBlock",
                    "locale": $scope.locale,
                    "desc": interpolate($scope.resourceBundle.syncModuleDataBlockDesc, { period: currentPeriod + ", " + $scope.selectedModule.name })
                }, "dataValues");
            };

            var approvedBy = $scope.currentUser.userCredentials.username;

            approvalDataRepository.markAsApproved(currentPeriodAndOrgUnit, approvedBy)
                .then(clearFailedToSync)
                .then(publishToDhis)
                .then(onSuccess, onError)
                .finally(scrollToTop);
        };

        $scope.getDisplayName = dataElementUtils.getDisplayName;

        var initializeForm = function() {
            currentPeriod = moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
            currentPeriodAndOrgUnit = {
                "period": currentPeriod,
                "orgUnit": $scope.selectedModule.id
            };
            $scope.startLoading();
            $scope.isOfflineApproval = false;
            $scope.moduleAndOpUnitName = $scope.selectedModule.parent.name + ' - ' + $scope.selectedModule.name;

            var loadAssociatedOrgUnitsAndPrograms = function() {
                return orgUnitRepository.findAllByParent([$scope.selectedModule.id]).then(function(originOrgUnits) {
                    $scope.moduleAndOriginOrgUnits = [$scope.selectedModule].concat(originOrgUnits);
                    $scope.originOrgUnits = originOrgUnits;
                    var orgUnitIdAssociatedToProgram = _.get(originOrgUnits[0], 'id') || $scope.selectedModule.id;
                    return programRepository.getProgramForOrgUnit(orgUnitIdAssociatedToProgram).then(function(program) {
                        $scope.program = program;
                        $scope.isLineListModule = !!program;
                    });
                });
            };

            var loadExcludedDataElements = function() {
                return excludedDataElementsRepository.get($scope.selectedModule.id).then(function(excludedDataElements) {
                    $scope.excludedDataElements = excludedDataElements ? _.pluck(excludedDataElements.dataElements, "id") : undefined;
                });
            };

            var loadRefferalLocations = function() {
                return referralLocationsRepository.get($scope.selectedModule.parent.id).then(function(data) {
                    if (!_.isUndefined(data)) {
                        data = _.omit(data, function(o) {
                            return o.isDisabled !== false;
                        });
                        noReferralLocationConfigured = _.keys(data).length === 0 ? true : false;
                        $scope.referralLocations = data;
                        return;
                    }
                    noReferralLocationConfigured = true;
                });
            };

            var findAllOrgUnits = function(orgUnits) {
                var orgUnitIds = _.pluck(orgUnits, "id");
                return orgUnitRepository.findAll(orgUnitIds);
            };

            if (_.isEmpty($scope.selectedModule))
                return;
            return $q.all([loadAssociatedOrgUnitsAndPrograms(), loadExcludedDataElements(), loadRefferalLocations()]).then(function() {

                var loadDataSetsPromise = datasetRepository.findAllForOrgUnits($scope.moduleAndOriginOrgUnits)
                    .then(_.curryRight(datasetRepository.includeDataElements)($scope.excludedDataElements))
                    .then(datasetRepository.includeColumnConfigurations)
                    .then(function(dataSets) {

                        var translateDataSets = function (datasets) {
                            var partitionDatasets = _.partition(datasets, {
                                "isReferralDataset": false
                            });

                            var translatedOtherDatasets = translationsService.translate(partitionDatasets[0]);
                            var translatedReferralDatasets = translationsService.translateReferralLocations(partitionDatasets[1]);
                            return translatedOtherDatasets.concat(translatedReferralDatasets);
                        };

                        var filterOutReferralLocations = function(dataSets) {
                            return _.reject(dataSets, 'isReferralDataset');
                        };

                        var setDatasets = function (translatedDatasets) {
                            $scope.dataSets = translatedDatasets;
                        };

                        var setTotalsDisplayPreferencesforDataSetSections = function () {
                            _.each($scope.dataSets, function (dataSet) {
                                _.each(dataSet.sections, function (dataSetSection) {
                                    dataSetSection.shouldDisplayRowTotals = dataSetSection.baseColumnConfiguration.length > 1;
                                    dataSetSection.shouldDisplayColumnTotals = (_.filter(dataSetSection.dataElements, {isIncluded: true}).length > 1 && !(dataSetSection.shouldHideTotals));
                                });
                            });
                        };
                        if (noReferralLocationConfigured) {
                            dataSets = filterOutReferralLocations(dataSets);
                        }
                        dataSets = translateDataSets(dataSets);
                        setDatasets(dataSets);
                        setTotalsDisplayPreferencesforDataSetSections();
                    });

                var loadModuleDataBlock = moduleDataBlockFactory.create($scope.selectedModule.id, currentPeriod).then(function(moduleDataBlock) {
                    $scope.moduleDataBlock = moduleDataBlock;
                    $scope.isApproved = moduleDataBlock.approvedAtCoordinationLevel;
                    $scope.isCompleted = moduleDataBlock.approvedAtProjectLevel;
                    $scope.syncError = moduleDataBlock.failedToSync;
                    $scope.dataValues = dataValuesMapper.mapToView(moduleDataBlock.dataValues);
                    $scope.isSubmitted = moduleDataBlock.submitted;
                });

                if ($scope.dataentryForm !== undefined)
                    $scope.dataentryForm.$setPristine();

                return $q.all([loadDataSetsPromise, loadModuleDataBlock]);

            }).finally($scope.stopLoading);
        };

        var init = function() {
            $scope.dataType = "all";
        };

        $scope.viewAllDataElements = function () {
            var scope = $rootScope.$new();

            scope.isOpen = {};
            scope.orgUnit = $scope.selectedModule;

            if($scope.isLineListModule) {
                $modal.open({
                    templateUrl: 'templates/view-all-linelist-data-elements.html',
                    controller: 'lineListModuleController',
                    scope: scope,
                    windowClass: 'modal-lg'
                });
            } else {
                $modal.open({
                    templateUrl: 'templates/view-all-aggregate-data-elements.html',
                    controller: 'aggregateModuleController',
                    scope: scope,
                    windowClass: 'modal-lg'
                });
            }
        };

        var deregisterErrorInfoListener = $scope.$on('errorInfo', function(event, errorMessage) {
            $scope.approveError = true;
        });

        var deregisterModuleWeekInfoListener = $scope.$on('moduleWeekInfo', function(event, data) {
            $scope.selectedModule = data[0];
            $scope.week = data[1];
            $scope.approveError = false;
            resetForm();
            initializeForm();
        });

        $scope.$on('$destroy', function() {
            deregisterErrorInfoListener();
            deregisterModuleWeekInfoListener();
        });

        resetForm();
        init();
    };
});
