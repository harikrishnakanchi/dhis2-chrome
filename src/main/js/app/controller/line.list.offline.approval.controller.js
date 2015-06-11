define(["lodash", "moment"], function(_, moment) {
    return function($scope, $q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository) {

        $scope.isGenderFilterApplied = false;
        $scope.isAgeFilterApplied = false;
        var groupedProcedureDataValues, groupedDataValues;

        $scope.getCount = function(isGenderFilterApplied, isAgeFilterApplied, optionId, genderFilterId, ageFilter) {
            var count;
            var applyGenderFilter = function() {
                return _.intersection(_.pluck(groupedDataValues[optionId], "eventId"), _.pluck(groupedDataValues[genderFilterId], "eventId"));
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
                filteredEventIds = _.pluck(groupedDataValues[optionId], "eventId");
                return applyAgeFilter(filteredEventIds);
            }

            if (isAgeFilterApplied && isGenderFilterApplied) {
                filteredEventIds = applyGenderFilter();
                return applyAgeFilter(filteredEventIds);
            }

            count = _.isEmpty(groupedDataValues[optionId]) ? 0 : groupedDataValues[optionId].length;
            return count;
        };

        $scope.getProcedureCount = function(isGenderFilterApplied, isAgeFilterApplied, optionId, genderFilterId, ageFilter) {
            var count = 0;
            var eventIds;

            var applyGenderFilter = function() {
                var filteredEventIds = [];
                var eventIdsInOption = _.pluck(groupedProcedureDataValues[optionId], "eventId");
                var eventIdsInFilter = _.pluck(groupedDataValues[genderFilterId], "eventId");
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

        $scope.shouldShowInOfflineSummary = function(dataElementId) {
            var dataElementIds = _.pluck($scope.dataValues._showInOfflineSummary, 'dataElement');
            return _.contains(dataElementIds, dataElementId);
        };

        $scope.shouldShowProceduresInOfflineSummary = function() {
            return !_.isEmpty($scope.procedureDataValueIds);
        };

        var getPeriod = function() {
            return moment().isoWeekYear($scope.week.weekYear).isoWeek($scope.week.weekNumber).format("GGGG[W]WW");
        };

        var loadOriginsOrgUnits = function() {
            return orgUnitRepository.findAllByParent($scope.selectedModule.id).then(function(data) {
                $scope.originOrgUnits = data;
            });
        };

        var loadProgram = function() {
            return programRepository.get($scope.associatedProgramId).then(function(program) {
                $scope.program = program;
            });
        };

        var getOptionSetMapping = function() {
            return optionSetRepository.getOptionSetMapping($scope.resourceBundle).then(function(data) {
                $scope.optionSetMapping = data.optionSetMap;
                $scope.optionMapping = data.optionMap;
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
            });

            $scope.originsMap = _.groupBy(events, "orgUnitName");

            groupedProcedureDataValues = _.groupBy($scope.dataValues._procedures, "value");
            groupedDataValues = _.groupBy(allDataValues, "value");

            $scope.genderOptions = _.isUndefined($scope.dataValues._sex) ? [] : $scope.optionSetMapping[$scope.dataValues._sex[0].optionSet.id];
            $scope.procedureOptions = _.isUndefined($scope.dataValues._procedures) ? [] : $scope.optionSetMapping[$scope.dataValues._procedures[0].optionSet.id];

            $scope.procedureDataValueIds = _.keys(groupedProcedureDataValues);
            $scope.procedureDataValues = _.groupBy($scope.dataValues._procedures, "value");
        };

        var setShowFilterFlag = function() {
            $scope.showFilters = !_.isEmpty($scope.procedureDataValueIds) || !_.isEmpty(_.compact(_.pluck($scope.dataValues._showInOfflineSummary, "value")));
        };

        var init = function() {
            return $q.all([loadOriginsOrgUnits(), loadProgram(), getOptionSetMapping()]).then(function() {
                return programEventRepository.getEventsFor($scope.associatedProgramId, getPeriod(), _.pluck($scope.originOrgUnits, "id")).then(function(events) {
                    loadGroupedDataValues(events);
                    setShowFilterFlag();
                });
            });
        };

        init();
    };
});
