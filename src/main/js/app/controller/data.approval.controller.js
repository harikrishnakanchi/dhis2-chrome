define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment", "datasetTransformer", "properties"], function(_, dataValuesMapper, groupSections, orgUnitMapper, moment, datasetTransformer, properties) {
    return function($scope, $routeParams, $q, $hustle, db, dataRepository, systemSettingRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalDataRepository,
        $timeout, orgUnitRepository) {

        $scope.printWindow = function() {
            $scope.printingTallySheet = true;
            $timeout(function() {
                $window.print();
            }, 0);
        };

        $scope.getDatasetState = function(id, isFirst) {
            if (isFirst && !(id in $scope.isDatasetOpen)) {
                $scope.isDatasetOpen[id] = true;
            }
            return $scope.isDatasetOpen;
        };

        var resetForm = function() {
            $scope.isopen = {};
            $scope.isDatasetOpen = {};
            $scope.isSubmitted = false;
            $scope.firstLevelApproveSuccess = false;
            $scope.secondLevelApproveSuccess = false;
            $scope.approveError = false;
            $scope.excludedDataElements = {};
        };

        $scope.sum = function(iterable) {
            return _.reduce(iterable, function(sum, currentOption) {
                exp = currentOption.value || "0";
                return sum + calculateSum(exp);
            }, 0);
        };

        $scope.maxcolumns = function(headers) {
            return _.last(headers).length;
        };

        $scope.firstLevelApproval = function() {

            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id
            };

            var completedBy = $scope.currentUser.userCredentials.username;

            var publishToDhis = function() {
                return $hustle.publish({
                    "data": [periodAndOrgUnit],
                    "type": "uploadCompletionData"
                }, "dataValues");
            };

            var onSuccess = function() {
                $scope.firstLevelApproveSuccess = true;
                $scope.approveError = false;
                init();
            };

            var onError = function() {
                $scope.firstLevelApproveSuccess = false;
                $scope.approveError = true;
            };

            approvalDataRepository.markAsComplete(periodAndOrgUnit, completedBy)
                .then(publishToDhis)
                .then(onSuccess, onError)
                .finally(scrollToTop);
        };

        $scope.secondLevelApproval = function() {
            var onSuccess = function() {
                $scope.secondLevelApproveSuccess = true;
                $scope.approveError = false;
                init();
            };

            var onError = function() {
                $scope.secondLevelApproveSuccess = false;
                $scope.approveError = true;
            };

            var periodAndOrgUnit = {
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id
            };

            var publishToDhis = function() {
                return $hustle.publish({
                    "data": [periodAndOrgUnit],
                    "type": "uploadApprovalData",
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.uploadApprovalDataDesc + periodAndOrgUnit.period
                }, "dataValues");
            };

            var approvedBy = $scope.currentUser.userCredentials.username;

            approvalDataRepository.markAsApproved(periodAndOrgUnit, approvedBy)
                .then(publishToDhis)
                .then(onSuccess, onError)
                .finally(scrollToTop);
        };

        $scope.isCurrentWeekSelected = function(week) {
            var today = moment().format("YYYY-MM-DD");
            if (week && today >= week.startOfWeek && today <= week.endOfWeek)
                return true;
            return false;
        };

        $scope.$watch('dataentryForm.$dirty', function(dirty) {
            if (dirty) {
                $scope.preventNavigation = true;
            } else {
                $scope.preventNavigation = false;
            }
        });

        $scope.getDataSetName = function(id) {
            return _.find($scope.dataSets, function(dataSet) {
                return id === dataSet.id;
            }).name;
        };

        $scope.shouldDataBeEnteredForOrgUnit = function(orgUnitId) {
            return _.contains($scope.currentOrgUnitIdIncludingChildrenIds, orgUnitId);
        };

        $scope.safeGet = function(dataValues, id, option, orgUnitId) {
            if (dataValues === undefined)
                return;

            dataValues[orgUnitId] = dataValues[orgUnitId] || {};
            dataValues[orgUnitId][id] = dataValues[orgUnitId][id] || {};

            dataValues[orgUnitId][id][option] = dataValues[orgUnitId][id][option] || {
                'formula': '',
                'value': ''
            };
            return dataValues[orgUnitId][id][option];
        };

        $scope.isDataEntryAllowed = function() {
            return moment($scope.week.startOfWeek).isAfter(moment().subtract(properties.projectDataSync.numWeeksToSync, 'week'));
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var calculateSum = function(cellValue) {
            if (!cellValue)
                return 0;

            cellValue = cellValue.toString().split("+").filter(function(e) {
                return e;
            });
            return _.reduce(cellValue, function(sum, exp) {
                return sum + parseInt(exp);
            }, 0);
        };

        var getPeriod = function() {
            return moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var setData = function(data) {
            $scope.dataSets = data[0];
            $scope.moduleChildren = _.pluck(data[7], "id");
            $scope.currentOrgUnitIdIncludingChildrenIds = _.flatten([$scope.currentModule.id, $scope.moduleChildren]);
            $scope.excludedDataElements = data[6] && data[6].value ? data[6].value.dataElements : undefined;
            return data;
        };

        var transformDataSet = function(data) {
            $scope.groupedSections = groupSections.enrichGroupedSections(data);
            return data;
        };

        var init = function() {
            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");
            var comboPromise = getAll("categoryCombos");
            var categoriesPromise = getAll("categories");
            var categoryOptionCombosPromise = getAll("categoryOptionCombos");
            var excludedDataElementPromise = systemSettingRepository.get($scope.currentModule.id);
            var getChildrenPromise = orgUnitRepository.findAllByParent([$scope.currentModule.id]);

            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, comboPromise, categoriesPromise, categoryOptionCombosPromise, excludedDataElementPromise, getChildrenPromise]);

            $scope.loading = true;
            getAllData.then(setData).then(transformDataSet).then(function() {
                var periodAndOrgUnit = {
                    "period": getPeriod(),
                    "orgUnit": $scope.currentModule.id
                };

                approvalDataRepository.getApprovalData(periodAndOrgUnit).then(function(data) {
                    $scope.isCompleted = !_.isEmpty(data) && data.isComplete;
                    $scope.isApproved = !_.isEmpty(data) && data.isApproved;
                });

                dataRepository.getDataValues(getPeriod(), $scope.currentOrgUnitIdIncludingChildrenIds).then(function(dataValues) {
                    dataValues = dataValues || [];
                    var isDraft = !_.some(dataValues, {
                        "isDraft": true
                    });
                    $scope.dataValues = dataValuesMapper.mapToView(dataValues);
                    $scope.isSubmitted = (!_.isEmpty(dataValues) && isDraft);
                });

                var setCurrentGroupedSectionsForCurrentModule = function() {
                    var datasetsAssociatedWithModule = _.pluck(datasetTransformer.getAssociatedDatasets($scope.currentModule.id, $scope.dataSets), 'id');

                    $scope.currentGroupedSections = _.pick($scope.groupedSections, datasetsAssociatedWithModule);
                    var selectedDatasets = _.keys($scope.currentGroupedSections);
                    _.each(selectedDatasets, function(selectedDataset) {
                        $scope.currentGroupedSections[selectedDataset] = groupSections.filterDataElements($scope.currentGroupedSections[selectedDataset], $scope.excludedDataElements);
                    });
                };

                var setCurrentGroupedSectionsForOrigins = function() {
                    var datasetsAssociatedWithOrigins = _.uniq(_.flatten(_.map($scope.moduleChildren, function(origin) {
                        return _.pluck(datasetTransformer.getAssociatedDatasets(origin, $scope.dataSets), 'id');
                    })));

                    $scope.currentGroupedSectionsForOrigins = _.pick($scope.groupedSections, datasetsAssociatedWithOrigins);
                };


                setCurrentGroupedSectionsForCurrentModule();
                setCurrentGroupedSectionsForOrigins();

                if ($scope.dataentryForm !== undefined)
                    $scope.dataentryForm.$setPristine();

            }).finally(function() {
                $scope.loading = false;
            });
        };

        resetForm();
        init();
    };
});
