define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "programTransformer", "md5"], function(_, orgUnitMapper, moment, systemSettingsTransformer, programTransformer, md5) {
    return function($scope, $hustle, orgUnitRepository, systemSettingRepository, db, $location, $q, $modal, programRepository, orgUnitGroupRepository, orgUnitGroupHelper, datasetRepository, patientOriginRepository) {
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
                return systemSettingRepository.get($scope.module.id).then(function(systemSettings) {
                    if (!_.isEmpty(systemSettings) && !_.isEmpty(systemSettings.value))
                        $scope.excludedDataElements = systemSettings.value.dataElements;
                });
            };

            var getAssociatedProgram = function() {
                return programRepository.getProgramForOrgUnit($scope.module.id).then(function(prg) {
                    if (_.isEmpty(prg)) {
                        $scope.program = {
                            "name": ""
                        };
                    } else {
                        $scope.program = _.find($scope.allPrograms, function(p) {
                            return p.id == prg.id;
                        });
                        $scope.getEnrichedProgram(prg.id);
                    }
                });
            };

            $scope.getEnrichedProgram = function(progId) {
                return programRepository.get(progId, $scope.excludedDataElements).then(function(data) {
                    $scope.enrichedProgram = data;
                    resetCollapse();
                });
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
                $scope.allPrograms = data[0];
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

        var publishMessage = function(data, action) {
            return $hustle.publish({
                "data": data,
                "type": action
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
            $q.all([orgUnitRepository.upsert(payload), publishMessage(payload, "upsertOrgUnit")]).then(function() {
                if ($scope.$parent.closeNewForm) {
                    $scope.$parent.closeNewForm(module, "disabledModule");
                }
            });
        };

        var showModal = function(okCallback, message) {
            $scope.modalMessage = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        $scope.disable = function(module) {
            showModal(_.bind(disableModule, {}, module), $scope.resourceBundle.disableOrgUnitConfirmationMessage);
        };

        var onError = function() {
            $scope.saveFailure = true;
        };

        var onSuccess = function(enrichedModule) {
            $scope.saveFailure = false;
            if ($scope.$parent.closeNewForm)
                $scope.$parent.closeNewForm(enrichedModule, "savedModule");
            return enrichedModule;
        };

        var saveExcludedDataElements = function(enrichedModule) {
            var excludedDataElements = systemSettingsTransformer.excludedDataElementsForLinelistModule($scope.enrichedProgram);
            var systemSetting = {
                key: enrichedModule.id,
                value: {
                    clientLastUpdated: moment().toISOString(),
                    dataElements: excludedDataElements
                }
            };
            return systemSettingRepository.upsert(systemSetting).
            then(_.partial(publishMessage, systemSetting, "uploadSystemSetting"));
        };

        $scope.save = function(module) {
            var enrichedModule = {};

            var associatePrograms = function(program, originOrgUnits) {
                _.forEach(originOrgUnits, function(originOrgUnit) {
                    var orgUnit = {
                        id: originOrgUnit.id,
                        name: originOrgUnit.name
                    };
                    program.organisationUnits = program.organisationUnits || [];
                    program.organisationUnits = program.organisationUnits.concat(orgUnit);
                });

                return programRepository.upsert(program).then(function() {
                    publishMessage(program, "uploadProgram");
                });
            };

            var addOrgUnitsToDatasets = function(orgUnits, datasets) {
                datasets = _.isArray(datasets) ? datasets : [datasets];
                var ouPayloadToAssociate = _.map(orgUnits, function(orgUnit) {
                    return {
                        "id": orgUnit.id,
                        "name": orgUnit.name
                    };
                });

                return _.map(datasets, function(ds) {
                    ds.organisationUnits = ds.organisationUnits || [];
                    ds.organisationUnits = ds.organisationUnits.concat(ouPayloadToAssociate);
                    return ds;
                });
            };

            var updateDatasets = function(datasets) {
                return $q.all([datasetRepository.upsert(datasets), publishMessage(_.pluck(datasets, "id"), "associateOrgUnitToDataset")]);
            };

            var associateDatasetsToOrigins = function(originOrgUnits) {
                var getOriginDatasetsPromise = datasetRepository.getOriginDatasets();
                var getSummaryDatasetsPromise = datasetRepository.getDataSetAssociatedWithProgram($scope.program.attributeValues);

                var datasets = $q.all([getOriginDatasetsPromise, getSummaryDatasetsPromise]);

                datasets.then(function(datasetsToAssociate) {
                    datasetsToAssociate = _.flatten(datasetsToAssociate);
                    var datasets = addOrgUnitsToDatasets(originOrgUnits, datasetsToAssociate);
                    return updateDatasets(datasets);
                });

            };

            var getEnrichedModule = function(module) {
                enrichedModule = orgUnitMapper.mapToModule(module);
                return $q.when(enrichedModule);
            };

            var createModule = function() {
                return $q.all([orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit")]);
            };


            var createOriginOrgUnitsAndGroups = function() {
                var createOrgUnitGroups = function(originsPayload) {
                    return orgUnitGroupHelper.createOrgUnitGroups(originsPayload, false);
                };

                var getPatientOriginOUPayload = function() {
                    return orgUnitRepository.get(enrichedModule.parent.id).then(function(parentOpUnit) {
                        return patientOriginRepository.get(parentOpUnit.id).then(function(patientOrigins) {
                            if (!_.isEmpty(patientOrigins))
                                return orgUnitMapper.createPatientOriginPayload(patientOrigins.origins, enrichedModule);
                        });
                    });
                };

                return getPatientOriginOUPayload().then(function(patientOriginOUPayload) {
                    if (!_.isEmpty(patientOriginOUPayload)) {
                        return orgUnitRepository.upsert(patientOriginOUPayload)
                            .then(_.partial(publishMessage, patientOriginOUPayload, "upsertOrgUnit"))
                            .then(_.partial(associatePrograms, $scope.program, patientOriginOUPayload))
                            .then(_.partial(associateDatasetsToOrigins, patientOriginOUPayload))
                            .then(_.partial(createOrgUnitGroups, patientOriginOUPayload));
                    }
                });
            };

            return getEnrichedModule($scope.module)
                .then(createModule)
                .then(_.partial(saveExcludedDataElements, enrichedModule))
                .then(createOriginOrgUnitsAndGroups)
                .then(_.partial(onSuccess, enrichedModule), onError);
        };

        $scope.update = function(module) {
            var enrichedModule = orgUnitMapper.mapToModule(module, module.id, 6);

            return $q.all([saveExcludedDataElements(enrichedModule), orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit")])
                .then(_.partial(onSuccess, enrichedModule), onError);
        };

        $scope.shouldDisableSaveOrUpdateButton = function() {
            return _.isEmpty($scope.program.name);
        };

        init();
    };
});