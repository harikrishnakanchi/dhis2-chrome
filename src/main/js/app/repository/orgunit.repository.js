define([], function() {
    return function(db) {
        this.upsert = function(payload) {
            var store = db.objectStore("organisationUnits");
            return store.upsert(payload).then(function() {
                return payload;
            });
        };

        this.getAll = function() {
            var store = db.objectStore("organisationUnits");
            return store.getAll();
        };

        this.getAllProjects = function() {
            var getAttributeValue = function(orgUnit, attrCode) {
                return _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": attrCode
                    }
                }).value;
            };

            var filterProjects = function(orgUnits) {
                return _.filter(orgUnits, function(orgUnit) {
                    return getAttributeValue(orgUnit, "Type") === "Project";
                });
            };

            var mapProjectCode = function(orgUnits) {
                return _.map(orgUnits, function(orgUnit) {
                    orgUnit.code = getAttributeValue(orgUnit, "projCode");
                    return orgUnit;
                });
            };

            return this.getAll().then(filterProjects).then(mapProjectCode);
        };
    };
});