define(["lodash", "orgUnitMapper", "moment","interpolate", "systemSettingsTransformer", "dataElementUtils", "customAttributes"],
    function(_, orgUnitMapper, moment, interpolate, systemSettingsTransformer, dataElementUtils, customAttributes) {
        return function($scope, $rootScope, $hustle, orgUnitRepository, datasetRepository, systemSettingRepository, excludedDataElementsRepository, db, $location, $q, $modal, $modalStack,
            orgUnitGroupHelper, originOrgunitCreator, translationsService) {

            $scope.originalDatasets = [];
            $scope.isExpanded = {};
            $scope.isSubSectionExpanded = {};
            $scope.isDisabled = false;
            $scope.module = {};
            $scope.otherModules = [];
            $scope.selectedDataset = {};
            $scope.selectedTemplate = {};

            $scope.nonAssociatedDataSets = [];
            $scope.associatedDatasets = [];
            $scope.selectedDataset = {};
            $scope.enrichedDatasets = {};
            var excludedDataElements = [];
            var referralDataset, populationDataset, existingAssociatedDatasetIds;

            var enrichSection = function(section) {
                var unGroupedElements = _(section.dataElements)
                    .filter({
                        'subSection': 'Default'
                    })
                    .value();

                var subSections = _(section.dataElements)
                    .reject({
                        'subSection': 'Default'
                    })
                    .groupBy('subSection')
                    .each(function(elements, subSectionName) {
                        if (!$scope.isSubSectionExpanded[section.id]) {
                            $scope.isSubSectionExpanded[section.id] = {};
                        }
                        $scope.isSubSectionExpanded[section.id][subSectionName] = true;
                    }).transform(function(accumulator, value, key) {
                        accumulator.push({
                            "name": key,
                            "dataElements": value
                        });
                    }, [])
                    .value();
                section.subSections = subSections;
                section.unGroupedDataElements = unGroupedElements;
                return section;
            };

            var dataSetWithEnrichedSections = function(dataset) {
                _.each(dataset.sections, function(section) {
                    enrichSection(section);
                });
                return dataset;
            };

            var getEnrichedDataSets = function(datasets) {
                return datasetRepository.includeDataElements(datasets, excludedDataElements);
            };

            var init = function() {
                $rootScope.startLoading();
                var initModule = function() {

                    if ($scope.isNewMode) {
                        $scope.module = {
                            'openingDate': moment.utc().toDate(),
                            'timestamp': new Date().getTime(),
                            "serviceType": "",
                            "parent": $scope.orgUnit
                        };
                        return $q.when([]);
                    } else {
                        return orgUnitRepository.getAllDataSetsForOrgUnit($scope.orgUnit.id).then(function (dataSets) {
                            $scope.module = {
                                'id': $scope.orgUnit.id,
                                'name': $scope.orgUnit.name,
                                'openingDate': moment.utc($scope.orgUnit.openingDate).toDate(),
                                'serviceType': "Aggregate",
                                'parent': $scope.orgUnit.parent,
                                'attributeValues': $scope.orgUnit.attributeValues,
                                'dataSets': dataSets
                            };
                        });
                    }
                };

                var isDataElementIncluded = function(dataElement) {
                    var datasetId = $scope.selectedDataset.id;
                    var dataSetTemplate = $scope.allTemplates[datasetId];
                    if(dataSetTemplate)
                        return _.indexOf(dataSetTemplate[$scope.selectedTemplate[datasetId]], dataElement.id) === -1;
                    return true;
                };

                $scope.onTemplateSelect = function() {
                    _.each($scope.selectedDataset.sections, function(section) {
                        _.each(section.dataElements, function(de) {
                            de.isIncluded = de.isMandatory ? true : isDataElementIncluded(de);
                        });

                        section.isIncluded = !_.any(section.dataElements, {
                            "isIncluded": false
                        });

                        _.each(section.subSections, function(subSection) {
                            subSection.isIncluded = !_.any(subSection.dataElements, {
                                "isIncluded": false
                            });
                        });
                    });
                };

                var getAllModules = function() {
                    return orgUnitRepository.getAllModulesInOrgUnits([$scope.module.parent.id]).then(function(modules) {
                        $scope.otherModules = _.difference(_.pluck(modules, "name"),[$scope.module.name]);
                    });
                };

                var isOriginDataSetEnabled = function () {
                    if ($scope.geographicOriginDisabled) return $q.when();

                    if ($scope.isNewMode) {
                        $scope.associateOriginDataSet = true;
                        return $q.when();
                    }
                    else {
                        return orgUnitRepository.findAllByParent($scope.module.id).then(function (origins) {
                            var originDataSet = _.first(origins).dataSets;
                            $scope.associateOriginDataSet = !_.isEmpty(originDataSet);
                            return $q.when();
                        });
                    }
                };

                var getExcludedDataElements = function() {
                    if (!$scope.module.id)
                        return;
                    return excludedDataElementsRepository.get($scope.module.id).then(function(data) {
                        excludedDataElements = data ? _.pluck(data.dataElements, "id") : undefined;
                    });
                };

                var setDisabled = function() {
                    $scope.isDisabled = customAttributes.getBooleanAttributeValue($scope.module.attributeValues, customAttributes.DISABLED_CODE);
                };

                var getAllAggregateDatasets = function() {
                    return datasetRepository.getAll().then(function(datasets) {
                        return _.filter(datasets, "isAggregateService");
                    });
                };

                var getDatasets = function() {
                    return getAllAggregateDatasets().then(getEnrichedDataSets).then(function(datasets) {

                        var translatedDatasets = translationsService.translate(datasets);

                        datasetRepository.findAllForOrgUnits([$scope.module]).then(function (dataSets) {
                            var partitionedDatasets = _.partition(translatedDatasets, function(ds) {
                                if ($scope.module.id)
                                    return _.any(dataSets, "id", ds.id);
                                return false;
                            });

                            $scope.associateReferralLocation = $scope.isNewMode ? true: _.any(dataSets, 'isReferralDataset');
                            $scope.associatedDatasets = partitionedDatasets[0];
                            existingAssociatedDatasetIds = _.map(partitionedDatasets[0], 'id');
                            $scope.nonAssociatedDataSets = partitionedDatasets[1];
                            $scope.selectedDataset = $scope.associatedDatasets ? $scope.associatedDatasets[0] : [];
                        });

                    });
                };

                var getMandatoryDatasetsToBeAssociated = function() {
                    return datasetRepository.getAll().then(function(datasets) {
                        $scope.originDatasets = _.filter(datasets, "isOriginDataset");
                        referralDataset = _.find(datasets, "isReferralDataset");
                        populationDataset = _.find(datasets, "isPopulationDataset");
                    });
                };

                var getTemplates = function() {
                    return systemSettingRepository.get("moduleTemplates").then(function(data) {
                        $scope.allTemplates = data;
                    });
                };

                return initModule()
                    .then(getExcludedDataElements)
                    .then(getDatasets)
                    .then(getAllModules)
                    .then(setDisabled)
                    .then(getMandatoryDatasetsToBeAssociated)
                    .then(getTemplates)
                    .then(isOriginDataSetEnabled)
                    .then(function () {
                        $rootScope.stopLoading();
                    });
            };

            $scope.closeForm = function() {
                $scope.$parent.closeNewForm($scope.orgUnit);
            };

            var publishMessage = function(data, action, desc) {
                return $hustle.publish({
                    "data": data,
                    "type": action,
                    "locale": $scope.locale,
                    "desc": desc
                }, "dataValues");
            };

            var showModal = function(okCallback, message) {
                $scope.modalMessages = message;
                var modalInstance = $modal.open({
                    templateUrl: 'templates/confirm-dialog.html',
                    controller: 'confirmDialogController',
                    scope: $scope
                });

                modalInstance.result.then(okCallback);
            };

            var disableModule = function(module) {
                var enrichedModules = orgUnitMapper.mapToModule(module, module.id, 6);
                var payload = orgUnitMapper.disable(enrichedModules);
                $scope.isDisabled = true;
                $q.all([orgUnitRepository.upsert(payload), publishMessage(payload, "upsertOrgUnit", interpolate($scope.resourceBundle.disableOrgUnitDesc, { orgUnit: payload.name }))])
                    .then(function() {
                        if ($scope.$parent.closeNewForm) $scope.$parent.closeNewForm(module, "disabledModule");
                    });
            };

            $scope.disable = function(module) {
                var modalMessages = {
                    "confirmationMessage": $scope.resourceBundle.disableOrgUnitConfirmationMessage
                };
                showModal(_.bind(disableModule, {}, module), modalMessages);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var onSuccess = function(enrichedModule) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(enrichedModule.parent, "savedModule");
                return enrichedModule;
            };

            var saveExcludedDataElements = function(enrichedModule) {
                var excludedDataElements = systemSettingsTransformer.excludedDataElementsForAggregateModule($scope.associatedDatasets);
                var systemSetting = {
                    'orgUnit': enrichedModule.id,
                    'clientLastUpdated': moment().toISOString(),
                    'dataElements': excludedDataElements
                };
                return excludedDataElementsRepository.upsert(systemSetting).
                then(_.partial(publishMessage, enrichedModule.id, "uploadExcludedDataElements",
                    interpolate($scope.resourceBundle.uploadSystemSettingDesc, { module_name: enrichedModule.name })));
            };

            var getDatasetsToAssociate = function() {
                if($scope.associateReferralLocation && !$scope.referralLocationDisabled) {
                    $scope.associatedDatasets = $scope.associatedDatasets.concat(referralDataset);
                }
                return _.compact($scope.associatedDatasets.concat(populationDataset));
            };

            $scope.save = function() {

                var enrichedModule = {};

                var getEnrichedModule = function(module) {
                    enrichedModule = orgUnitMapper.mapToModule(module);
                    return $q.when(enrichedModule);
                };

                var enrichNewModuleWithDataSets = function () {
                    var dataSetsToAssociate = getDatasetsToAssociate();
                    enrichedModule.dataSets = _.map(dataSetsToAssociate, function (dataSet) {
                        return {id: dataSet.id};
                    });
                };

                var createModules = function () {
                    enrichNewModuleWithDataSets();
                    return $q.all([orgUnitRepository.upsert(enrichedModule),
                        publishMessage({orgUnitId: enrichedModule.id}, "syncOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, {orgUnit: enrichedModule.name}))
                    ]);
                };

                var createOrgUnitGroups = function() {
                    return orgUnitGroupHelper.associateModuleAndOriginsToGroups([enrichedModule]);
                };

                var createOriginsIfConfigured = function() {
                    if($scope.geographicOriginDisabled) {
                        return $q.when();
                    }

                    return originOrgunitCreator.create(enrichedModule, undefined, $scope.associateOriginDataSet).then(function(originOrgUnits) {
                        return _.map(originOrgUnits, function (originOrgUnit) {
                            return publishMessage({orgUnitId: originOrgUnit.id}, "syncOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: _.pluck(originOrgUnits, "name").toString()}));
                        });
                    });
                };

                $scope.startLoading();
                return getEnrichedModule($scope.module)
                    .then(createModules)
                    .then(_.partial(saveExcludedDataElements, enrichedModule))
                    .then(createOrgUnitGroups)
                    .then(createOriginsIfConfigured)
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally($scope.stopLoading);
            };

            $scope.update = function() {
                $scope.startLoading();
                var enrichedModule = orgUnitMapper.mapToModule($scope.module, $scope.module.id, 6);

                var dataSetsToAssociate = getDatasetsToAssociate();

                var enrichExistingModuleWithDataSets = function () {
                    enrichedModule.dataSets = _.map(dataSetsToAssociate, function (dataSet) {
                        return {id: dataSet.id};
                    });
                    return $q.when(enrichedModule);
                };

                var enrichOriginsWithDatasets = function () {
                    return $q.all({
                        origins: orgUnitRepository.findAllByParent($scope.module.id),
                        dataSets: datasetRepository.getAll()})
                        .then(function (data) {
                            var originDatasets = _.filter(data.dataSets, 'isOriginDataset');
                            var datasetsForAssociation = _.map(originDatasets, function (originDataset) {
                                return {id: originDataset.id};
                            });
                            _.map(data.origins, function (origin) {
                                origin.dataSets = $scope.associateOriginDataSet ? datasetsForAssociation : [];
                            });
                            return data.origins;
                        });
                };

                var saveOrigins = function (enrichedOrigins) {
                  return _.map(enrichedOrigins, function (origin) {
                      return orgUnitRepository.upsert(origin).then(function () {
                          return publishMessage({orgUnitId: origin.id}, "syncOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: origin.name }));
                      });
                  });
                };

                return enrichExistingModuleWithDataSets()
                    .then(enrichOriginsWithDatasets)
                    .then(saveOrigins)
                    .then(function(){
                        $q.all([saveExcludedDataElements(enrichedModule), orgUnitRepository.upsert(enrichedModule),
                            publishMessage({orgUnitId: enrichedModule.id}, "syncOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: enrichedModule.name }))
                        ]);
                    })
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally($scope.stopLoading);
            };

            $scope.areDatasetsSelected = function() {
                return !_.isEmpty($scope.associatedDatasets);
            };

            $scope.shouldDisableSaveOrUpdateButton = function() {
                return !$scope.areDatasetsSelected() || !$scope.areDataElementsSelectedForSection();
            };

            $scope.areDataElementsSelectedForSection = function() {
                return !_.isEmpty($scope.selectedDataset) && _.some($scope.selectedDataset.sections, function(section) {
                    return _.some(section.dataElements, "isIncluded");
                });
            };

            $scope.changeDataElementSelectionInSubSection = function(subSection, section) {
                _.each(subSection.dataElements, function(dataElement) {
                    dataElement.isIncluded = subSection.isIncluded || dataElement.isMandatory;
                });
                $scope.changeSectionSelection(section);
            };

            $scope.changeSectionSelection = function(section) {
                section.isIncluded = !_.any(section.dataElements, {
                    "isIncluded": false
                });
            };

            $scope.changeSubSectionSelection = function(subSection, section) {
                subSection.isIncluded = !_.any(subSection.dataElements, {
                    "isIncluded": false
                });
                section.isIncluded = !_.any(section.dataElements, {
                    "isIncluded": false
                });
            };

            $scope.toggleSelect = function (section) {
                $scope.form.$setDirty();
                section.isIncluded = !section.isIncluded;
                _.each(section.dataElements, function(dataElement) {
                    dataElement.isIncluded = section.isIncluded;
                });
                _.each(section.subSections, function(subSection) {
                    subSection.isIncluded = section.isIncluded;
                });
            };

            $scope.toggleSelectSubSection = function (subSection, section) {
                $scope.form.$setDirty();
                subSection.isIncluded = !subSection.isIncluded;
                _.each(subSection.dataElements, function(dataElement) {
                    dataElement.isIncluded = subSection.isIncluded || dataElement.isMandatory;
                });
                $scope.changeSectionSelection(section);
            };

            var setSelectedTemplate = function(datasetId) {
                if (!$scope.selectedTemplate[datasetId] && $scope.isNewMode)
                    $scope.selectedTemplate[datasetId] = "Default";
            };

            $scope.selectDataSet = function(item) {
                if (_.isEmpty(item))
                    return;
                if ($scope.enrichedDatasets[item.id]) {
                    $scope.selectedDataset = $scope.enrichedDatasets[item.id];
                    setSelectedTemplate($scope.selectedDataset.id);
                    return;
                }
                return getEnrichedDataSets([item]).then(function(datasets) {
                    var translatedDatasets = translationsService.translate(datasets);
                    $scope.selectedDataset = dataSetWithEnrichedSections(translatedDatasets[0]);
                    setSelectedTemplate($scope.selectedDataset.id);
                    $scope.enrichedDatasets[$scope.selectedDataset.id] = $scope.selectedDataset;
                    _.each($scope.selectedDataset.sections, function(section) {
                        $scope.isExpanded[section.id] = false;
                        $scope.changeSectionSelection(section);
                        _.each(section.subSections, function(subSection) {
                            $scope.changeSubSectionSelection(subSection, section);
                        });
                    });
                    $scope.isExpanded[$scope.selectedDataset.sections[0].id] = true;
                });
            };

            $scope.discardDataSet = function(module, items) {
                _.each(items, function(dataset) {
                    _.each(dataset.sections, function(section) {
                        section.isIncluded = true;
                        _.each(section.dataElements, function(dataElement) {
                            dataElement.isIncluded = true;
                        });
                    });
                });
                module.selectedDataset = undefined;
                $scope.selectedDataset = undefined;
            };

            $scope.getDisplayName = dataElementUtils.getDisplayName;

            $scope.dismissModal = function() {
                $modalStack.dismissAll();
            };

            init();
        };
    });
