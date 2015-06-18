define(["lodash", "moment", "dhisId", "dateUtils", "properties"], function(_, moment, dhisId, dateUtils, properties) {
    return function($scope, $routeParams, $location, programEventRepository, optionSetRepository, orgUnitRepository, systemSettingRepository, programRepository) {

        var resetForm = function() {
            $scope.form = $scope.form || {};
            $scope.numberPattern = "^[1-9][0-9]*$";
            $scope.dataValues = {};
            $scope.patientOrigin = {};
            $scope.isNewMode = true;
            if ($scope.form && $scope.form.eventDataEntryForm) {
                $scope.form.eventDataEntryForm.$setPristine();
            }
            $scope.minEventDate = dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync);
            $scope.maxEventDate = moment().format("YYYY-MM-DD");
            $scope.$broadcast('angucomplete-alt:clearInput');
        };

        var getDataValuesAndEventDate = function() {
            var programStage = $scope.program.programStages[0];
            var eventDate = null;
            var compulsoryFieldsPresent = true;

            var formatValue = function(value) {
                if (_.isObject(value) && value.originalObject)
                    return value.originalObject.code;
                if (_.isObject(value) && value.code)
                    return value.code;
                if (_.isDate(value))
                    return moment(value).format("YYYY-MM-DD");
                return value;
            };

            var dataValuesList = _.flatten(_.map(programStage.programStageSections, function(sections) {
                return _.map(sections.programStageDataElements, function(psde) {
                    var value = formatValue($scope.dataValues[psde.dataElement.id]);

                    if ($scope.isEventDateSubstitute(psde.dataElement)) {
                        eventDate = value;
                    }
                    if (psde.compulsory) {
                        if (psde.dataElement.type === "int") {
                            compulsoryFieldsPresent = isNaN(value) || value === null ? false : compulsoryFieldsPresent;
                        } else if (_.isEmpty(value))
                            compulsoryFieldsPresent = false;
                    }

                    return ({
                        "dataElement": psde.dataElement.id,
                        "value": value
                    });
                });
            }));

            return {
                dataValues: dataValuesList,
                eventDate: eventDate,
                compulsoryFieldsPresent: compulsoryFieldsPresent
            };
        };

        $scope.loadEventsView = function() {
            $location.path("/line-list-summary/" + $scope.selectedModuleId);
        }

        $scope.isEventDateSubstitute = function(dataElement) {
            var attr = _.find(dataElement.attributeValues, function(attributeValue) {
                return attributeValue.attribute.code === "useAsEventDate";
            });
            return attr && attr.value === "true";
        };

        $scope.update = function() {
            var dataValuesAndEventDate = getDataValuesAndEventDate();
            $scope.event.orgUnit = $scope.patientOrigin.selected.id;
            $scope.event.eventDate = dataValuesAndEventDate.eventDate;
            $scope.event.localStatus = dataValuesAndEventDate.compulsoryFieldsPresent ? "UPDATED_DRAFT" : "UPDATED_INCOMPLETE_DRAFT";
            $scope.event.dataValues = dataValuesAndEventDate.dataValues;

            programEventRepository.upsert($scope.event).then(function() {
                $location.path("/line-list-summary/" + $scope.selectedModuleId).search({
                    'messageType': 'success',
                    "message": $scope.resourceBundle.eventSaveSuccess
                });

            });
        };

        $scope.save = function(addAnother) {

            var dataValuesAndEventDate = getDataValuesAndEventDate();

            $scope.event = {
                "event": dhisId.get($scope.program.id + $scope.program.programStages[0].id + $scope.selectedModuleId + moment().format()),
                "program": $scope.program.id,
                "programStage": $scope.program.programStages[0].id,
                "orgUnit": $scope.patientOrigin.selected.id,
                "eventDate": dataValuesAndEventDate.eventDate,
                "localStatus": dataValuesAndEventDate.compulsoryFieldsPresent ? "NEW_DRAFT" : "NEW_INCOMPLETE_DRAFT",
                "dataValues": dataValuesAndEventDate.dataValues
            };

            programEventRepository.upsert($scope.event).then(function() {
                if (addAnother)
                    resetForm();
                else {
                    $location.path("/line-list-summary/" + $scope.selectedModuleId).search({
                        'messageType': 'success',
                        "message": $scope.resourceBundle.eventSaveSuccess
                    });

                }
            });
        };

        var init = function() {
            var allDataElementsMap = {};
            var loadModule = function() {
                return orgUnitRepository.get($routeParams.module).then(function(module) {
                    $scope.selectedModuleId = module.id;
                    $scope.selectedModuleName = module.name;
                });
            };

            var loadOriginOrgUnits = function() {
                return orgUnitRepository.findAllByParent($scope.selectedModuleId).then(function(originOrgUnits) {
                    $scope.originOrgUnits = originOrgUnits;
                });
            };

            var loadPrograms = function() {
                var getExcludedDataElementsForModule = function() {
                    return systemSettingRepository.get($scope.selectedModuleId).then(function(data) {
                        return data && data.value ? data.value.dataElements : [];
                    });
                };

                var getProgram = function(excludedDataElements) {
                    return programRepository.getProgramForOrgUnit($scope.originOrgUnits[0].id).then(function(program) {
                        return programRepository.get(program.id, excludedDataElements).then(function(program) {
                            $scope.program = program;
                        });
                    });
                };

                return getExcludedDataElementsForModule().then(getProgram);
            };

            var loadAllDataElements = function() {
                if ($scope.program && $scope.program.programStages)
                    allDataElementsMap = _.indexBy(_.pluck(_.flatten(_.pluck(_.flatten(_.pluck($scope.program.programStages, "programStageSections")), "programStageDataElements")), "dataElement"), "id");
            };

            var loadOptionSets = function() {
                return optionSetRepository.getOptionSetMapping($scope.resourceBundle).then(function(data) {
                    $scope.optionSetMapping = data.optionSetMap;
                });
            };

            var loadEvent = function() {
                var formatValue = function(dv) {

                    var de = allDataElementsMap[dv.dataElement];
                    if (de && de.optionSet) {
                        return _.find($scope.optionSetMapping[de.optionSet.id], function(optionSet) {
                            return optionSet.code === dv.value;
                        });
                    }

                    if (dv.type === "date") {
                        if (dv.value)
                            dv.value = dv.value.replace(/-/g, ',');
                        return new Date(dv.value);
                    }

                    if (dv.type === "int") {
                        return parseInt(dv.value);
                    }

                    return dv.value;
                };
                if ($routeParams.eventId) {
                    programEventRepository.findEventById($scope.program.id, $routeParams.eventId).then(function(events) {
                        $scope.event = events[0];
                        $scope.isNewMode = false;
                        $scope.patientOrigin.selected = _.find($scope.originOrgUnits, function(originOrgUnit) {
                            return originOrgUnit.id === $scope.event.orgUnit;
                        });

                        _.forEach($scope.event.dataValues, function(dv) {
                            $scope.dataValues[dv.dataElement] = formatValue(dv);
                        });
                    });
                }
            };

            $scope.loading = true;
            resetForm();
            loadModule()
                .then(loadOriginOrgUnits)
                .then(loadPrograms)
                .then(loadAllDataElements)
                .then(loadOptionSets)
                .then(loadEvent)
                .finally(function() {
                    $scope.loading = false;
                });
        };

        init();
    };
});
