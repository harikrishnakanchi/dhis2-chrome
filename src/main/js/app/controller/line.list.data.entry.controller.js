define(["lodash", "moment", "dhisId", "dateUtils", "properties", "dataElementUtils", "customAttributes"], function(_, moment, dhisId, dateUtils, properties, dataElementUtils, customAttributes) {
    return function($scope, $rootScope, $routeParams, $route, historyService, programEventRepository, optionSetRepository, orgUnitRepository, excludedDataElementsRepository, programRepository, translationsService) {

        var resetForm = function() {
            $scope.form = $scope.form || {};
            $scope.dataValues = {};
            $scope.isNewMode = true;
            $scope.orgUnitAssociatedToEvent = {};
            if ($scope.eventDataEntryForm) {
                $scope.eventDataEntryForm.$setPristine();
            }
            $scope.$broadcast('angucomplete-alt:clearInput');
        };

        var setEventMinAndMaxDate = function() {
            $scope.minEventDate = dateUtils.max([dateUtils.subtractWeeks(properties.projectDataSync.numWeeksToSync), $scope.selectedModuleOpeningDate]).startOf('day').toISOString();
            $scope.maxEventDate = moment().endOf('day').toISOString();
        };

        $scope.getNumberPattern = function(dataElement) {
            var isPediatricAgeDataElement = customAttributes.getBooleanAttributeValue(dataElement.attributeValues, customAttributes.PEDIATRIC_AGE_FIELD_CODE);
            if(isPediatricAgeDataElement)
                return '^((0.5)|[1-9][0-9]?)$';
            else
                return '^[1-9][0-9]?$';
        };

        var getDataValuesAndEventDate = function() {
            var programStage = $scope.program.programStages[0];
            var eventDate = null;
            var compulsoryFieldsPresent = true;

            var formatValue = function(value, valueType) {
                if (_.isObject(value) && value.originalObject)
                    return value.originalObject.code;
                if (_.isObject(value) && value.code)
                    return value.code;
                if (value && valueType === "DATE")
                    return moment.utc(new Date(value)).format("YYYY-MM-DD");
                if (value && valueType === "DATETIME")
                    return moment.utc(new Date(value)).toISOString();
                return value;
            };

            var dataValuesList = _.flatten(_.map(programStage.programStageSections, function(sections) {

                return _.map(sections.programStageDataElements, function(psde) {
                    var dataElementValueType = psde.dataElement.valueType;
                    var value = formatValue($scope.dataValues[psde.dataElement.id], dataElementValueType);

                    if ($scope.isEventDateSubstitute(psde.dataElement)) {
                        eventDate = value;
                    }
                    if (psde.compulsory) {
                        if (dataElementValueType == "NUMBER" || dataElementValueType == "INTEGER_ZERO_OR_POSITIVE") {
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
            historyService.back();
        };

        $scope.isEventDateSubstitute = function(dataElement) {
            return customAttributes.getBooleanAttributeValue(dataElement.attributeValues, customAttributes.EVENT_DATE);
        };

        $scope.isReferralLocationPresent = function(dataElement) {
            return !(_.eq(dataElement.offlineSummaryType, "referralLocations") && _.isEmpty(_.get($scope.dataElementOptions, dataElement.id)));
        };

        $scope.update = function() {
            var dataValuesAndEventDate = getDataValuesAndEventDate();
            $scope.event.orgUnit = $scope.orgUnitAssociatedToEvent.selected.id;
            $scope.event.eventDate = dataValuesAndEventDate.eventDate;
            $scope.event.localStatus = dataValuesAndEventDate.compulsoryFieldsPresent ? "UPDATED_DRAFT" : "UPDATED_INCOMPLETE_DRAFT";
            $scope.event.dataValues = dataValuesAndEventDate.dataValues;

            programEventRepository.upsert($scope.event).then(function() {
                historyService.back({
                    'messageType': 'success',
                    "message": $scope.resourceBundle.eventSaveSuccess
                });

            });
        };

        $scope.save = function(addAnother) {

            var dataValuesAndEventDate = getDataValuesAndEventDate();
            var eventId = dhisId.get($scope.program.id + $scope.program.programStages[0].id + $scope.selectedModuleId + moment().format());
            var orgUnit = $scope.orgUnitAssociatedToEvent.selected || $scope.selectedModule;
            $scope.event = {
                "event": eventId,
                "program": $scope.program.id,
                "programStage": $scope.program.programStages[0].id,
                "orgUnit": orgUnit.id,
                "orgUnitName": orgUnit.name,
                "eventDate": dataValuesAndEventDate.eventDate,
                "localStatus": dataValuesAndEventDate.compulsoryFieldsPresent ? "NEW_DRAFT" : "NEW_INCOMPLETE_DRAFT",
                "dataValues": dataValuesAndEventDate.dataValues
            };

            programEventRepository.upsert($scope.event).then(function() {
                if (addAnother) {
                    $route.reload();
                } else {
                    historyService.back({
                        'messageType': 'success',
                        "message": $scope.resourceBundle.eventSaveSuccess
                    });

                }
            });
        };

        $scope.getDisplayName = dataElementUtils.getDisplayName;

        var init = function() {
            var allDataElementsMap = {};
            var loadModule = function() {
                return orgUnitRepository.get($routeParams.module).then(function(module) {
                    $scope.selectedModuleOpeningDate = module.openingDate;
                    $scope.selectedModuleId = module.id;
                    $scope.selectedModuleName = module.name;
                    $scope.opUnitId = module.parent.id;
                    $scope.selectedModule = module;
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
                    var getProgramFromOrgUnit = function () {
                        var orgUnitAssociatedToProgram = _.get($scope.originOrgUnits[0], 'id') || $scope.selectedModuleId;
                        return programRepository.getProgramForOrgUnit(orgUnitAssociatedToProgram);
                    };

                    return getProgramFromOrgUnit().then(function(program) {
                        return programRepository.get(program.id, excludedDataElements).then(function(program) {
                            $scope.program = translationsService.translate(program);
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
                return optionSetRepository.getOptionSets($scope.opUnitId, $scope.selectedModuleId);
            };

            var loadEvent = function() {
                var formatValue = function(dv) {

                    var de = allDataElementsMap[dv.dataElement];
                    if (de && de.optionSet) {
                        var option =_.find($scope.dataElementOptions[de.id], function(option) {
                            return option.code === dv.value;
                        });

                        if (!_.isUndefined(option) && !_.isUndefined(option.isDisabled) && option.isDisabled) {
                            option.isDisabled = false;
                        }

                        return option;
                    }

                    if (dv.valueType === "DATE" || dv.valueType === "DATETIME")
                        return dv.value && new Date(dv.value);

                    if (dv.valueType === 'NUMBER')
                        return parseFloat(dv.value);

                    return dv.value;
                };
                if ($routeParams.eventId) {
                    return programEventRepository.findEventById($scope.program.id, $routeParams.eventId).then(function(events) {
                        $scope.event = events[0];
                        $scope.isNewMode = false;
                        var orgUnits = $scope.originOrgUnits.concat($scope.selectedModule);
                        $scope.orgUnitAssociatedToEvent.selected = _.find(orgUnits, function(originOrgUnit) {
                            return originOrgUnit.id === $scope.event.orgUnit;
                        });

                        _.forEach($scope.event.dataValues, function(dv) {
                            $scope.dataValues[dv.dataElement] = formatValue(dv);
                        });

                        $scope.isHistoricalEvent = $scope.event && $scope.event.eventDate ? moment($scope.event.eventDate).isBefore($scope.minEventDate): false;
                    });
                }
            };

            var translateOptionSets = function (optionSets) {
                var partitionedDataset = _.partition(optionSets, 'isReferralLocationOptionSet');
                var translatedOptionSets = translationsService.translate(partitionedDataset[1]);
                return translatedOptionSets.concat(partitionedDataset[0]);
            };

            var setDataElementOptions = function (translatedOptionSets) {
                $scope.dataElementOptions = {};
                var dataElementsWithOptions = _.filter(allDataElementsMap, 'optionSet');
                var indexedOptionSets = _.indexBy(translatedOptionSets, 'id');
                _.forEach(dataElementsWithOptions, function (dataElement) {
                    var optionSet = indexedOptionSets[dataElement.optionSet.id];
                    var options = (optionSet && optionSet.options) || [];
                    options = _.filter(options, function (option) {
                        return option && option.name;
                    });
                    $scope.dataElementOptions[dataElement.id] = options;
                });
            };

            var filterDisabledOptions = function () {
                _.forEach($scope.dataElementOptions, function (options, dataElement) {
                    $scope.dataElementOptions[dataElement] = _.filter(options, {'isDisabled': false});
                });
            };



            $rootScope.startLoading();
            resetForm();
            loadModule()
                .then(setEventMinAndMaxDate)
                .then(loadOriginOrgUnits)
                .then(loadPrograms)
                .then(loadAllDataElements)
                .then(loadOptionSets)
                .then(translateOptionSets)
                .then(setDataElementOptions)
                .then(loadEvent)
                .then(filterDisabledOptions)
                .finally($rootScope.stopLoading);
        };
        init();
    };
});