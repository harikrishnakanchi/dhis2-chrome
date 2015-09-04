define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer"],
    function(_, orgUnitMapper, moment, systemSettingsTransformer) {
        return function($scope, $hustle, orgUnitRepository, excludedDataElementsRepository, $q, $modal,
            programRepository, orgUnitGroupHelper, datasetRepository, originOrgunitCreator) {

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
                    if (!$scope.module.id)
                        return;
                    return excludedDataElementsRepository.get($scope.module.id).then(function(excludedDataElementsSetting) {
                        $scope.excludedDataElements = excludedDataElementsSetting ? _.pluck(excludedDataElementsSetting.dataElements, "id") : undefined;
                    });
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
                    return programRepository.get(progId, $scope.excludedDataElements).then(function(data) {
                        $scope.enrichedProgram = data;
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

                var setPrograms = function(data) {
                    $scope.allPrograms = _.sortBy(data[0], function(program) {
                        return program.name;
                    });
                };

                var getPrograms = function() {
                    return $q.all([programRepository.getAll()]);
                };

                initModule().then(getPrograms).then(setPrograms).then(getAllModules).then(getExcludedDataElements).then(getAssociatedProgram).then(setUpModule);
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
                    "locale": $scope.currentUser.locale,
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

                var associateToProgram = function(program, originOrgUnits) {
                    return programRepository.associateOrgUnits(program, originOrgUnits).then(function() {
                        publishMessage(program, "uploadProgram", $scope.resourceBundle.uploadProgramDesc + _.pluck(originOrgUnits, "name"));
                    });
                };

                var associateToDatasets = function(originOrgUnits) {

                    return datasetRepository.getAll().then(function(allDatasets) {

                        var originDatasetIds = _.pluck(_.filter(allDatasets, "isOriginDataset"), "id");

                        var summaryDatasetId = _.find($scope.program.attributeValues, {
                            "attribute": {
                                "code": "associatedDataSet"
                            }
                        }).value;

                        var datasetIds = _.flattenDeep([summaryDatasetId, originDatasetIds]);

                        return datasetRepository.associateOrgUnits(datasetIds, originOrgUnits).then(function() {
                            return publishMessage(datasetIds, "associateOrgUnitToDataset",
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

                $scope.loading = true;
                return getEnrichedModule($scope.module)
                    .then(createModule)
                    .then(_.partial(saveExcludedDataElements, enrichedModule))
                    .then(createOriginOrgUnitsAndGroups)
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

            init();
        };
    });
