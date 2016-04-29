define(['moduleDataBlock', 'lodash'], function (ModuleDataBlock, _) {
    return function ($q, orgUnitRepository, dataRepository, programEventRepository) {

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

                var getLineListData = function() {
                    return orgUnitRepository.findAllByParent(moduleIds).then(function (originOrgUnits) {
                        var startPeriod = periodRange[0],
                            originOrgUnitIds = _.pluck(originOrgUnits, 'id');

                        var getModuleIdFromOriginOrgUnits = _.memoize(function(originOrgUnitId) {
                            return _.find(originOrgUnits, { id: originOrgUnitId }).parent.id;
                        });

                        return programEventRepository.getEventsFromPeriod(startPeriod, originOrgUnitIds).then(function (lineListEvents) {
                            return _.groupBy(lineListEvents, function(lineListEvent) {
                               return lineListEvent.period + getModuleIdFromOriginOrgUnits(lineListEvent.orgUnit);
                            });
                        });
                    });
                };

                return $q.all({
                    indexedAggregateData: getIndexedAggregateData(),
                    lineListData: getLineListData()
                }).then(function (data) {
                    var indexedAggregateData = data.indexedAggregateData;
                    var lineListData = data.lineListData;

                    var allModuleDataBlocks = _.map(moduleOrgUnits, function (moduleOrgUnit) {
                        return _.map(periodRange, function (period) {
                            var aggregateDataValues = indexedAggregateData[period + moduleOrgUnit.id] || {};
                            var lineListEvents = lineListData[period + moduleOrgUnit.id] || {};

                            return ModuleDataBlock.create(moduleOrgUnit, period, aggregateDataValues, lineListEvents, {});
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