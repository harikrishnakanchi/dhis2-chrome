define(["lodash", "orgUnitMapper", "moment", "interpolate", "systemSettingsTransformer"],
    function(_, orgUnitMapper, moment, interpolate, systemSettingsTransformer) {
        return function($scope, $hustle, orgUnitRepository, excludedDataElementsRepository, $q, $modal,
            programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator, translationsService, excludedLineListOptionsRepository) {

            $scope.module = {};
            $scope.isExpanded = {};
            $scope.isDisabled = false;
            $scope.otherModules = [];
            $scope.collapseSection = {};
            $scope.excludedDataElements = [];
            $scope.allPrograms = [];
            $scope.program = {};
            $scope.enrichedProgram = {};

            var init = function() {
                var initModule = function() {
                    if ($scope.isNewMode) {
                        $scope.module = {
                            'openingDate': moment.utc().toDate(),
                            'timestamp': new Date().getTime(),
                            "serviceType": "Linelist",
                            "dataModelType": "New",
                            "parent": $scope.orgUnit
                        };
                    } else {
                        $scope.module = {
                            'id': $scope.orgUnit.id,
                            'name': $scope.orgUnit.name,
                            'openingDate': moment.utc($scope.orgUnit.openingDate).toDate(),
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
                        $scope.otherModules = _.difference(_.pluck(modules, "name"), [$scope.module.name]);
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
                        var isDataElementWithOptions = function (programStageDataElement) {
                            var dataElementHasOptions = !!programStageDataElement.dataElement.optionSet;
                            var isReferralLocation = programStageDataElement.dataElement.offlineSummaryType == 'referralLocations';
                            return dataElementHasOptions && !isReferralLocation;
                        };

                        _.forEach($scope.enrichedProgram.programStages, function (programStage) {
                            _.forEach(programStage.programStageSections, function (programStageSection) {
                                programStageSection.dataElementsWithOptions = _.filter(programStageSection.programStageDataElements, isDataElementWithOptions);
                                programStageSection.dataElementsWithoutOptions = _.reject(programStageSection.programStageDataElements, isDataElementWithOptions);
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

                        var markAllOptionsAsTrue = function (options) {
                            _.each(options, function (option) {
                                option.isSelected = true;
                            });
                        };

                        var isModuleConfiguredWithExcludedLineListOptions = !!$scope.excludedLineListOptions;

                        if (isModuleConfiguredWithExcludedLineListOptions) {
                            var excludedOptionsByDataElement = _.indexBy($scope.excludedLineListOptions.dataElements, 'dataElementId');
                            _.each(allDataElements, function (dataElement) {
                                var dataElementExcludedOptions = excludedOptionsByDataElement[dataElement.id];
                                var isAnyDataElementOptionsUnSelected = !!dataElementExcludedOptions;
                                if(isAnyDataElementOptionsUnSelected) {
                                    var dataElementOptions = dataElementExcludedOptions.excludedOptionIds;
                                    _.each(dataElement.optionSet.options, function (option) {
                                        option.isSelected = !_.contains(dataElementOptions, option.id);
                                    });
                                } else {
                                    markAllOptionsAsTrue(dataElement.optionSet.options);
                                }
                            });
                        } else {
                            _.each(allDataElements, function (dataElement) {
                                markAllOptionsAsTrue(dataElement.optionSet.options);
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

            var publishJob = function(publishMethod, data, action, desc) {
                return publishMethod({
                    "data": data,
                    "type": action,
                    "locale": $scope.locale,
                    "desc": desc
                }, "dataValues");
            };

            var publishMessage = _.partial(publishJob, $hustle.publish);

            var publishMessageOnlyOnce = _.partial(publishJob, $hustle.publishOnce);

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
                $q.all([orgUnitRepository.upsert(payload), publishMessage(payload, "upsertOrgUnit", interpolate($scope.resourceBundle.disableOrgUnitDesc, { orgUnit: payload.name }))])
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

            var showAlert = function(messages) {
                $scope.modalMessages = messages;
                $modal.open({
                    templateUrl: 'templates/alert-dialog.html',
                    controller: 'alertDialogController',
                    scope: $scope
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

            var saveExcludedLineListOptions = function (enrichedModule) {
                var dataElementsWithOptions = _.chain($scope.enrichedProgram.programStages)
                    .map('programStageSections')
                    .flatten()
                    .map('dataElementsWithOptions')
                    .flatten()
                    .map('dataElement')
                    .filter('isIncluded')
                    .value();
                var excludedLineListOptions = {};
                excludedLineListOptions.moduleId = enrichedModule.id;
                excludedLineListOptions.clientLastUpdated = moment().toISOString();
                excludedLineListOptions.dataElements = _.transform(dataElementsWithOptions, function (dataElements, dataElement) {
                    var excludedOptionIds = _.map(_.reject(dataElement.optionSet && dataElement.optionSet.options, 'isSelected'), 'id');
                    if(excludedOptionIds.length) {
                        dataElements.push({
                            dataElementId: dataElement.id,
                            optionSetId: dataElement.optionSet.id,
                            excludedOptionIds: excludedOptionIds
                        });
                    }
                });
                return excludedLineListOptionsRepository.upsert(excludedLineListOptions).then(function () {
                    return publishMessageOnlyOnce(enrichedModule.id, "uploadExcludedOptions", interpolate($scope.resourceBundle.uploadExcludedOptionsDesc, { module_name: enrichedModule.name }));
                });
            };

            $scope.save = function() {
                var enrichedModule = {};
                var populationDatasetId, referralDatasetId;

                var associateToProgram = function(program, originOrgUnits) {
                    return programRepository.associateOrgUnits(program, originOrgUnits).then(function() {
                        var programIdsAndOrgunitIds = {
                            programIds: [program.id],
                            orgUnitIds: _.map(originOrgUnits, 'id')
                        };
                        return publishMessage(programIdsAndOrgunitIds, 'associateOrgunitToProgram', interpolate($scope.resourceBundle.uploadProgramDesc, { orgunit_name: _.pluck(originOrgUnits, "name").toString() }));
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

                        return orgUnitRepository.associateDataSetsToOrgUnits(datasetIds, originOrgUnits).then(function() {
                            var orgunitIdsAndDatasetIds = {
                                "orgUnitIds": _.pluck(originOrgUnits, "id"),
                                "dataSetIds": datasetIds
                            };
                            return publishMessage(orgunitIdsAndDatasetIds, "associateOrgUnitToDataset",
                                interpolate($scope.resourceBundle.associateOrgUnitToDatasetDesc, { orgunit_name: $scope.orgUnit.name }));
                        });
                    });
                };

                var getEnrichedModule = function(module) {
                    enrichedModule = orgUnitMapper.mapToModule(module);
                    return $q.when(enrichedModule);
                };

                var createModule = function() {
                    return $q.all([orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: enrichedModule.name }))]);
                };

                var createOriginOrgUnitsAndGroups = function() {
                    var createOrgUnitGroups = function(originsPayload) {
                        return orgUnitGroupHelper.createOrgUnitGroups(originsPayload, false);
                    };

                    return originOrgunitCreator.create(enrichedModule).then(function(patientOriginOUPayload) {
                        return publishMessage(patientOriginOUPayload, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: _.pluck(patientOriginOUPayload, "name") }))
                            .then(_.partial(associateToProgram, $scope.program, patientOriginOUPayload))
                            .then(_.partial(associateToDatasets, patientOriginOUPayload))
                            .then(_.partial(createOrgUnitGroups, patientOriginOUPayload));
                    });
                };

                var associateMandatoryDatasetsToModule = function() {
                    var datasetIds = [populationDatasetId, referralDatasetId];
                    return orgUnitRepository.associateDataSetsToOrgUnits(datasetIds, [enrichedModule]).then(function() {
                        var orgunitIdsAndDatasetIds = {
                            "orgUnitIds": [enrichedModule.id],
                            "dataSetIds": datasetIds
                        };
                        return publishMessage(orgunitIdsAndDatasetIds, "associateOrgUnitToDataset",
                            interpolate($scope.resourceBundle.associateOrgUnitToDatasetDesc, { orgunit_name: enrichedModule.displayName }));
                    });
                };

                $scope.startLoading();
                return getEnrichedModule($scope.module)
                    .then(createModule)
                    .then(_.partial(saveExcludedDataElements, enrichedModule))
                    .then(createOriginOrgUnitsAndGroups)
                    .then(associateMandatoryDatasetsToModule)
                    .then(_.partial(saveExcludedLineListOptions, enrichedModule))
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally($scope.stopLoading);
            };

            $scope.update = function(module) {
                var enrichedModule = orgUnitMapper.mapToModule(module, module.id, 6);

                $scope.startLoading();
                return $q.all([
                    saveExcludedDataElements(enrichedModule),
                    saveExcludedLineListOptions(enrichedModule),
                    orgUnitRepository.upsert(enrichedModule),
                    publishMessage(enrichedModule, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: enrichedModule.name }))
                ])
                    .then(_.partial(onSuccess, enrichedModule), onError)
                    .finally($scope.stopLoading);
            };

            $scope.shouldDisableSaveOrUpdateButton = function() {
                return _.isEmpty($scope.program.name);
            };

            $scope.onOptionSelectionChange = function (optionSet, option) {
                var areAtleastTwoOptionsSelected = _.filter(optionSet.options, {isSelected: true}).length >= 2;
                if(!areAtleastTwoOptionsSelected) {
                    option.isSelected = true;
                    var modalMessages = {
                        confirmationMessage: $scope.resourceBundle.atleastTwoOptionsMustBeSelected,
                        ok: $scope.resourceBundle.okLabel
                    };
                    showAlert(modalMessages);
                }
            };

            $scope.stopPropagation = function (event) {
                event.stopPropagation();
            };

            init();
        };
    });
