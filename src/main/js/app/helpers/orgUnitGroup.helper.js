define([], function() {
    return function($hustle, $q, $scope, orgUnitRepository, orgUnitGroupRepository) {
        this.createOrgUnitGroups = function(modules, isUpdateProject) {
            var getOrgUnitGroups = function() {
                return orgUnitGroupRepository.getAll()
                    .then(function(result) {
                        return result;
                    });
            };

            var getAttributes = function(module_t) {
                return orgUnitRepository.getProjectAndOpUnitAttributes(module_t).then(function(result) {
                    return [result, module_t];
                });
            };

            var addModulesToOrgUnitGroups = function(orgUnitGroups) {
                var addToGroup = function(data) {
                    var attributes = data[0];
                    var module_t = data[1];
                    var moduleToAdd = {
                        'id': module_t.id,
                        'name': module_t.name
                    };
                    return _.map(orgUnitGroups, function(orgUnitGroup) {
                        var res = _.find(attributes, {
                            'value': orgUnitGroup.name.trim()
                        });
                        if (isUpdateProject) {
                            orgUnitGroup.organisationUnits = _.reject(orgUnitGroup.organisationUnits, moduleToAdd);
                        }
                        var isOrgUnitAbsent = !_.find(orgUnitGroup.organisationUnits, moduleToAdd);

                        if (res !== undefined && isOrgUnitAbsent) {
                            orgUnitGroup.organisationUnits.push(moduleToAdd);
                            return orgUnitGroup;
                        } else {
                            return orgUnitGroup;
                        }
                    });
                };

                var upsertOrgUnitGroup = function(orgUnitGroups) {
                    orgUnitGroupRepository.upsert(orgUnitGroups).then(function() {
                        return $hustle.publish({
                            "data": orgUnitGroups,
                            "type": "upsertOrgUnitGroups"
                        }, "dataValues");
                    });
                };

                _.forEach(modules, function(module_t) {
                    getAttributes(module_t).then(addToGroup).then(upsertOrgUnitGroup);
                });
            };

            getOrgUnitGroups().then(addModulesToOrgUnitGroups);
        };
    };
});