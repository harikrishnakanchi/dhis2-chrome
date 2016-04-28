define(['moduleDataBlock', 'lodash'], function (ModuleDataBlock, _) {
    return function (orgUnitRepository) {
        return {
            createForProject: function (projectId, periodRange) {
                return orgUnitRepository.getAllModulesInOrgUnits(projectId).then(function (moduleOrgUnits) {
                    var allModuleDataBlocks = _.map(moduleOrgUnits, function(moduleOrgUnit) {
                        return _.map(periodRange, function(period) {
                            return ModuleDataBlock.create(moduleOrgUnit, period, {}, {}, {});
                        });
                    });
                    return _.flatten(allModuleDataBlocks);
                });
            }
        };
    };
});