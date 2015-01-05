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
                    var modifiedOrgUnitGroups = [];
                    _.forEach(orgUnitGroups, function(orgUnitGroup) {
                        var res;
                        if (orgUnitGroup.name.indexOf("Unit Code - ") !== -1) {
                            var orgUnitGroupName = orgUnitGroup.name.replace("Unit Code - ", "");
                            res = _.find(attributes, {
                                'value': orgUnitGroupName.trim()
                            });
                        } else {
                            res = _.find(attributes, {
                                'value': orgUnitGroup.name.trim()
                            });
                        }

                        if (isUpdateProject) {
                            orgUnitGroup.organisationUnits = _.reject(orgUnitGroup.organisationUnits, moduleToAdd);
                        }
                        var isOrgUnitAbsent = !_.find(orgUnitGroup.organisationUnits, moduleToAdd);

                        if (res !== undefined && isOrgUnitAbsent) {
                            orgUnitGroup.organisationUnits.push(moduleToAdd);
                            modifiedOrgUnitGroups.push(orgUnitGroup);
                        } 
                    });
                    return modifiedOrgUnitGroups;
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