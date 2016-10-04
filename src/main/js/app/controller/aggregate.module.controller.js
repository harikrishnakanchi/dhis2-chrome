define(["lodash", "orgUnitMapper", "moment","interpolate", "systemSettingsTransformer"],
    function(_, orgUnitMapper, moment, interpolate, systemSettingsTransformer) {
        return function($scope, $hustle, orgUnitRepository, datasetRepository, systemSettingRepository, excludedDataElementsRepository, db, $location, $q, $modal,
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

                var isDataElementExcluded = function(dataElement) {
                    var datasetId = $scope.selectedDataset.id;
                    return _.indexOf($scope.allTemplates[datasetId][$scope.selectedTemplate[datasetId]], dataElement.id) === -1;
                };

                $scope.onTemplateSelect = function() {
                    _.each($scope.selectedDataset.sections, function(section) {
                        _.each(section.dataElements, function(de) {
                            de.isIncluded = de.isMandatory ? true : isDataElementExcluded(de);
                        });

                        section.isIncluded = !_.any(section.dataElements, {
                            "isIncluded": false
                        });
                    });
                };

                var getAllModules = function() {
                    return orgUnitRepository.getAllModulesInOrgUnits([$scope.module.parent.id]).then(function(modules) {
                        $scope.otherModules = _.difference(_.pluck(modules, "name"),[$scope.module.name]);
                    });
                };

                var getExcludedDataElements = function() {
                    if (!$scope.module.id)
                        return;
                    return excludedDataElementsRepository.get($scope.module.id).then(function(data) {
                        excludedDataElements = data ? _.pluck(data.dataElements, "id") : undefined;
                    });
                };

                var setDisabled = function() {
                    var isDisabled = _.find($scope.module.attributeValues, {
                        "attribute": {
                            "code": "isDisabled"
                        }
                    });
                    $scope.isDisabled = isDisabled && isDisabled.value === "true" ? true : false;
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
                    .then(getTemplates);
            };

            $scope.changeCollapsed = function(sectionId) {
                $scope.collapseSection[sectionId] = !$scope.collapseSection[sectionId];
            };

            $scope.getCollapsed = function(sectionId) {
                return $scope.collapseSection[sectionId];
            };

            $scope.getSection = function(selectedDataSet, sectionId) {
                return _.find(selectedDataSet.sections, {
                    "id": sectionId
                });
            };

            $scope.getDataElement = function(section, dataElementId) {
                return _.find(section.dataElements, {
                    "id": dataElementId
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
                    $scope.resourceBundle.uploadSystemSettingDesc + enrichedModule.name));
            };

            var associateToDatasets = function(datasetIds, orgUnits) {
                return orgUnitRepository.associateDataSetsToOrgUnits(datasetIds, orgUnits).then(function() {
                    var orgunitIdsAndDatasetIds = {
                        "orgUnitIds": _.pluck(orgUnits, "id"),
                        "dataSetIds": datasetIds
                    };
                    return publishMessage(orgunitIdsAndDatasetIds, "associateOrgUnitToDataset",
                        $scope.resourceBundle.associateOrgUnitToDatasetDesc + $scope.orgUnit.name);
                });
            };

            // TODO: Use this method when we remove orgUnit-Dataset association as part of story #2017
            var removeOrgUnitsFromDataSets = function (datasetIds, orgUnitIds) {
                return orgUnitRepository.removeDataSetsFromOrgUnits(datasetIds, orgUnitIds).then(function () {
                    var orgunitIdsAndDatasetIds = {
                        "orgUnitIds": orgUnitIds,
                        "dataSetIds": datasetIds
                    };
                    return publishMessage(orgunitIdsAndDatasetIds, "removeOrgUnitFromDataset",
                        $scope.resourceBundle.removeOrgUnitFromDatasetDesc + $scope.orgUnit.name);
                });

            };

            $scope.save = function() {

                var getDatasetsToAssociate = function() {
                    return _.compact([].concat($scope.associatedDatasets).concat(referralDataset).concat(populationDataset));
                };

                var enrichedModule = {};

                var getEnrichedModule = function(module) {
                    enrichedModule = orgUnitMapper.mapToModule(module);
                    return $q.when(enrichedModule);
                };

                var createModules = function() {
                    return $q.all([orgUnitRepository.upsert(enrichedModule),
                        publishMessage(enrichedModule, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: enrichedModule.name }))
                    ]);
                };

                var createOrgUnitGroups = function() {
                    return orgUnitGroupHelper.createOrgUnitGroups([enrichedModule], false);
                };

                var createOriginOrgUnits = function() {
                    return originOrgunitCreator.create(enrichedModule).then(function(originOrgUnits) {
                        return publishMessage(originOrgUnits, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: _.pluck(originOrgUnits, "name")}))
                            .then(_.partial(associateToDatasets, _.map($scope.originDatasets, 'id'), originOrgUnits));
                    });
                };

                var datasetIdsToAssociate = _.map(getDatasetsToAssociate(), 'id');

                $scope.loading = true;
                return getEnrichedModule($scope.module)
                    .then(createModules)
                    .then(_.partial(associateToDatasets, datasetIdsToAssociate, [enrichedModule]))
                    .then(_.partial(saveExcludedDataElements, enrichedModule))
                    .then(createOrgUnitGroups)
                    .then(createOriginOrgUnits)
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally(function() {
                        $scope.loading = false;
                    });
            };

            $scope.update = function() {
                var enrichedModule = orgUnitMapper.mapToModule($scope.module, $scope.module.id, 6);

                var updateOrgUnitDatasetAssociations = function () {
                    var associatedDatasetIds = _.map($scope.associatedDatasets, 'id');
                    var newlyAddedDatasetIds = _.difference(associatedDatasetIds, existingAssociatedDatasetIds);
                    var removedDatasetIds = _.difference(existingAssociatedDatasetIds, associatedDatasetIds);
                    return associateToDatasets(newlyAddedDatasetIds, [enrichedModule]);
                };

                $scope.loading = true;
                return $q.all([saveExcludedDataElements(enrichedModule), orgUnitRepository.upsert(enrichedModule),
                        publishMessage(enrichedModule, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: enrichedModule.name }))
                    ])
                    .then(updateOrgUnitDatasetAssociations)
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally(function() {
                        $scope.loading = false;
                    });
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

            $scope.changeDataElementSelection = function(section) {
                _.each(section.dataElements, function(dataElement) {
                    dataElement.isIncluded = section.isIncluded || dataElement.isMandatory;
                });
                _.each(section.subSections, function(subSection) {
                    subSection.isIncluded = section.isIncluded;
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

            init();
        };
    });
