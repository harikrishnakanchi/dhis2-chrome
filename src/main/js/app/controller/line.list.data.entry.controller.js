define(["lodash", "moment", "dhisId", "dateUtils", "properties"], function(_, moment, dhisId, dateUtils, properties) {
    return function($scope, $rootScope, $routeParams, $location, $anchorScroll, programEventRepository, optionSetRepository, orgUnitRepository, excludedDataElementsRepository, programRepository) {

        var resetForm = function() {
            $scope.form = $scope.form || {};
            $scope.numberPattern = "^[1-9][0-9]*$";
            $scope.dataValues = {};
            $scope.patientOrigin = {};
            $scope.isNewMode = true;
            if ($scope.eventDataEntryForm) {
                $scope.eventDataEntryForm.$setPristine();
            }
            $scope.$broadcast('angucomplete-alt:clearInput');
        };

        var setEventMinAndMaxDate = function() {
            $scope.minEventDate = dateUtils.max([dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync), $scope.selectedModuleOpeningDate]).startOf('day').toISOString();
            $scope.maxEventDate = moment().endOf('day').toISOString();
        };

        var getDataValuesAndEventDate = function() {
            var programStage = $scope.program.programStages[0];
            var eventDate = null;
            var compulsoryFieldsPresent = true;

            var formatValue = function(value, type) {
                if (_.isObject(value) && value.originalObject)
                    return value.originalObject.code;
                if (_.isObject(value) && value.code)
                    return value.code;
                if (value && type === "date")
                    return moment(value).format("YYYY-MM-DD");
                if (value && type === "datetime")
                    return moment(value).toISOString();
                return value;
            };

            var dataValuesList = _.flatten(_.map(programStage.programStageSections, function(sections) {
                return _.map(sections.programStageDataElements, function(psde) {
                    var value = formatValue($scope.dataValues[psde.dataElement.id], psde.dataElement.type);

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

        $scope.setCurrentDate = function(dataElementId) {
            $scope.dataValues[dataElementId] = moment().set('millisecond', 0).set('second', 0).toDate();
        };

        $scope.loadEventsView = function() {
            $location.path($routeParams.returnTo);
        };

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
                $location.path($routeParams.returnTo).search({
                    'messageType': 'success',
                    "message": $scope.resourceBundle.eventSaveSuccess
                });

            });
        };

        var scrollToTop = function(eventId) {
            $location.hash('top');
            $anchorScroll();
        };

        $scope.save = function(addAnother) {

            var dataValuesAndEventDate = getDataValuesAndEventDate();
            var eventId = dhisId.get($scope.program.id + $scope.program.programStages[0].id + $scope.selectedModuleId + moment().format());
            $scope.event = {
                "event": eventId,
                "program": $scope.program.id,
                "programStage": $scope.program.programStages[0].id,
                "orgUnit": $scope.patientOrigin.selected.id,
                "eventDate": dataValuesAndEventDate.eventDate,
                "localStatus": dataValuesAndEventDate.compulsoryFieldsPresent ? "NEW_DRAFT" : "NEW_INCOMPLETE_DRAFT",
                "dataValues": dataValuesAndEventDate.dataValues
            };

            programEventRepository.upsert($scope.event).then(function() {
                if (addAnother) {
                    resetForm();
                    setEventMinAndMaxDate();
                    scrollToTop(eventId);
                } else {
                    $location.path($routeParams.returnTo).search({
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
                    $scope.selectedModuleOpeningDate = module.openingDate;
                    $scope.selectedModuleId = module.id;
                    $scope.selectedModuleName = module.name;
                    $scope.opUnitId = module.parent.id;
                });
            };

            var loadOriginOrgUnits = function() {
                return orgUnitRepository.findAllByParent($scope.selectedModuleId).then(function(originOrgUnits) {
                    $scope.originOrgUnits = originOrgUnits;
                });
            };

            var loadPrograms = function() {
                var getExcludedDataElementsForModule = function() {
                    return excludedDataElementsRepository.get($scope.selectedModuleId).then(function(excludedDataElements) {
                        return excludedDataElements ? _.pluck(excludedDataElements.dataElements, "id") : [];
                    });
                };

                var setIncludedSectionFlag = function() {
                    _.each($scope.program.programStages, function(stage) {
                        _.each(stage.programStageSections, function(section) {
                            section.isIncluded = false;
                            _.each(section.programStageDataElements, function(sde) {
                                section.isIncluded = section.isIncluded || sde.dataElement.isIncluded;
                            });
                        });
                    });

                };

                var getProgram = function(excludedDataElements) {
                    return programRepository.getProgramForOrgUnit($scope.originOrgUnits[0].id).then(function(program) {
                        return programRepository.get(program.id, excludedDataElements).then(function(program) {
                            $scope.program = program;
                        });
                    });
                };

                return getExcludedDataElementsForModule().then(getProgram).then(setIncludedSectionFlag);
            };

            var loadAllDataElements = function() {
                if ($scope.program && $scope.program.programStages)
                    allDataElementsMap = _.indexBy(_.pluck(_.flatten(_.pluck(_.flatten(_.pluck($scope.program.programStages, "programStageSections")), "programStageDataElements")), "dataElement"), "id");
            };

            var loadOptionSets = function() {
                var isNewCase = $routeParams.eventId ? false : true;
                return optionSetRepository.getOptionSetMapping($scope.resourceBundle, $scope.opUnitId, isNewCase).then(function(data) {
                    $scope.optionSetMapping = data.optionSetMap;
                });
            };

            var loadEvent = function() {
                var formatValue = function(dv) {

                    var filterOptions = function() {
                        $scope.optionSetMapping[de.optionSet.id] = _.filter($scope.optionSetMapping[de.optionSet.id], {
                            "isDisabled": false
                        });
                    };

                    var de = allDataElementsMap[dv.dataElement];
                    if (de && de.optionSet) {
                        return _.find($scope.optionSetMapping[de.optionSet.id], function(optionSet) {
                            if (_.endsWith(de.optionSet.code, "_referralLocations")) {
                                filterOptions();
                                if (!_.contains($scope.optionSetMapping[de.optionSet.id], optionSet))
                                    $scope.optionSetMapping[de.optionSet.id].push(optionSet);
                            }
                            return optionSet.code === dv.value;
                        });
                    }

                    if (dv.type === "date" || dv.type === "datetime") {
                        return new Date(dv.value);
                    }

                    if (dv.type === "int") {
                        return parseInt(dv.value);
                    }

                    return dv.value;
                };
                if ($routeParams.eventId) {
                    return programEventRepository.findEventById($scope.program.id, $routeParams.eventId).then(function(events) {
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
                .then(setEventMinAndMaxDate)
                .finally(function() {
                    $scope.loading = false;
                });
        };

        init();
    };
});
