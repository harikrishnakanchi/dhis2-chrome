define(["moment"], function(moment) {
    return function(db, $q) {
        var self = this;
        this.getAll = function() {
            var store = db.objectStore("orgUnitGroups");
            return store.getAll();
        };

        this.upsert = function(orgUnitGroups) {
            var store = db.objectStore("orgUnitGroups");

            var addClientLastUpdatedField = function(payload) {
                return _.map(payload, function(p) {
                    p.clientLastUpdated = moment().toISOString();
                    return p;
                });
            };

            orgUnitGroups = addClientLastUpdatedField(orgUnitGroups);
            return store.upsert(orgUnitGroups).then(function() {
                return orgUnitGroups;
            });
        };

        this.upsertDhisDownloadedData = function(payload) {
            var store = db.objectStore("orgUnitGroups");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        this.clearStatusFlag = function(orgUnitGroupId, orgUnitIds) {
            var store = db.objectStore("orgUnitGroups");
            return self.get(orgUnitGroupId).then(function(orgUnitGroup) {
                orgUnitGroup.organisationUnits = _.transform(orgUnitGroup.organisationUnits, function(acc, orgUnit) {
                    if (orgUnit.localStatus === "DELETED" && _.contains(orgUnitIds, orgUnit.id))
                        return;
                    if (_.contains(orgUnitIds, orgUnit.id))
                        acc.push(_.omit(orgUnit, "localStatus"));
                    else
                        acc.push(orgUnit);
                }, []);
                return store.upsert(orgUnitGroup);
            });
        };

        this.get = function(orgUnitGroupId) {
            var store = db.objectStore("orgUnitGroups");
            return store.find(orgUnitGroupId);
        };

        this.findAll = function(orgUnitGroupIds) {
            var store = db.objectStore("orgUnitGroups");

            var query = db.queryBuilder().$in(orgUnitGroupIds).compile();
            return store.each(query);
        };

    };
});
