define(['moduleDataBlock', 'lodash'], function (ModuleDataBlock, _) {
    return function (orgUnitRepository) {
        return {
            createForProject: function (projectId, startPeriod) {
                return orgUnitRepository.getAllModulesInOrgUnits(projectId).then(function (moduleOrgUnits) {
                    return _.map(moduleOrgUnits, function(moduleOrgUnit) {
                        return ModuleDataBlock.create(moduleOrgUnit, startPeriod, {}, {}, {});
                    });
                });
            }
        };
    };
});