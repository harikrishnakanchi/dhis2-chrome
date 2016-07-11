define(["lodash", "moment"], function(_, moment) {
    return function($scope, $q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository, datasetRepository, referralLocationsRepository, excludedDataElementsRepository, translationsService) {

        $scope.isGenderFilterApplied = false;
        $scope.isAgeFilterApplied = false;
        $scope.origins = {
            'open': true
        };
        var groupedProcedureDataValues, groupedDataValues;

        $scope.getCount = function(dataElementId, isGenderFilterApplied, isAgeFilterApplied, optionId, genderFilterId, ageFilter) {
            var count;

            if (_.isUndefined(groupedDataValues[optionId]))
                return 0;

            var applyGenderFilter = function() {
                if (_.isUndefined(groupedDataValues[genderFilterId]))
                    return [];
                var genderDataElement = _.keys(groupedDataValues[genderFilterId]);

                return _.intersection(_.pluck(groupedDataValues[optionId][dataElementId], "eventId"), _.pluck(groupedDataValues[genderFilterId][genderDataElement[0]], "eventId"));
            };

            var applyAgeFilter = function(eventIds) {
                var count = 0;
                var filteredEventIds;

                _.forEach(eventIds, function(eventId) {
                    var dataValue = _.find($scope.dataValues._age, {
                        "eventId": eventId
                    });
                    if (dataValue.value > ageFilter[0] && dataValue.value < ageFilter[1])
                        count++;
                });
                return count;
            };

            if (isGenderFilterApplied && !isAgeFilterApplied) {
                filteredEventIds = applyGenderFilter();
                count = _.isEmpty(filteredEventIds) ? 0 : filteredEventIds.length;
                return count;
            }
            if (isAgeFilterApplied && !isGenderFilterApplied) {
                filteredEventIds = _.pluck(groupedDataValues[optionId][dataElementId], "eventId");
                return applyAgeFilter(filteredEventIds);
            }

            if (isAgeFilterApplied && isGenderFilterApplied) {
                filteredEventIds = applyGenderFilter();
                return applyAgeFilter(filteredEventIds);
            }

            count = _.isEmpty(groupedDataValues[optionId][dataElementId]) ? 0 : groupedDataValues[optionId][dataElementId].length;

            return count;
        };

        $scope.getProcedureCount = function(isGenderFilterApplied, isAgeFilterApplied, optionId, genderFilterId, ageFilter) {
            var count = 0;
            var eventIds;

            var applyGenderFilter = function() {
                if (_.isUndefined(groupedDataValues[genderFilterId]) || _.isUndefined(groupedProcedureDataValues[optionId]))
                    return [];
                var filteredEventIds = [];
                var eventIdsInOption = _.pluck(groupedProcedureDataValues[optionId], "eventId");
                var genderDataElement = _.keys(groupedDataValues[genderFilterId]);
                var eventIdsInFilter = _.pluck(groupedDataValues[genderFilterId][genderDataElement[0]], "eventId");
                _.forEach(eventIdsInOption, function(eventId) {
                    if (_.contains(eventIdsInFilter, eventId))
                        filteredEventIds.push(eventId);
                });
                return filteredEventIds;
            };

            var applyAgeFilter = function(eventIds) {
                count = 0;
                _.forEach(eventIds, function(eventId) {
                    var dataValue = _.find($scope.dataValues._age, {
                        "eventId": eventId
                    });
                    if (dataValue.value > ageFilter[0] && dataValue.value < ageFilter[1])
                        count++;
                });
                return count;
            };

            if (isGenderFilterApplied && !isAgeFilterApplied) {
                return applyGenderFilter().length;
            }

            if (isAgeFilterApplied && !isGenderFilterApplied) {
                eventIds = _.pluck(groupedProcedureDataValues[optionId], "eventId");
                return applyAgeFilter(eventIds);
            }

            if (isAgeFilterApplied && isGenderFilterApplied) {
                eventIds = applyGenderFilter();
                return applyAgeFilter(eventIds);
            }

            count = _.isEmpty(groupedProcedureDataValues[optionId]) ? 0 : groupedProcedureDataValues[optionId].length;
            return count;
        };

        $scope.getReferralCount = function(locationName) {
            if (_.isUndefined($scope.dataValues._referralLocations) || _.isEmpty($scope.referralOptions))
                return 0;

            var optionId = _.find($scope.referralOptions, {
                "displayName": locationName
            }).id;
            return _.filter($scope.dataValues._referralLocations, {
                "value": optionId
            }).length;
        };

        $scope.shouldShowInOfflineSummary = function(dataElementId, allDataElements) {
            allDataElements = _.filter(allDataElements, function(de) {
                return _.endsWith(de.dataElement.code, "_showInOfflineSummary") && de.dataElement.optionSet;
            });
            var dataElementIds = _.pluck(_.pluck(allDataElements, 'dataElement'), 'id');
            return _.contains(dataElementIds, dataElementId);
        };

        $scope.showSummary = function() {
            return $scope.showFilters && ($scope.showOfflineSummaryForViewOnly || ($scope.isCompleted && hasRoles(['Coordination Level Approver', 'Observer'])) || (hasRoles(['Project Level Approver', 'Observer'])));
        };

        var getDescriptionsForProceduresPerformed = function () {
            var proceduresPerformed = _.uniq($scope.dataValues._procedures, 'formName');
            proceduresPerformed =  _.map(proceduresPerformed, function (procedurePerformed) {
                return {
                    "title" : translationsService.getTranslationForProperty(procedurePerformed.dataElement, 'formName', procedurePerformed.formName),
                    "description": translationsService.getTranslationForProperty(procedurePerformed.dataElement, 'description', procedurePerformed.description)
                };
            });
            $scope.proceduresPerformed = _.groupBy(proceduresPerformed, 'description');
        };

        $scope.shouldShowProceduresInOfflineSummary = function() {
            return !_.isEmpty($scope.procedureDataValueIds);
        };

        var getPeriod = function() {
            return moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
        };

        var loadOriginsOrgUnits = function() {
            return orgUnitRepository.findAllByParent($scope.selectedModule.id).then(function(data) {
                data = _.sortBy(data, "displayName");
                $scope.originOrgUnits = data;
                $scope.originMap = {};
                _.forEach(data, function(origin) {
                    $scope.originMap[origin.id] = origin.displayName || origin.name;
                });
            });
        };

        var loadProgram = function() {
            var getExcludedDataElementsForModule = function() {
                return excludedDataElementsRepository.get($scope.selectedModule.id).then(function(data) {
                    return data ? _.pluck(data.dataElements, "id") : [];
                });
            };

            var getProgram = function(excludedDataElements) {
                return programRepository.get($scope.associatedProgramId, excludedDataElements).then(function(program) {
                    var translatedProgram = translationsService.translate([program]);
                    $scope.program = translatedProgram[0];
                });
            };

            return getExcludedDataElementsForModule().then(getProgram);
        };

        var getOptionSetMapping = function() {
            return optionSetRepository.getOptionSetMapping($scope.selectedModule.parent.id).then(function(data) {
                var translatedOptionSetMap = translationsService.translateOptionSetMap(data.optionSetMap);
                $scope.optionSetMapping = translatedOptionSetMap;

                var translatedOptionMap = translationsService.translateOptionMap(data.optionMap);
                $scope.optionMapping = translatedOptionMap;
            });
        };

        var loadGroupedDataValues = function(events) {
            var allDataValues = _.compact(_.flatten(_.map(events, function(event) {
                return _.map(event.dataValues, function(edv) {
                    if (!_.isUndefined(edv.value)) {
                        edv.eventId = event.event;
                        return edv;
                    }
                });
            })));

            $scope.eventsMap = _.groupBy(allDataValues, "eventId");

            $scope.dataValues = _.groupBy(allDataValues, function(dv) {
                if (_.endsWith(dv.code, "_showInOfflineSummary")) {
                    return "_showInOfflineSummary";
                }
                if (_.endsWith(dv.code, "_age")) {
                    return "_age";
                }
                if (_.endsWith(dv.code, "_sex")) {
                    return "_sex";
                }
                if (_.endsWith(dv.code, "_procedures")) {
                    return "_procedures";
                }
                if (_.endsWith(dv.code, "_referralLocations")) {
                    return "_referralLocations";
                }
            });

            $scope.originEvents = _.groupBy(events, "orgUnit");

            groupedProcedureDataValues = _.groupBy($scope.dataValues._procedures, "value");
            groupedDataValues = _.groupBy(allDataValues, "value");

            var keys = _.keys(groupedDataValues);
            _.forEach(keys, function(key) {
                var groupedByDataelements = _.groupBy(groupedDataValues[key], "dataElement");
                groupedDataValues[key] = groupedByDataelements;
            });

            $scope.genderOptions = _.isUndefined($scope.dataValues._sex) ? [] : $scope.optionSetMapping[$scope.dataValues._sex[0].optionSet.id];
            $scope.procedureOptions = _.isUndefined($scope.dataValues._procedures) ? [] : $scope.optionSetMapping[$scope.dataValues._procedures[0].optionSet.id];
            $scope.referralOptions = _.isUndefined($scope.dataValues._referralLocations) ? [] : $scope.optionSetMapping[$scope.dataValues._referralLocations[0].optionSet.id];

            $scope.procedureDataValueIds = _.keys(groupedProcedureDataValues);
            $scope.procedureDataValues = _.groupBy($scope.dataValues._procedures, "value");
        };

        var setShowFilterFlag = function() {
            $scope.showFilters = !_.isEmpty($scope.procedureDataValueIds) || !_.isEmpty(_.compact(_.pluck($scope.dataValues._showInOfflineSummary, "value")));
        };

        var getAssociatedDataSets = function() {
            return datasetRepository.findAllForOrgUnits([$scope.originOrgUnits[0].id]).then(function(data) {
                var translatedDataset = translationsService.translate(data);
                $scope.associatedDataSets = translatedDataset;
            });
        };

        var getReferralLocations = function() {
            return referralLocationsRepository.get($scope.selectedModule.parent.id).then(function(locations) {
                if (_.isUndefined(locations)) {
                    $scope.shouldShowReferrals = false;
                    return;
                }

                $scope.shouldShowReferrals = true;
                $scope.referralMap = _.omit(locations, ["orgUnit", "clientLastUpdated"]);
                $scope.locationNames = _.pluck($scope.referralMap, "name");
            });
        };

        var init = function() {
            return $q.all([loadOriginsOrgUnits(), loadProgram(), getOptionSetMapping(), getReferralLocations()]).then(function() {
                return programEventRepository.getEventsForPeriod($scope.associatedProgramId, _.pluck($scope.originOrgUnits, "id"), getPeriod()).then(function(events) {
                    var submittedEvents = _.filter(events, function(event) {
                        return event.localStatus === "READY_FOR_DHIS" || event.localStatus === undefined;
                    });
                    loadGroupedDataValues(submittedEvents);
                    setShowFilterFlag();
                    getAssociatedDataSets();
                    getDescriptionsForProceduresPerformed();
                });
            });
        };

        init();
    };
});
