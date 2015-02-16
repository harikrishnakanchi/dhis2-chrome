define(["lodash", "orgUnitMapper", "moment", "systemSettingsTransformer", "programTransformer", "md5"], function(_, orgUnitMapper, moment, systemSettingsTransformer, programTransformer, md5) {
    return function($scope, $hustle, orgUnitRepository, systemSettingRepository, db, $location, $q, $modal, programRepository, orgUnitGroupRepository, orgUnitGroupHelper) {
        $scope.module = {};
        $scope.isExpanded = {};
        $scope.isDisabled = false;
        $scope.thisDate = (moment().add(1, 'day')).toDate();
        $scope.allModules = [];
        $scope.collapseSection = {};
        $scope.excludedDataElements = [];
        $scope.allPrograms = [];
        $scope.program = {};
        $scope.enrichedProgram = {};
        $scope.thisDate = moment().toDate();

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
                return systemSettingRepository.getAllWithProjectId($scope.module.parent.id).then(function(systemSettings) {
                    if (!_.isEmpty(systemSettings))
                        $scope.excludedDataElements = systemSettings.value.excludedDataElements[$scope.module.id];
                });
            };

            var getProgram = function() {
                return programRepository.getProgramForOrgUnit($scope.module.id).then(function(prg) {
                    if (_.isEmpty(prg)) {
                        $scope.program = {
                            "name": ""
                        };
                    } else {
                        $scope.program = prg;
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
                $scope.isDisabled = isDisabled && isDisabled.value;
                $scope.updateDisabled = $scope.isDisabled;
            };

            var setPrograms = function(data) {
                $scope.allPrograms = data[0];
            };

            var getPrograms = function() {
                return $q.all([programRepository.getAll()]);
            };

            initModule().then(getPrograms).then(setPrograms).then(getAllModules).then(getExcludedDataElements).then(getProgram).then(setUpModule);
        };

        $scope.changeCollapsed = function(sectionId) {
            $scope.collapseSection[sectionId] = !$scope.collapseSection[sectionId];
        };

        $scope.getCollapsed = function(sectionId) {
            return $scope.collapseSection[sectionId];
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

        var createModule = function(module) {
            var parent = module.parent;
            var enrichedModule = orgUnitMapper.mapToModule(module);
            return $q.all([orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit")])
                .then(function() {
                    return enrichedModule;
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

        $scope.update = function(module) {
            var onSuccess = function() {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(enrichedModule, "savedModule");
            };

            var enrichedModule = orgUnitMapper.mapToModule(module, module.id, 6);

            return $q.all([saveSystemSettingsForExcludedDataElements(module.parent, enrichedModule), orgUnitRepository.upsert(enrichedModule), publishMessage(enrichedModule, "upsertOrgUnit")])
                .then(onSuccess, $scope.onError);
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

        $scope.disable = function(module) {
            showModal(_.bind(disableModule, {}, module), $scope.resourceBundle.disableOrgUnitConfirmationMessage);
        };

        $scope.onError = function(data) {
            $scope.saveFailure = true;
        };

        var associatePrograms = function(program, enrichedModule) {
            var orgUnit = {
                id: enrichedModule.id,
                name: enrichedModule.name
            };
            program.organisationUnits = program.organisationUnits.concat(orgUnit);
            return programRepository.upsert(program).then(function() {
                publishMessage(program, "uploadProgram");
            }).then(function() {
                return enrichedModule;
            });
        };

        var saveSystemSettingsForExcludedDataElements = function(parent, enrichedModule) {
            var saveSystemSettings = function(excludedDataElements, opunitId) {
                return systemSettingRepository.getAllWithProjectId(opunitId).then(function(data) {
                    var existingSystemSettings = (_.isEmpty(data) || _.isEmpty(data.value) || _.isEmpty(data.value.excludedDataElements)) ? {} : data.value.excludedDataElements;
                    var systemSettingsPayload = _.cloneDeep(existingSystemSettings);
                    systemSettingsPayload[enrichedModule.id] = excludedDataElements;
                    var systemSettings = {
                        'excludedDataElements': systemSettingsPayload
                    };
                    var payload = {
                        "projectId": opunitId,
                        "settings": systemSettings
                    };

                    var oldIndexedDbSystemSettings = (_.isEmpty(data)) ? {
                        'excludedDataElements': {}
                    } : data.value;

                    return systemSettingRepository.upsert(payload).then(function() {
                        var hustlePayload = _.cloneDeep(payload);
                        hustlePayload.indexedDbOldSystemSettings = oldIndexedDbSystemSettings;
                        return publishMessage(hustlePayload, "excludeDataElements").then(function() {
                            return;
                        });
                    });
                });
            };
            var excludedDataElements = systemSettingsTransformer.excludedDataElementsForLinelistModule($scope.enrichedProgram);
            return saveSystemSettings(excludedDataElements, parent.id).then(function() {
                return enrichedModule;
            });
        };

        $scope.save = function(module) {
            var onSuccess = function(enrichedModule) {
                $scope.saveFailure = false;
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(enrichedModule, "savedModule");
                return [$scope.module];
            };

            var createOrgUnitGroups = function(enrichedModule) {
                return orgUnitGroupHelper.createOrgUnitGroups([enrichedModule], false).then(function() {
                    return enrichedModule;
                });
            };

            createModule(module).then(_.curry(associatePrograms)($scope.program))
                .then(_.curry(saveSystemSettingsForExcludedDataElements)(module.parent))
                .then(createOrgUnitGroups)
                .then(onSuccess, $scope.onError);
        };

        $scope.shouldDisableSaveOrUpdateButton = function() {
            return _.isEmpty($scope.program.name);
        };

        $scope.isAfterMaxDate = function() {
            return moment($scope.module.openingDate).isAfter(moment($scope.thisDate));
        };

        init();
    };
});
