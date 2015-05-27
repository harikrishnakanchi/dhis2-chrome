define(["lodash", "moment"], function(_, moment) {
    return function($scope, $q, programEventRepository, orgUnitRepository, programRepository, optionSetRepository) {

        $scope.getCount = function(optionId) {
            return _.filter($scope.dataValues._showInOfflineSummary, function(dv) {
                return dv.value === optionId;
            }).length;
        };

        $scope.shouldShowInOfflineSummary = function(dataElementId) {
            var dataElementIds = _.pluck($scope.dataValues._showInOfflineSummary, 'dataElement');
            return _.contains(dataElementIds, dataElementId);
        };

        $scope.getProcedureCount = function(optionId) {
            return _.filter($scope.dataValues._procedures, function(dv) {
                return dv.value === optionId;
            }).length;
        };

        $scope.getProcedureName = function(dataValue, optionId) {
            var option = _.find($scope.optionSetMapping[dataValue.optionSet.id], {
                'id': optionId
            });
            return option.name;
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
                return event.dataValues;
            }));

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
            $scope.procedureDataValueIds = _.unique(_.pluck($scope.dataValues._procedures, "value"));
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