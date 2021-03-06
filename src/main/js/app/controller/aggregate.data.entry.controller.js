define(["lodash", "dataValuesMapper", "orgUnitMapper", "moment", "properties", "interpolate", "customAttributes", "dataElementUtils", "excelBuilder", "excelBuilderHelper", "excelStyles"], function(_, dataValuesMapper, orgUnitMapper, moment, properties, interpolate, customAttributes, dataElementUtils, excelBuilder, excelBuilderHelper, excelStyles) {
    return function($scope, $routeParams, $q, $hustle, $anchorScroll, $location, $modal, $rootScope, $window, $timeout,
        dataRepository, excludedDataElementsRepository, approvalDataRepository, orgUnitRepository, datasetRepository, programRepository, referralLocationsRepository,
                    translationsService, moduleDataBlockFactory, dataSyncFailureRepository, optionSetRepository, filesystemService) {

        var currentPeriod, currentPeriodAndOrgUnit;
        var noReferralLocationConfigured = false;
        $scope.rowTotal = {};

        var resetForm = function() {
            $scope.isopen = {};
            $scope.isDatasetOpen = {};
            $scope.isSubmitted = false;
            $scope.saveSuccess = false;
            $scope.submitSuccess = false;
            $scope.submitAndApprovalSuccess = false;
            $scope.saveError = false;
            $scope.submitError = false;
            $scope.syncError = false;
            $scope.projectIsAutoApproved = false;
            $scope.excludedDataElements = {};
            $scope.rowTotal = {};
            $scope.hasDataValues = false;
        };

        $scope.contactSupport = interpolate($scope.resourceBundle.contactSupport, { supportEmail:properties.support_email });

        $scope.printWindow = function() {
            $scope.startLoading();

            //wait for AngularJS digest cycle to paint loding screen
            $timeout(function() {
                $scope.stopLoading();
                $scope.printingTallySheet = true;

                //wait for AngularJS digest cycle to setup template for printing
                $timeout(function() {
                    $window.print();
                }, 0);
            }, 0);
        };

        var buildSpreadSheetContent = function () {
            var EMPTY_CELL = '';
            var spreadSheet = excelBuilderHelper.createSheet($scope.selectedModule.name);

            var getPeriodInformation = function () {
                var row = [$scope.resourceBundle.yearLabel, EMPTY_CELL, $scope.resourceBundle.monthLabel, EMPTY_CELL, $scope.resourceBundle.weekLabel, EMPTY_CELL];
                spreadSheet.createRow(row);
                spreadSheet.createRow();
                spreadSheet.createRow();
            };

            var getModuleName = function () {
                var style = excelStyles.generateStyle(excelStyles.BOLD);
                spreadSheet.createRow().addCell($scope.selectedModule.name, {style: style});
                spreadSheet.createRow();
            };

            var buildDataElements = function (section, numberOfExtraCells) {
                var style = excelStyles.generateStyle(excelStyles.LEFT_ALIGNMENT);
                _.forEach(section.dataElements, function (dataElement) {
                    var dataElementName = dataElementUtils.getDisplayName(dataElement);
                    var row = spreadSheet.createRow();
                        row.addCell(dataElementName, {style: style});
                        row.addEmptyCells(numberOfExtraCells);
                });
            };

            var buildHeaders = function (section) {
                var style = excelStyles.generateStyle(excelStyles.BOLD);
                _.forEach(section.columnConfigurations, function (categoryOptions, index) {
                    var colspan = (section.baseColumnConfiguration.length / categoryOptions.length) || 1;
                    var row = spreadSheet.createRow();
                    var initialElement = index === 0 ? section.name : EMPTY_CELL;
                    row.addCell(initialElement, {style: style});
                    _.forEach(categoryOptions, function (categoryOption) {
                        row.addCell(categoryOption.name, {colspan: colspan, style: style});
                    });
                });
            };

            var buildReferralLocations = function (section, numberOfExtraCells) {
                var style = excelStyles.generateStyle(excelStyles.LEFT_ALIGNMENT);
                var referralLocations = _.filter(section.dataElements, function (dataElement) {
                    return !!$scope.referralLocations[dataElement.formName];
                });

                _.forEach(referralLocations, function (dataElement) {
                    var row = spreadSheet.createRow();
                    var referralLocation = $scope.referralLocations[dataElement.formName];
                    row.addCell(referralLocation.name, {style: style});
                    row.addEmptyCells(numberOfExtraCells);
                });
            };

            var buildOrigins = function (section, numberOfExtraCells) {
                var style = excelStyles.generateStyle(excelStyles.LEFT_ALIGNMENT);
                var sortedOrigins = _.sortBy($scope.originOrgUnits, 'name');
                return _.forEach(sortedOrigins, function (originOrgUnit) {
                    var row = spreadSheet.createRow();
                    row.addCell(originOrgUnit.name, {style: style});
                    row.addEmptyCells(numberOfExtraCells);
                });
            };

            var buildSections = function (dataSet, buildSectionContent) {
                _.forEach(dataSet.sections, function (section) {
                    var colspan = (section.baseColumnConfiguration && section.baseColumnConfiguration.length) || 1;
                    buildHeaders(section);
                    buildSectionContent(section, colspan);
                    spreadSheet.createRow();
                });
            };

            var buildDataSet = function (dataSet) {
                var width = _.max(_.map(dataSet.sections, 'baseColumnConfiguration.length')) || 1;
                var style = excelStyles.generateStyle(excelStyles.BOLD);
                var buildSectionContent = buildDataElements;
                if (dataSet.isOriginDataset) {
                    buildSectionContent = buildOrigins;
                }
                if (dataSet.isReferralDataset) {
                    buildSectionContent = buildReferralLocations;
                }
                spreadSheet.createRow().addCell(dataSet.name, {colspan: width + 1, style: style});
                spreadSheet.createRow();
                buildSections(dataSet, buildSectionContent);
                spreadSheet.createRow();
            };

            getPeriodInformation();
            getModuleName();
            var nonPopulationDataSets = _.reject($scope.dataSets, 'isPopulationDataset');
            var originDataSetsAndRemainingDatasets = _.partition(nonPopulationDataSets, 'isOriginDataset');
            var referralDataSetAndRemainingDatasets = _.partition(originDataSetsAndRemainingDatasets[1], 'isReferralDataset');
            _.forEach(referralDataSetAndRemainingDatasets[1], buildDataSet);
            _.forEach(referralDataSetAndRemainingDatasets[0], buildDataSet);
            _.forEach(originDataSetsAndRemainingDatasets[0], buildDataSet);
            return [spreadSheet.generate()];
        };

        $scope.exportTallySheetToExcel = function () {
            var filename = [$scope.selectedModule.name, 'export'].join('.');
            return filesystemService.promptAndWriteFile(filename, excelBuilder.createWorkBook(buildSpreadSheetContent()), filesystemService.FILE_TYPE_OPTIONS.XLSX);
        };

        var confirmAndProceed = function(okCallback, message, doNotConfirm) {
            if (doNotConfirm)
                return $q.when(okCallback());

            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            return modalInstance.result
                .then(function() {
                    $scope.cancelSubmit = false;
                    return okCallback();
                }, function() {
                    $scope.cancelSubmit = true;
                });
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var calculateSum = function(cellValue, existingValue) {
            if (!cellValue)
                return existingValue ? 0 : "";

            cellValue = cellValue.toString().split("+").filter(function(e) {
                return e;
            });
            return _.reduce(cellValue, function(sum, exp) {
                return sum + parseInt(exp);
            }, 0);
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

        $scope.validDataValuePattern = /^[0-9+]*$/;

        $scope.evaluateExpression = function(orgUnit, elementId, option) {
            var cell = $scope.dataValues[orgUnit][elementId][option];
            if (!$scope.validDataValuePattern.test(cell.value))
                return;
            cell.formula = cell.value;
            cell.value = calculateSum(cell.value, cell.existingValue).toString();
        };

        $scope.restoreExpression = function(orgUnit, elementId, option) {
            var cell = $scope.dataValues[orgUnit][elementId][option];
            if (!$scope.validDataValuePattern.test(cell.value))
                return;
            cell.value = cell.formula || cell.value;
        };

        $scope.getDatasetState = function(id, isFirst) {
            if (isFirst && !(id in $scope.isDatasetOpen)) {
                $scope.isDatasetOpen[id] = true;
            }
            return $scope.isDatasetOpen;
        };

        $scope.sum = function(iterable, dataElementId, catOptComboIdsForTotalling) {
            var sum = _.reduce(iterable, function(sum, currentOption, catOptComboId) {
                if (_.contains(catOptComboIdsForTotalling, catOptComboId)) {
                    exp = currentOption.value || "0";
                    return sum + calculateSum(exp);
                } else {
                    return sum;
                }
            }, 0);
            $scope.rowTotal[dataElementId] = sum;
            return sum;
        };

        var getReferralDataElementIds = function(dataElements) {
            var dataElementsForReferral = _.filter(dataElements, function(de) {
                return $scope.referralLocations[de.formName] !== undefined;
            });

            return _.pluck(dataElementsForReferral, "id");
        };

        $scope.columnSum = function(iterable, section, option, isReferralDataset) {
            var filteredDataElements = _.filter(section.dataElements, {"isIncluded": true});
            var dataElementsIds = isReferralDataset ? getReferralDataElementIds(filteredDataElements) : _.pluck(filteredDataElements, "id");
            return _.reduce(iterable, function(sum, value, key) {
                if (_.includes(dataElementsIds, key)) {
                    exp = value[option].value || "0";
                    return sum + calculateSum(exp);
                } else {
                    return sum;
                }
            }, 0);
        };

        $scope.totalSum = function(section) {
            var dataElementsIds = _.pluck(section.dataElements, "id");
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

        $scope.getDisplayName = dataElementUtils.getDisplayName;

        var save = function(options) {
            var updateDataValuesWithPopulationData = function() {
                var currentModuleId = $scope.selectedModule.id;
                var populationDataset = _.find($scope.dataSets, {
                    "isPopulationDataset": true
                });
                if (populationDataset) {
                    var categoryOptionComboId = populationDataset.sections[0].baseColumnConfiguration[0].categoryOptionComboId;
                    _.forEach(populationDataset.sections[0].dataElements, function(dataElement) {
                        $scope.dataValues[currentModuleId][dataElement.id] = !$scope.dataValues[currentModuleId][dataElement.id] ? {} : $scope.dataValues[currentModuleId][dataElement.id];

                        var code = dataElement.populationDataElementCode;
                        var value = _.isEmpty(_.get($scope.projectPopulationDetails, code)) ? "0" : $scope.projectPopulationDetails[code];
                        $scope.dataValues[currentModuleId][dataElement.id][categoryOptionComboId] = {
                            "formula": value,
                            "value": value
                        };
                    });
                }
            };

            updateDataValuesWithPopulationData();
            var payload = dataValuesMapper.mapToDomain($scope.dataValues, currentPeriod, $scope.currentUser.userCredentials.username);

            var publishToDhis = function() {
                return $hustle.publishOnce({
                    data: {
                        moduleId: $scope.selectedModule.id,
                        period: currentPeriod
                    },
                    type: "syncModuleDataBlock",
                    locale: $scope.locale,
                    desc: interpolate($scope.resourceBundle.syncModuleDataBlockDesc, {
                        period: currentPeriod + ", " + $scope.selectedModule.name
                    })
                }, "dataValues");
            };

            var clearFailedToSync = function () {
                return dataSyncFailureRepository.delete($scope.selectedModule.id, currentPeriod);
            };

            if(options.saveAsDraft) {
                return dataRepository.saveAsDraft(payload);
            } else if(options.autoApprove) {
                var completedAndApprovedBy = $scope.currentUser.userCredentials.username;

                return dataRepository.save(payload)
                    .then(_.partial(approvalDataRepository.markAsApproved, currentPeriodAndOrgUnit, completedAndApprovedBy))
                    .then(clearFailedToSync)
                    .then(publishToDhis);
            } else {
                return dataRepository.save(payload)
                    .then(_.partial(approvalDataRepository.clearApprovals, currentPeriodAndOrgUnit))
                    .then(clearFailedToSync)
                    .then(publishToDhis);
            }
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

            save({ saveAsDraft: true }).then(successPromise, errorPromise);
        };

        $scope.submit = function() {
            var successPromise = function() {
                $scope.saveSuccess = false;
                $scope.submitSuccess = true;
                if (!$scope.cancelSubmit)
                    initializeForm();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = false;
                $scope.submitError = true;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.reapprovalConfirmationMessage
            };

            confirmAndProceed(_.partial(save, false), modalMessages, !$scope.moduleDataBlock.approvedAtProjectLevel && !$scope.moduleDataBlock.approvedAtCoordinationLevel)
                .then(successPromise, errorPromise);
        };

        $scope.submitAndApprove = function() {
            var successPromise = function() {
                $scope.saveSuccess = false;
                $scope.submitAndApprovalSuccess = true;
                if (!$scope.cancelSubmit)
                    initializeForm();
                scrollToTop();
            };

            var errorPromise = function() {
                $scope.saveError = false;
                $scope.submitError = true;
                $scope.isSubmitted = false;
                scrollToTop();
            };

            var modalMessage = {
                "confirmationMessage": $scope.resourceBundle.reapprovalConfirmationMessage
            };

            confirmAndProceed(_.partial(save, { autoApprove: true }), modalMessage, !($scope.isCompleted || $scope.isApproved))
                .then(successPromise, errorPromise);
        };

        $scope.isCurrentWeekSelected = function(week) {
            var today = moment().format("YYYY-MM-DD");
            if (week && today >= week.startOfWeek && today <= week.endOfWeek)
                return true;
            return false;
        };

        $scope.viewAllDataElements = function () {
            var scope = $rootScope.$new();

            scope.orgUnit = $scope.selectedModule;
            scope.isOpen = {};

            $modal.open({
                templateUrl: 'templates/view-all-aggregate-data-elements.html',
                controller: 'aggregateModuleController',
                scope: scope,
                windowClass: 'modal-lg'
            });
        };

        var deregisterDirtyFormWatcher = $scope.$watch('forms.dataentryForm.$dirty', function(dirty) {
            if (dirty) {
                $scope.preventNavigation = true;
            } else {
                $scope.preventNavigation = false;
            }
        });

        var deregisterErrorInfoListener = $scope.$on('errorInfo', function(event, errorMessage) {
            $scope.errorMessage = errorMessage;
        });

        var initializeForm = function() {
            $scope.startLoading();
            $scope.moduleAndOpUnitName = $scope.selectedModule.parent.name + ' - ' + $scope.selectedModule.name;
            currentPeriod = moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
            $scope.isDataEntryAllowed = moment($scope.week.startOfWeek).isAfter(moment().subtract(properties.projectDataSync.numWeeksToSync, 'week'));
            currentPeriodAndOrgUnit = {
                "period": currentPeriod,
                "orgUnit": $scope.selectedModule.id
            };

            var loadAssociatedOrgUnitsAndPrograms = function() {
                return orgUnitRepository.findAllByParent([$scope.selectedModule.id]).then(function(originOrgUnits) {
                    $scope.moduleAndOriginOrgUnits = [$scope.selectedModule].concat(originOrgUnits);
                    $scope.originOrgUnits = originOrgUnits;
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
                        noReferralLocationConfigured = _.keys(data).length === 0;
                        $scope.referralLocations = data;
                        return;
                    }
                    noReferralLocationConfigured = true;
                });
            };

            var extractPopulationDetails = function(orgUnitAttrs, populationDataCodes) {
                var populationDetails = {};
                _.forEach(orgUnitAttrs, function(attr) {
                    if (_.includes(populationDataCodes, attr.attribute.code)) {
                        populationDetails[attr.attribute.code] = attr.value;
                    }
                });
                return populationDetails;
            };
            
            var loadPopulationOptionSet = function () {
                optionSetRepository.getOptionSetByCode(customAttributes.PRAXIS_POPULATION_DATA_ELEMENTS).then(function (populationOptionSet) {
                    $scope.populationDataCodes = _.map(populationOptionSet.options, 'code');
                });
            };

            return $q.all([loadAssociatedOrgUnitsAndPrograms(), loadExcludedDataElements(), loadRefferalLocations(), loadPopulationOptionSet()]).then(function() {
                var loadDataSetsPromise = datasetRepository.findAllForOrgUnits($scope.moduleAndOriginOrgUnits)
                    .then(_.curryRight(datasetRepository.includeDataElements)($scope.excludedDataElements))
                    .then(datasetRepository.includeColumnConfigurations)
                    .then(function(dataSets) {
                        var translateDatasets = function (dataSets) {
                            var partitionDatasets = _.partition(dataSets, {
                                "isReferralDataset": false
                            });

                            var translatedOtherDatasets = translationsService.translate(partitionDatasets[0]);
                            var translatedReferralDatasets = translationsService.translateReferralLocations(partitionDatasets[1]);
                            return translatedOtherDatasets.concat(translatedReferralDatasets);
                        };

                        var filterOutReferralLocations = function (dataSets) {
                            return _.filter(dataSets, { isReferralDataset: false });
                        };

                        var setTotalsDisplayPreferencesforDataSetSections = function (dataSets) {
                            _.each(dataSets, function (dataSet) {
                                _.each(dataSet.sections, function (dataSetSection) {
                                    dataSetSection.shouldDisplayRowTotals = dataSetSection.baseColumnConfiguration.length > 1;
                                    dataSetSection.shouldDisplayColumnTotals = (_.filter(dataSetSection.dataElements, {isIncluded: true}).length > 1 && !(dataSetSection.shouldHideTotals));
                                });
                            });
                            return dataSets;
                        };
                        
                        var filterOutNonIncludedSectionsAndDataElements = function (dataSets) {
                            _.forEach(dataSets, function (dataSet) {
                                dataSet.sections = _.filter(dataSet.sections, 'isIncluded');
                                _.forEach(dataSet.sections, function (section) {
                                    section.dataElements = _.filter(section.dataElements, 'isIncluded');
                                });
                            });
                            return dataSets;
                        };

                        var sortDataSetsByName = function (dataSets) {
                            return _.sortBy(dataSets, 'name');
                        };

                        if (noReferralLocationConfigured) {
                            dataSets = filterOutReferralLocations(dataSets);
                        }

                        var transformations = [filterOutNonIncludedSectionsAndDataElements, translateDatasets, setTotalsDisplayPreferencesforDataSetSections, sortDataSetsByName];
                        $scope.dataSets = transformations.reduce(function (dataSets, transformer) {
                            return transformer(dataSets);
                        }, dataSets);
                    });

                var loadProjectPromise = orgUnitRepository.getParentProject($scope.selectedModule.id).then(function(orgUnit) {
                    $scope.projectIsAutoApproved = customAttributes.getBooleanAttributeValue(orgUnit.attributeValues, customAttributes.AUTO_APPROVE);
                    $scope.projectPopulationDetails = extractPopulationDetails(orgUnit.attributeValues, $scope.populationDataCodes);
                });

                var loadModuleDataBlock = moduleDataBlockFactory.create($scope.selectedModule.id, currentPeriod)
                    .then(function(moduleDataBlock) {
                        $scope.moduleDataBlock = moduleDataBlock;
                        $scope.syncError = moduleDataBlock.failedToSync;
                        $scope.dataValues = dataValuesMapper.mapToView(moduleDataBlock.dataValues);
                        $scope.isSubmitted = moduleDataBlock.submitted;
                        $scope.isCompleted = moduleDataBlock.approvedAtProjectLevel;
                        $scope.isApproved = moduleDataBlock.approvedAtCoordinationLevel;
                        $scope.isDataAvailable = moduleDataBlock.submitted || moduleDataBlock.approvedAtAnyLevel;
                        $scope.checkForPristine = $scope.isSubmitted || (!$scope.isSubmitted && _.isEmpty(moduleDataBlock.dataValues));
                    });

                if ($scope.forms.dataentryForm !== undefined)
                    $scope.forms.dataentryForm.$setPristine();
                return $q.all([loadDataSetsPromise, loadModuleDataBlock, loadProjectPromise]);

            }).finally($scope.stopLoading);
        };

        var deregisterModuleWeekInfoListener = $scope.$on('moduleWeekInfo', function(event, data) {
            $scope.selectedModule = data[0];
            $scope.week = data[1];
            $scope.errorMessage = undefined;
            resetForm();
            initializeForm();
        });

        $scope.$on('$destroy', function() {
            deregisterErrorInfoListener();
            deregisterModuleWeekInfoListener();
            deregisterDirtyFormWatcher();
        });

        var init = function() {
            $scope.dataType = "aggregate";
        };

        $scope.forms = {};

        resetForm();
        init();
    };
});
