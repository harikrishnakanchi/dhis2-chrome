define(["lodash", "dataValuesMapper", "groupSections", "orgUnitMapper", "moment", "datasetTransformer", "properties"], function(_, dataValuesMapper, groupSections, orgUnitMapper, moment, datasetTransformer, properties) {
    return function($scope, $routeParams, $q, $hustle, db, dataRepository, systemSettingRepository, $anchorScroll, $location, $modal, $rootScope, $window, approvalDataRepository,
        $timeout, orgUnitRepository, approvalHelper) {

        $scope.validDataValuePattern = /^[0-9+]*$/;

        $scope.evaluateExpression = function(orgUnit, elementId, option) {
            if (!$scope.validDataValuePattern.test($scope.dataValues[orgUnit][elementId][option].value))
                return;
            var cellValue = $scope.dataValues[orgUnit][elementId][option].value;
            $scope.dataValues[orgUnit][elementId][option].formula = cellValue;
            $scope.dataValues[orgUnit][elementId][option].value = calculateSum(cellValue).toString();
        };

        $scope.printWindow = function() {
            $scope.printingTallySheet = true;
            $timeout(function() {
                $window.print();
            }, 0);
        };

        $scope.restoreExpression = function(orgUnit, elementId, option) {
            if (!$scope.validDataValuePattern.test($scope.dataValues[orgUnit][elementId][option].value))
                return;
            $scope.dataValues[orgUnit][elementId][option].value = $scope.dataValues[orgUnit][elementId][option].formula;
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
            $scope.saveSuccess = false;
            $scope.submitSuccess = false;
            $scope.submitAndApprovalSuccess = false;
            $scope.firstLevelApproveSuccess = false;
            $scope.secondLevelApproveSuccess = false;
            $scope.saveError = false;
            $scope.submitError = false;
            $scope.approveError = false;
            $scope.projectIsAutoApproved = false;
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

        $scope.saveAsDraft = function() {
            var successPromise = function() {
                $scope.saveSuccess = true;
                $scope.submitSuccess = false;
                init();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = true;
                $scope.submitError = false;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            save(true).then(successPromise, errorPromise);
        };

        $scope.submit = function() {
            var successPromise = function() {
                $scope.saveSuccess = false;
                $scope.submitSuccess = true;
                init();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = false;
                $scope.submitError = true;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            confirmAndProceed(_.partial(save, false), $scope.resourceBundle.reapprovalConfirmationMessage, !($scope.isCompleted || $scope.isApproved))
                .then(successPromise, errorPromise);
        };

        var getPayloadForFirstLevelApproval = function() {
            return {
                "dataSets": _.keys($scope.currentGroupedSections),
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id,
                "storedBy": $scope.currentUser.userCredentials.username
            };
        };

        var getPayloadForSecondOrThirdLevelApproval = function() {
            var datasets = _.keys($scope.currentGroupedSections);
            if (!_.isEmpty($scope.currentGroupedSectionsForOrigins))
                datasets = datasets.concat(_.keys($scope.currentGroupedSectionsForOrigins));

            return {
                "dataSets": datasets,
                "period": getPeriod(),
                "orgUnit": $scope.currentModule.id,
                "storedBy": $scope.currentUser.userCredentials.username
            };
        };

        $scope.submitAndApprove = function() {
            var successPromise = function() {
                $scope.saveSuccess = false;
                $scope.submitAndApprovalSuccess = true;
                init();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = false;
                $scope.submitError = true;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            var upsertAndPushToDhis = function() {
                save(false)
                    .then(_.partial(approvalHelper.markDataAsComplete, getPayloadForFirstLevelApproval()))
                    .then(_.partial(approvalHelper.markDataAsAccepted, getPayloadForSecondOrThirdLevelApproval()));
            };

            confirmAndProceed(upsertAndPushToDhis, $scope.resourceBundle.reapprovalConfirmationMessage, !($scope.isCompleted || $scope.isApproved))
                .then(successPromise, errorPromise);
        };

        $scope.firstLevelApproval = function() {
            var onSuccess = function() {
                $scope.firstLevelApproveSuccess = true;
                $scope.approveError = false;
                init();
            };

            var onError = function() {
                $scope.firstLevelApproveSuccess = false;
                $scope.approveError = true;
            };

            confirmAndProceed(_.partial(approvalHelper.markDataAsComplete, getPayloadForFirstLevelApproval()), $scope.resourceBundle.dataApprovalConfirmationMessage)
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

            confirmAndProceed(_.partial(approvalHelper.markDataAsApproved, getPayloadForSecondOrThirdLevelApproval()), $scope.resourceBundle.dataApprovalConfirmationMessage, false)
                .then(onSuccess, onError)
                .finally(scrollToTop);

        };

        var showModal = function(okCallback, message) {
            $scope.modalMessage = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        var confirmAndProceed = function(okCallback, message, doNotConfirm) {
            if (doNotConfirm) {
                return $q.when(okCallback());
            } else {
                $scope.modalMessage = message;
                var modalInstance = $modal.open({
                    templateUrl: 'templates/confirm.dialog.html',
                    controller: 'confirmDialogController',
                    scope: $scope
                });

                return modalInstance.result.then(okCallback);
            }
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

        var save = function(asDraft) {
            var period = getPeriod();

            var saveToDhis = function(data) {
                return $hustle.publish({
                    "data": data,
                    "type": "uploadDataValues"
                }, "dataValues");
            };

            var unapproveData = function(data) {
                return approvalHelper.unapproveData($scope.currentModule.id, _.keys($scope.currentGroupedSections), getPeriod()).then(function() {
                    return data;
                });
            };

            var payload = dataValuesMapper.mapToDomain($scope.dataValues, period, $scope.currentUser.userCredentials.username);
            if (asDraft) {
                return dataRepository.saveAsDraft(payload);
            } else {
                return dataRepository.save(payload)
                    .then(unapproveData)
                    .then(saveToDhis);
            }
        };

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

                orgUnitRepository.getParentProject($scope.currentModule.id).then(function(orgUnit) {
                    var project = orgUnitMapper.mapToProject(orgUnit);
                    $scope.projectIsAutoApproved = (project.autoApprove === "true");
                });

                approvalDataRepository.getLevelOneApprovalData(getPeriod(), $scope.currentModule.id, true).then(function(data) {
                    $scope.isCompleted = !_.isEmpty(data);
                });

                approvalDataRepository.getLevelTwoApprovalData(getPeriod(), $scope.currentModule.id, true).then(function(data) {
                    $scope.isApproved = !_.isEmpty(data) && data.isApproved;
                    $scope.isAccepted = !_.isEmpty(data) && data.isAccepted;
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
