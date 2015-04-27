define(["lodash"], function(_) {
    return function(orgUnitGroupService, orgUnitGroupRepository, orgUnitService, $q) {
        var retrieveFromIDB = function(orgUnitGroups) {
            return $q.all(_.map(orgUnitGroups, function(o) {
                return orgUnitGroupRepository.get(o.id);
            }));
        };

        var filterAndUpsert = function(orgUnitGroups) {
            var getAddedOrgUnits = function(orgUnits) {
                var filteredOrgUnits = _.filter(orgUnits, function(ou) {
                    return ou.localStatus === "NEW";
                });
                return $q.when(filteredOrgUnits);
            };

            var getOrgUnitsPresentInDhis = function(orgUnits) {
                return orgUnitService.getIds(_.pluck(orgUnits, "id"));
            };

            var generatePayload = function(existingOrgUnitIds) {
                var shouldOmitLocalStatus = function(orgUnit) {
                    return orgUnit.localStatus === "NEW" && _.contains(existingOrgUnitIds, orgUnit.id);
                };

                return _.map(orgUnitGroups, function(group) {
                    group.organisationUnits = _.transform(group.organisationUnits, function(acc, orgUnit) {
                        if (orgUnit.localStatus) {
                            if (orgUnit.localStatus !== "DELETED") {
                                var orgUnitToUpsert = shouldOmitLocalStatus(orgUnit) ? _.omit(orgUnit, "localStatus") : orgUnit;
                                acc.push(orgUnitToUpsert);
                            }
                        } else {
                            acc.push(orgUnit);
                        }
                    }, []);
                    return group;
                });
            };

            var upsert = function(payload) {
                return orgUnitGroupService.upsert(payload).then(function() {
                    orgUnitGroupRepository.upsert(payload);
                });
            };

            var allOrgUnits = _.flatten(_.pluck(orgUnitGroups, "organisationUnits"));
            return getAddedOrgUnits(allOrgUnits)
                .then(getOrgUnitsPresentInDhis)
                .then(generatePayload)
                .then(upsert);
        };

        this.run = function(message) {
            var orgUnitGroups = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            return retrieveFromIDB(orgUnitGroups).then(filterAndUpsert);
        };
    };
});
