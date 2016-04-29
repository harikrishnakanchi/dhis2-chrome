define(['moduleDataBlock', 'lodash'], function (ModuleDataBlock, _) {
    return function ($q, orgUnitRepository, dataRepository) {

        var createForProject = function (projectId, periodRange) {
            return orgUnitRepository.getAllModulesInOrgUnits(projectId).then(function (moduleOrgUnits) {
                var moduleIds = _.pluck(moduleOrgUnits, 'id');

                var getIndexedAggregateData = function () {
                    return dataRepository.getDataValuesForOrgUnitsAndPeriods(moduleIds, periodRange).then(function (aggregateDataValues) {
                        return _.indexBy(aggregateDataValues, function (dataValue) {
                            return dataValue.period + dataValue.orgUnit;
                        });
                    });
                };

                return $q.all({
                    indexedAggregateData: getIndexedAggregateData()
                }).then(function (data) {
                    var indexedAggregateData = data.indexedAggregateData;

                    var allModuleDataBlocks = _.map(moduleOrgUnits, function (moduleOrgUnit) {
                        return _.map(periodRange, function (period) {
                            var aggregateDataValues = indexedAggregateData[period + moduleOrgUnit.id] || {};
                            return ModuleDataBlock.create(moduleOrgUnit, period, aggregateDataValues, {}, {});
                        });
                    });
                    return _.flatten(allModuleDataBlocks);
                });
            });
        };

        return {
            createForProject: createForProject
        };
    };
});