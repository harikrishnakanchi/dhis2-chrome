define(['moduleDataBlock', 'lodash'], function (ModuleDataBlock, _) {
    return function ($q, orgUnitRepository, dataRepository, programEventRepository, approvalDataRepository, dataSyncFailureRepository) {

        var create = function (moduleId, period) {
            return orgUnitRepository.findAll([moduleId])
                .then(_.partial(createForModules, _, [period]))
                .then(function(moduleDataBlocks) {
                    return _.first(moduleDataBlocks);
                });
        };

        var createForProject = function (projectId, periodRange) {
            return orgUnitRepository.getAllModulesInOrgUnits(projectId).then(_.partial(createForModules, _, periodRange));
        };

        var createForModule = function (moduleId, periodRange) {
            return orgUnitRepository.findAll([moduleId]).then(_.partial(createForModules, _, periodRange));
        };

        var createForModules = function (moduleOrgUnits, periodRange) {
            var moduleIds = _.pluck(moduleOrgUnits, 'id');

            var getIndexedAggregateData = function (mapOfOriginIdsToModuleIds) {
                var moduleIdsAndOriginIds = moduleIds.concat(_.keys(mapOfOriginIdsToModuleIds));

                return dataRepository.getDataValuesForOrgUnitsAndPeriods(moduleIdsAndOriginIds, periodRange).then(function (aggregateDataValues) {
                    return _.groupBy(aggregateDataValues, function (dataValue) {
                        var orgUnitToGroupBy = mapOfOriginIdsToModuleIds[dataValue.orgUnit] || dataValue.orgUnit;
                        return dataValue.period + orgUnitToGroupBy;
                    });
                });
            };

            var getIndexedLineListData = function(mapOfOriginIdsToModuleIds) {
                var startPeriod = _.first(periodRange),
                    originOrgUnitIds = _.keys(mapOfOriginIdsToModuleIds);

                return programEventRepository.getEventsFromPeriod(startPeriod, originOrgUnitIds).then(function (lineListEvents) {
                    return _.groupBy(lineListEvents, function(lineListEvent) {
                        return lineListEvent.period + mapOfOriginIdsToModuleIds[lineListEvent.orgUnit];
                    });
                });
            };

            var getIndexedApprovalData = function() {
                var startPeriod = periodRange[0],
                    endPeriod = _.last(periodRange);
                return approvalDataRepository.getApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(function (allApprovalData) {
                    allApprovalData = _.reject(allApprovalData, 'status', 'DELETED');
                    return _.indexBy(allApprovalData, function (approvalData) {
                        return approvalData.period + approvalData.orgUnit;
                    });
                });
            };

            var getMapOfOriginIdsToModuleIds = function () {
                return orgUnitRepository.findAllByParent(moduleIds).then(function(originOrgUnits) {
                    return _.transform(originOrgUnits, function (map, originOrgUnit) {
                        map[originOrgUnit.id] = originOrgUnit.parent.id;
                    }, {});
                });
            };

            var getIndexedFailedSyncStatus = function (mapOfPeriodsToModuleIds) {
                return dataSyncFailureRepository.getAll().then(function (failedModules) {
                    var moduleSyncStatus = [];
                    var indexedFailedModules = _.indexBy(failedModules, function(module){
                        return module.period + module.moduleId;
                    });
                    _.each(moduleIds, function (moduleId) {
                        _.each(periodRange, function (period) {
                            moduleSyncStatus[period + moduleId] = indexedFailedModules[period + moduleId] ? true : false;
                        });
                    });
                    return moduleSyncStatus;
                });
            };

            return getMapOfOriginIdsToModuleIds().then(function(mapOfOriginIdsToModuleIds) {
                return $q.all({
                    indexedAggregateData: getIndexedAggregateData(mapOfOriginIdsToModuleIds),
                    indexedLineListData: getIndexedLineListData(mapOfOriginIdsToModuleIds),
                    indexedApprovalData: getIndexedApprovalData(),
                    indexedFailedSyncStatus: getIndexedFailedSyncStatus()
                });
            }).then(function (data) {
                var indexedAggregateData = data.indexedAggregateData;
                var indexedLineListData = data.indexedLineListData;
                var indexedApprovalData = data.indexedApprovalData;
                var indexedFailedSyncStatus = data.indexedFailedSyncStatus;

                var allModuleDataBlocks = _.map(moduleOrgUnits, function (moduleOrgUnit) {
                    return _.map(periodRange, function (period) {
                        var aggregateDataValues = indexedAggregateData[period + moduleOrgUnit.id] || [];
                        var lineListData = indexedLineListData[period + moduleOrgUnit.id] || [];
                        var approvalData = indexedApprovalData[period + moduleOrgUnit.id] || {};
                        var failedToSync = indexedFailedSyncStatus[period + moduleOrgUnit.id];
                        return ModuleDataBlock.create(moduleOrgUnit, period, aggregateDataValues, lineListData, approvalData, failedToSync);
                    });
                });
                return _.flatten(allModuleDataBlocks);
            });
        };

        return {
            create: create,
            createForProject: createForProject,
            createForModule: createForModule
        };
    };
});