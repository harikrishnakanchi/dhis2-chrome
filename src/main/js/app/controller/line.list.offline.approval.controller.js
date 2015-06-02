define(["lodash", "moment"], function(_, moment) {
    return function($scope, $q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository) {

        $scope.isGenderFilterApplied = false;
        $scope.isAgeFilterApplied = false;

        $scope.getCount = function(optionCode, dataElementId, filterCode) {
            return _.filter($scope.dataValues._showInOfflineSummary, function(dv) {
                return dv.value === optionCode && dv.dataElement === dataElementId && applyGenderFilters(dv, filterCode) && applyAgeFilters(dv, filterCode);
            }).length;
        };

        $scope.getProcedureCount = function(optionCode, filterCode) {
            return _.filter($scope.dataValues._procedures, function(dv) {
                return dv.value === optionCode && applyGenderFilters(dv, filterCode) && applyAgeFilters(dv, filterCode);
            }).length;
        };

        $scope.shouldShowInOfflineSummary = function(dataElementId) {
            var dataElementIds = _.pluck($scope.dataValues._showInOfflineSummary, 'dataElement');
            return _.contains(dataElementIds, dataElementId);
        };

        $scope.shouldShowInGenderFilter = function(optionCode, dataElementId) {
            return $scope.getCount(optionCode, dataElementId, "Male") !== 0 || $scope.getCount(optionCode, dataElementId, "Female") !== 0 || $scope.getCount(optionCode, dataElementId, "Not recorded") !== 0;
        };

        $scope.shouldShowInAgeFilter = function(optionCode, dataElementId) {
            return $scope.getCount(optionCode, dataElementId, [0, 5]) !== 0 || $scope.getCount(optionCode, dataElementId, [5, 15]) !== 0 || $scope.getCount(optionCode, dataElementId, [14, 9999]) !== 0;
        };


        var applyGenderFilters = function(dv, code) {
            if ($scope.isGenderFilterApplied) {
                var result = _.any($scope.eventsMap[dv.eventId], {
                    "value": code + "_" + $scope.program.name
                });
                return result;
            } else
                return true;
        };

        var applyAgeFilters = function(dv, ageRange) {
            if ($scope.isAgeFilterApplied) {
                var result = _.any($scope.eventsMap[dv.eventId], function(dataValue) {
                    var intValue = parseInt(dataValue.value);
                    return _.endsWith(dataValue.code, "_age_showInOfflineSummaryFilters") && intValue > ageRange[0] && intValue < ageRange[1];
                });
                return result;
            } else
                return true;
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
            return optionSetRepository.getOptionSetMapping($scope.resourceBundle).then(function(optionSetMapping) {
                $scope.optionSetMapping = optionSetMapping;
            });
        };

        var loadGroupedDataValues = function(events) {
            var allDataValues = _.flatten(_.map(events, function(event) {
                return _.map(event.dataValues, function(edv) {
                    edv.eventId = event.event;
                    return edv;
                });
            }));
            $scope.eventsMap = _.groupBy(allDataValues, "eventId");

            $scope.dataValues = _.groupBy(allDataValues, function(dv) {
                if (_.endsWith(dv.code, "_showInOfflineSummary")) {
                    return "_showInOfflineSummary";
                }
                if (_.endsWith(dv.code, "_showInOfflineSummaryFilters")) {
                    return "_showInOfflineSummaryFilters";
                }
                if (_.endsWith(dv.code, "_procedures")) {
                    return "_procedures";
                }
            });

            $scope.procedureDataValueCodes = _.unique(_.pluck($scope.dataValues._procedures, "value"));
            $scope.procedureDataValues = _.groupBy($scope.dataValues._procedures, "value");
        };

        var init = function() {
            return $q.all([loadOriginsOrgUnits(), loadProgram(), getOptionSetMapping()]).then(function() {
                return programEventRepository.getEventsFor($scope.associatedProgramId, getPeriod(), _.pluck($scope.originOrgUnits, "id")).then(function(events) {
                    loadGroupedDataValues(events);
                });
            });
        };

        init();
    };
});
