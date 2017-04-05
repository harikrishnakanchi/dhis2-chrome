define(['lodash'], function(_) {
    return function(db, $q) {
        this.getAll = function() {
            var orgUnitGroupStore = db.objectStore("orgUnitGroups");
            var organisationUnitGroupSetStore = db.objectStore("organisationUnitGroupSets");

            return $q.all({
                orgUnitGroupSets: organisationUnitGroupSetStore.getAll(),
                orgUnitGroups: orgUnitGroupStore.getAll()
            }).then(function (data) {
                var indexedOrgUnitGroups = _.indexBy(data.orgUnitGroups, 'id');
                return _.each(data.orgUnitGroupSets, function (orgUnitGroupSet) {
                    orgUnitGroupSet.organisationUnitGroups = _.map(orgUnitGroupSet.organisationUnitGroups, function (organisationUnitGroup) {
                        return _.merge(organisationUnitGroup, indexedOrgUnitGroups[organisationUnitGroup.id]);
                    });
                });
            });
        };
    };
});
