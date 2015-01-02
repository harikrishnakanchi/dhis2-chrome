define(["lodash"], function(_) {
    return function(orgUnitGroupService, orgUnitGroupRepository) {
        this.run = function(message) {
            console.debug("Syncing org unit groups: ", message.data.data);
            return orgUnitGroupRepository.get(_.pluck(message.data.data, "id")).then(function(data) {
                return orgUnitGroupService.upsert(data);
            });
        };
    };
});
