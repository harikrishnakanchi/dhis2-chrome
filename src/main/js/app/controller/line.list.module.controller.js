define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer"],
    function(_, orgUnitMapper, moment, systemSettingsTransformer) {
        return function($scope, $hustle, orgUnitRepository, excludedDataElementsRepository, $q, $modal,
            programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator, translationsService, excludedLineListOptionsRepository) {

            $scope.module = {};
            $scope.isExpanded = {};
            $scope.isDisabled = false;
            $scope.allModules = [];
            $scope.collapseSection = {};
            $scope.excludedDataElements = [];
            $scope.allPrograms = [];
            $scope.program = {};
            $scope.enrichedProgram = {};

            var init = function() {
                var initModule = function() {
                    if ($scope.isNewMode) {
                        $scope.module = {
                            'openingDate': moment().toDate(),
                            'timestamp': new Date().getTime(),
                            "serviceType": "Linelist",
                            "dataModelType": "New",
                            "parent": $scope.orgUnit
                        };
                    } else {
                        $scope.module = {
                            'id': $scope.orgUnit.id,
                            'name': $scope.orgUnit.name,
                            'openingDate': moment($scope.orgUnit.openingDate).toDate(),
                            'serviceType': "Linelist",
                            "dataModelType": "New",
                            "parent": $scope.orgUnit.parent,
                            "attributeValues": $scope.orgUnit.attributeValues
                        };
                    }
                    return $q.when([]);
                };

                var getAllModules = function() {
                    return orgUnitRepository.getAllModulesInOrgUnits([$scope.module.parent.id]).then(function(modules) {
                        $scope.allModules = _.pluck(modules, "name");
                    });
                };

                var getExcludedDataElements = function() {
                    return excludedDataElementsRepository.get($scope.module.id).then(function(excludedDataElementsSetting) {
                        $scope.excludedDataElements = excludedDataElementsSetting ? _.pluck(excludedDataElementsSetting.dataElements, "id") : undefined;
                    });
                };

                var getExcludedLineListOptions = function () {
                    return excludedLineListOptionsRepository.get($scope.module.id).then(function (excludedLineListOptions) {
                        $scope.excludedLineListOptions = excludedLineListOptions;
                    });
                };

                var getExcludedModuleData = function () {
                    if (!$scope.module.id) {
                        return;
                    }
                    return getExcludedDataElements()
                        .then(getExcludedLineListOptions);
                };

                var getAssociatedProgram = function() {
                    if (!$scope.module.id) {
                        $scope.program = {
                            "name": ""
                        };
                        return;
                    }

                    return orgUnitRepository.findAllByParent($scope.module.id).then(function(originOrgUnits) {
                        return programRepository.getProgramForOrgUnit(originOrgUnits[0].id).then(function(prg) {
                            if (_.isEmpty(prg)) {
                                $scope.program = {
                                    "name": ""
                                };
                            } else {
                                $scope.program = _.find($scope.allPrograms, function(p) {
                                    return p.id == prg.id;
                                });
                                getEnrichedProgram(prg.id);
                            }
                        });
                    });
                };

                var getEnrichedProgram = function(progId) {
                    var buildProgramDataElements = function () {
                        _.forEach($scope.enrichedProgram.programStages, function (programStage) {
                            _.forEach(programStage.programStageSections, function (programStageSection) {
                                programStageSection.dataElementsWithOptions = _.filter(programStageSection.programStageDataElements, 'dataElement.optionSet');
                                programStageSection.dataElementsWithoutOptions = _.reject(programStageSection.programStageDataElements, 'dataElement.optionSet');
                            });
                        });
                    };

                    var setDataElementOptionStatus = function () {

                        var allDataElements = _.chain($scope.enrichedProgram.programStages)
                            .map('programStageSections')
                            .flatten()
                            .map('dataElementsWithOptions')
                            .flatten()
                            .map('dataElement')
                            .value();

                        if ($scope.excludedLineListOptions) {
                            var excludedOptionsByDataElement = _.indexBy($scope.excludedLineListOptions.dataElements, 'dataElementId');
                            _.each(allDataElements, function (dataElement) {
                                var dataElementExcludedOptions = excludedOptionsByDataElement[dataElement.id];
                                var dataElementOptions = dataElementExcludedOptions.excludedOptionIds;
                                _.each(dataElement.optionSet.options, function (option) {
                                    option.isSelected = !_.contains(dataElementOptions, option.id);
                                });
                            });
                        } else {
                            _.each(allDataElements, function (dataElement) {
                                _.each(dataElement.optionSet.options, function (option) {
                                    option.isSelected = true;
                                });
                            });
                        }
                    };

                    return programRepository.get(progId, $scope.excludedDataElements).then(function(data) {
                        $scope.enrichedProgram = translationsService.translate(data);
                        buildProgramDataElements();
                        setDataElementOptionStatus();
                        resetCollapse();
                    });
                };

                $scope.onProgramSelect = function(selected) {
                    if (selected) {
                        $scope.program = selected.originalObject;
                        return getEnrichedProgram($scope.program.id);
                    }
                    $scope.program = {};
                };

                var setUpModule = function() {
                    if (!_.isEmpty($scope.enrichedProgram))
                        resetCollapse();

                    var isDisabled = _.find($scope.module.attributeValues, {
                        "attribute": {
                            "code": "isDisabled"
                        }
                    });
                    $scope.isDisabled = isDisabled && isDisabled.value === "true" ? true : false;
                    $scope.updateDisabled = $scope.isDisabled;
                };

                var setPrograms = function(programs) {
                    $scope.allPrograms = _.sortBy(programs, function(program) {
                        return program.name;
                    });
                };

                var translatePrograms = function (allPrograms) {
                    return translationsService.translate(allPrograms[0]);
                };

                var getPrograms = function() {
                    return $q.all([programRepository.getAll()]);
                };


                initModule().then(getPrograms)
                    .then(translatePrograms)
                    .then(setPrograms)
                    .then(getAllModules)
                    .then(getExcludedModuleData)
                    .then(getAssociatedProgram)
                    .then(setUpModule);
            };

            $scope.changeCollapsed = function(sectionId) {
                $scope.collapseSection[sectionId] = !$scope.collapseSection[sectionId];
            };

            $scope.getCollapsed = function(sectionId) {
                return $scope.collapseSection[sectionId];
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

            var resetCollapse = function() {
                $scope.collapseSection = {};
                _.forEach($scope.enrichedProgram.programStages, function(programStage) {
                    _.forEach(programStage.programStageSections, function(programStageSection) {
                        $scope.collapseSection[programStageSection.id] = true;
                    });
                    $scope.collapseSection[programStage.programStageSections[0].id] = false;
                });
            };

            var disableModule = function(module) {
                var enrichedModule = orgUnitMapper.mapToModule(module, module.id, 6);
                var payload = orgUnitMapper.disable(enrichedModule);
                $scope.isDisabled = true;
                $q.all([orgUnitRepository.upsert(payload), publishMessage(payload, "upsertOrgUnit", $scope.resourceBundle.disableOrgUnitDesc + payload.name)])
                    .then(function() {
                        if ($scope.$parent.closeNewForm) {
                            $scope.$parent.closeNewForm(module, "disabledModule");
                        }
                    });
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
                var excludedDataElements = systemSettingsTransformer.excludedDataElementsForLinelistModule($scope.enrichedProgram);
                var excludedDataElementSetting = {
                    'orgUnit': enrichedModule.id,
                    'clientLastUpdated': moment().toISOString(),
                    'dataElements': excludedDataElements
                };
                return excludedDataElementsRepository.upsert(excludedDataElementSetting)
                    .then(_.partial(publishMessage, enrichedModule.id, "uploadExcludedDataElements",
                        $scope.resourceBundle.uploadSystemSettingDesc + enrichedModule.name));
            };

            $scope.save = function(module) {
                var enrichedModule = {};
                var populationDatasetId, referralDatasetId;

                var associateToProgram = function(program, originOrgUnits) {
                    return programRepository.associateOrgUnits(program, originOrgUnits).then(function() {
                        publishMessage(program, "uploadProgram", $scope.resourceBundle.uploadProgramDesc + _.pluck(originOrgUnits, "name"));
                    });
                };

                var associateToDatasets = function(originOrgUnits) {

                    return datasetRepository.getAll().then(function(allDatasets) {

                        var originDatasetIds = _.pluck(_.filter(allDatasets, "isOriginDataset"), "id");
                        referralDatasetId = _.find(allDatasets, "isReferralDataset").id;
                        populationDatasetId = _.find(allDatasets, "isPopulationDataset").id;

                        var summaryDatasetId = _.find($scope.program.attributeValues, {
                            "attribute": {
                                "code": "associatedDataSet"
                            }
                        }).value;

                        var datasetIds = _.flattenDeep([summaryDatasetId, originDatasetIds]);

                        return datasetRepository.associateOrgUnits(datasetIds, originOrgUnits).then(function() {
                            var orgunitIdsAndDatasetIds = {
                                "orgUnitIds": _.pluck(originOrgUnits, "id"),
                                "dataSetIds": datasetIds
                            };
                            return publishMessage(orgunitIdsAndDatasetIds, "associateOrgUnitToDataset",
                                $scope.resourceBundle.associateOrgUnitToDatasetDesc + $scope.orgUnit.name);
                        });
                    });
                };

                var getEnrichedModule = function(module) {
                    enrichedModule = orgUnitMapper.mapToModule(module);
                    return $q.when(enrichedModule);
                };

                var createModule = function() {
                    return $q.all([orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + enrichedModule.name)]);
                };

                var createOriginOrgUnitsAndGroups = function() {
                    var createOrgUnitGroups = function(originsPayload) {
                        return orgUnitGroupHelper.createOrgUnitGroups(originsPayload, false);
                    };

                    return originOrgunitCreator.create(enrichedModule).then(function(patientOriginOUPayload) {
                        return publishMessage(patientOriginOUPayload, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + _.pluck(patientOriginOUPayload, "name"))
                            .then(_.partial(associateToProgram, $scope.program, patientOriginOUPayload))
                            .then(_.partial(associateToDatasets, patientOriginOUPayload))
                            .then(_.partial(createOrgUnitGroups, patientOriginOUPayload));
                    });
                };

                var associateMandatoryDatasetsToModule = function() {
                    var datasetIds = [populationDatasetId, referralDatasetId];
                    return datasetRepository.associateOrgUnits(datasetIds, [enrichedModule]).then(function() {
                        var orgunitIdsAndDatasetIds = {
                            "orgUnitIds": [enrichedModule.id],
                            "dataSetIds": datasetIds
                        };
                        return publishMessage(orgunitIdsAndDatasetIds, "associateOrgUnitToDataset",
                            $scope.resourceBundle.associateOrgUnitToDatasetDesc + enrichedModule.displayName);
                    });
                };

                var saveExcludedLineListOptions = function () {
                    var dataElementsWithOptions = _.chain($scope.enrichedProgram.programStages)
                        .map('programStageSections')
                        .flatten()
                        .map('dataElementsWithOptions')
                        .flatten()
                        .map('dataElement')
                        .value();
                    var excludedLineListOptions = {};
                    excludedLineListOptions.moduleId = enrichedModule.id;
                    excludedLineListOptions.clientLastUpdated = moment().toISOString();
                    excludedLineListOptions.dataElements = _.transform(dataElementsWithOptions, function (dataElements, dataElement) {
                        var excludedOptionIds = _.map(_.reject(dataElement.optionSet && dataElement.optionSet.options, 'isSelected'), 'id');
                        if(excludedOptionIds.length) {
                            dataElements.push({
                                dataElementId: dataElement.id,
                                excludedOptionIds: excludedOptionIds
                            });
                        }
                    });
                    return excludedLineListOptionsRepository.upsert(excludedLineListOptions);
                };

                $scope.loading = true;
                return getEnrichedModule($scope.module)
                    .then(createModule)
                    .then(_.partial(saveExcludedDataElements, enrichedModule))
                    .then(createOriginOrgUnitsAndGroups)
                    .then(associateMandatoryDatasetsToModule)
                    .then(saveExcludedLineListOptions)
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally(function() {
                        $scope.loading = false;
                    });
            };

            $scope.update = function(module) {
                var enrichedModule = orgUnitMapper.mapToModule(module, module.id, 6);

                $scope.loading = true;
                return $q.all([saveExcludedDataElements(enrichedModule),
                        orgUnitRepository.upsert(enrichedModule),
                        publishMessage(enrichedModule, "upsertOrgUnit", $scope.resourceBundle.upsertOrgUnitDesc + enrichedModule.name)
                    ])
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally(function() {
                        $scope.loading = false;
                    });
            };

            $scope.shouldDisableSaveOrUpdateButton = function() {
                return _.isEmpty($scope.program.name);
            };

            $scope.onOptionSelectionChange = function (optionSet, option) {
                var areAtleastTwoOptionsSelected = _.filter(optionSet.options, {isSelected: true}).length >= 2;
                if(!areAtleastTwoOptionsSelected) {
                    option.isSelected = true;
                    showModal(function () {}, $scope.resourceBundle.atleastTwoOptionsMustBeSelected);
                }
            };

            $scope.stopPropagation = function (event) {
                event.stopPropagation();
            };

            init();
        };
    });
