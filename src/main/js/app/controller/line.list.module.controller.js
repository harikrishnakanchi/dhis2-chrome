define(["lodash", "orgUnitMapper", "moment", "interpolate", "systemSettingsTransformer", "dataElementUtils", "customAttributes"],
    function(_, orgUnitMapper, moment, interpolate, systemSettingsTransformer, dataElementUtils, customAttributes) {
        return function($scope, $rootScope, $hustle, orgUnitRepository, excludedDataElementsRepository, $q, $modal,
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
            $scope.getDisplayName = dataElementUtils.getDisplayName;

            var init = function() {
                var initModule = function() {
                    $rootScope.startLoading();
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

                    var getOrgUnitIdAssociatedWithProgram = function () {
                        if(!$scope.geographicOriginDisabled) {
                            return orgUnitRepository.findAllByParent($scope.module.id).then(function (origins) {
                                return origins[0].id;
                            });
                        } else {
                            return $q.when($scope.module.id);
                        }
                    };

                    return getOrgUnitIdAssociatedWithProgram().then(function(orgUnitId) {
                        return programRepository.getProgramForOrgUnit(orgUnitId).then(function(prg) {
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

                    $scope.isDisabled = customAttributes.getBooleanAttributeValue($scope.module.attributeValues, customAttributes.DISABLED_CODE);
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
                    .then(setUpModule)
                    .then(function () {
                        $rootScope.stopLoading();
                    });
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
                        interpolate($scope.resourceBundle.uploadSystemSettingDesc, { module_name: enrichedModule.name })));
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
                var dataSets;

                var associateToProgram = function(program, orgUnits) {
                    return programRepository.associateOrgUnits(program, orgUnits).then(function() {
                        var programIdsAndOrgunitIds = {
                            programIds: [program.id],
                            orgUnitIds: _.map(orgUnits, 'id')
                        };
                        return publishMessage(programIdsAndOrgunitIds, 'associateOrgunitToProgram', interpolate($scope.resourceBundle.uploadProgramDesc, { orgunit_name: _.pluck(orgUnits, "name").toString() }));
                    });
                };

                var associateDatasetsToOrigins = function(originOrgUnits) {
                    var dataSetIds = _.flattenDeep([dataSets.summaryDatasetId, dataSets.originDatasetIds]);

                    return orgUnitRepository.associateDataSetsToOrgUnits(dataSetIds, originOrgUnits).then(function() {
                        var orgunitIdsAndDatasetIds = {
                            "orgUnitIds": _.pluck(originOrgUnits, "id"),
                            "dataSetIds": dataSetIds
                        };
                        return publishMessage(orgunitIdsAndDatasetIds, "associateOrgUnitToDataset",
                            interpolate($scope.resourceBundle.associateOrgUnitToDatasetDesc, { orgunit_name: $scope.orgUnit.name }));
                    });
                };

                var getEnrichedModule = function(module) {
                    enrichedModule = orgUnitMapper.mapToModule(module);
                    return $q.when(enrichedModule);
                };

                var createModule = function() {
                    return $q.all([orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: enrichedModule.name }))]);
                };

                var getDataSets = function () {
                    return datasetRepository.getAll().then(function(allDatasets) {

                        var originDatasetIds = _.flattenDeep(_.pluck(_.filter(allDatasets, "isOriginDataset"), "id"));
                        var referralDatasetId = _.find(allDatasets, "isReferralDataset").id;
                        var populationDatasetId = _.find(allDatasets, "isPopulationDataset").id;
                        var summaryDatasetId = customAttributes.getAttributeValue($scope.program.attributeValues, customAttributes.ASSOCIATED_DATA_SET_CODE);

                        dataSets = {
                            originDatasetIds: originDatasetIds,
                            referralDatasetId: referralDatasetId,
                            populationDatasetId: populationDatasetId,
                            summaryDatasetId: summaryDatasetId
                        };
                    });
                };

                var createOriginOrgUnitsAndGroups = function() {
                    var createOrgUnitGroups = function(orgUnitPayLoad) {
                        return orgUnitGroupHelper.createOrgUnitGroups(orgUnitPayLoad, false);
                    };

                    if (!$scope.geographicOriginDisabled) {
                        return originOrgunitCreator.create(enrichedModule).then(function (originPayload) {
                            return publishMessage(originPayload, "upsertOrgUnit", interpolate($scope.resourceBundle.upsertOrgUnitDesc, {orgUnit: _.pluck(originPayload, "name")}))
                                .then(_.partial(associateToProgram, $scope.program, originPayload))
                                .then(_.partial(associateDatasetsToOrigins, originPayload))
                                .then(_.partial(createOrgUnitGroups, originPayload));
                        });
                    } else {
                        return associateToProgram($scope.program, [enrichedModule])
                            .then(_.partial(createOrgUnitGroups, [enrichedModule]));
                    }
                };

                var associateMandatoryDatasetsToModule = function() {
                    var datasetIds = [dataSets.populationDatasetId];

                    if(!$scope.referralLocationDisabled) {
                        datasetIds = datasetIds.concat(dataSets.referralDatasetId);
                    }
                    if($scope.geographicOriginDisabled) {
                        datasetIds = datasetIds.concat(dataSets.summaryDatasetId);
                    }

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
                    .then(getDataSets)
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
                var allDataElementsWithOptions = _.chain($scope.enrichedProgram.programStages)
                    .map('programStageSections')
                    .flatten()
                    .map('dataElementsWithOptions')
                    .flatten()
                    .map('dataElement')
                    .value();
                var optionNotSelected = _.any(allDataElementsWithOptions, function (dataElement) {
                    return _.filter(dataElement.optionSet.options, "isSelected").length < 2;
                });
                return _.isEmpty($scope.program.name) || optionNotSelected;
            };

            $scope.areTwoOptionsSelected = function (dataElement) {
                return dataElement.dataElement.optionSet && _.filter(dataElement.dataElement.optionSet.options, {isSelected: true}).length >= 2;
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

            $scope.unSelectAll = function (dataElement) {
                $scope.form.$setDirty();
                _.each(dataElement.dataElement.optionSet.options, function (option) {
                    option.isSelected = false;
                });
            };

            $scope.selectAll = function (dataElement) {
                $scope.form.$setDirty();
                _.each(dataElement.dataElement.optionSet.options, function (option) {
                    option.isSelected = true;
                });
            };

            $scope.allOptionsSelected = function (dataElement) {
                return !_.any(dataElement.dataElement.optionSet && dataElement.dataElement.optionSet.options, {"isSelected": false});
            };

            init();
        };
    });
