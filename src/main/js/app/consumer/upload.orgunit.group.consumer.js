define(["lodash"], function(_) {
    return function(orgUnitGroupService, orgUnitGroupRepository, $q) {
        var retrieveFromIDB = function(orgUnitGroups) {
            return $q.all(_.map(orgUnitGroups, function(o) {
                return orgUnitGroupRepository.get(o.id);
            }));
        };

        this.run = function(message) {
            var orgUnitGroups = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            return retrieveFromIDB(orgUnitGroups).then(orgUnitGroupService.upsert);
        };
    };
});
