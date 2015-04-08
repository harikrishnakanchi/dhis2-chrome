define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment", "datasetTransformer", "properties"], function(_, dataValuesMapper, groupSections, orgUnitMapper, moment, datasetTransformer, properties) {
    return function($scope, $routeParams, $q, $hustle, db, dataRepository, systemSettingRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalDataRepository,
        $timeout, orgUnitRepository, datasetRepository) {

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var getPeriod = function() {
            return moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
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

        $scope.getDatasetState = function(id, isFirst) {
            if (isFirst && !(id in $scope.isDatasetOpen)) {
                $scope.isDatasetOpen[id] = true;
            }
            return $scope.isDatasetOpen;
        };

        $scope.maxcolumns = function(headers) {
            return _.last(headers).length;
        };

        $scope.getDataSetName = function(id) {
            return _.find($scope.dataSets, function(dataSet) {
                return id === dataSet.id;
            }).name;
        };

        $scope.shouldDataBeEnteredForOrgUnit = function(orgUnitId) {
            return _.contains($scope.currentOrgUnitIdIncludingChildrenIds, orgUnitId);
        };

        $scope.getValue = function(dataValues, dataElementId, option, orgUnits) {
            if (dataValues === undefined)
                return;

            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];

            var result = 0;

            var orgUnitIds = _.pluck(orgUnits, "id");
            _.forEach(orgUnitIds, function(orgUnitId) {
                dataValues[orgUnitId] = dataValues[orgUnitId] || {};
                dataValues[orgUnitId][dataElementId] = dataValues[orgUnitId][dataElementId] || {};
                dataValues[orgUnitId][dataElementId][option] = dataValues[orgUnitId][dataElementId][option] || {};

                if (!_.isEmpty(dataValues[orgUnitId][dataElementId][option].value))
                    result += parseInt(dataValues[orgUnitId][dataElementId][option].value);
            });

            return result;
        };

        $scope.sum = function(dataValues, orgUnits, dataElementId) {
            orgUnits = _.isArray(orgUnits) ? orgUnits : [orgUnits];

            var allValues = [];
            _.forEach(orgUnits, function(orgUnit) {
                dataValues[orgUnit.id] = dataValues[orgUnit.id] || {};
                dataValues[orgUnit.id][dataElementId] = dataValues[orgUnit.id][dataElementId] || {};

                var allOptions = _.keys(dataValues[orgUnit.id][dataElementId]);
                _.forEach(allOptions, function(option) {
                    dataValues[orgUnit.id][dataElementId][option] = dataValues[orgUnit.id][dataElementId][option] || {};
                    allValues.push(dataValues[orgUnit.id][dataElementId][option].value);
                });
            });
            return _.sum(allValues);
        };

        $scope.printWindow = function() {
            $scope.printingTallySheet = true;
            $timeout(function() {
                $window.print();
            }, 0);
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

        var init = function() {

            var getAll = function(storeName) {
                var store = db.objectStore(storeName);
                return store.getAll();
            };

            var setData = function(data) {
                $scope.geographicOrigin = data[8];
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

            var dataSetPromise = getAll('dataSets');
            var sectionPromise = getAll("sections");
            var dataElementsPromise = getAll("dataElements");
            var comboPromise = getAll("categoryCombos");
            var categoriesPromise = getAll("categories");
            var categoryOptionCombosPromise = getAll("categoryOptionCombos");
            var geographicOriginDatasetPromise = datasetRepository.getOriginDatasets();
            var excludedDataElementPromise = systemSettingRepository.get($scope.currentModule.id);
            var getChildrenPromise = orgUnitRepository.findAllByParent([$scope.currentModule.id]);

            var getAllData = $q.all([dataSetPromise, sectionPromise, dataElementsPromise, comboPromise, categoriesPromise, categoryOptionCombosPromise, excludedDataElementPromise, getChildrenPromise, geographicOriginDatasetPromise]);

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

                var setCurrentGroupedSections = function() {
                    var datasetsAssociatedWithModule = _.pluck(datasetTransformer.getAssociatedDatasets($scope.currentModule.id, $scope.dataSets), 'id');

                    var allDatasetsAssociatedWithOrigins = _.uniq(_.flatten(_.map($scope.moduleChildren, function(origin) {
                        return _.pluck(datasetTransformer.getAssociatedDatasets(origin, $scope.dataSets), 'id');
                    })));

                    var allRelevantDatasetIds = _.uniq(allDatasetsAssociatedWithOrigins.concat(datasetsAssociatedWithModule));

                    $scope.currentGroupedSections = _.pick($scope.groupedSections, _.without(allRelevantDatasetIds, $scope.geographicOrigin[0].id));
                    var selectedDatasets = _.keys($scope.currentGroupedSections);
                    _.each(selectedDatasets, function(selectedDataset) {
                        $scope.currentGroupedSections[selectedDataset] = groupSections.filterDataElements($scope.currentGroupedSections[selectedDataset], $scope.excludedDataElements);
                    });

                    $scope.currentGroupedSectionsForOrigins = _.pick($scope.groupedSections, $scope.geographicOrigin[0].id);
                };

                setCurrentGroupedSections();

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
