define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(orgUnitService, orgUnitRepository, $q) {
        var retrieveFromIDB = function(orgUnits) {
            return $q.all(_.map(orgUnits, function(o) {
                return orgUnitRepository.get(o.id);
            }));
        };

        this.run = function(message) {
            var orgUnits = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            console.debug("uploading orgs : " + orgUnits);
            return retrieveFromIDB(orgUnits).then(orgUnitService.upsert);
        };
    };
});
