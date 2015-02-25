define(["orgUnitMapper"], function(orgUnitMapper) {
    return function(orgUnitRepository) {
        var getParentProjectId = function(parentId) {
            return orgUnitRepository.get(parentId).then(function(parentOrgUnit) {
                var type = orgUnitMapper.getAttributeValue(parentOrgUnit, "Type");
                if (type === 'Project') {
                    return parentOrgUnit.id;
                } else {
                    return getParentProjectId(parentOrgUnit.parent.id);
                }
            });
        };

        return {
            "getParentProjectId": getParentProjectId
        };
    };
});
