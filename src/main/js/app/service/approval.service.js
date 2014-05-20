define(["properties"], function(properties) {
    return function($http, db) {
        this.approve = function(approvalRequests) {
            var saveToDb = function() {
                var payload = _.map(approvalRequests, function(a) {
                    return _.merge(a, {
                        "isApproved": true
                    });
                });
                var store = db.objectStore("approvals");
                return store.upsert(payload);
            };

            var saveToDhis = $http.post(properties.dhis.url + "/api/dataApprovals/bulk", approvalRequests);
            return saveToDhis.
            finally(saveToDb);
        };
    };
});