define(["properties", "moment"], function(properties, moment) {
    return function($http, db, $q) {
        var approve = function(approvalRequests) {
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

        var complete = function(firstLevelApprovalRequests) {
            var onSuccess = function(response) {
                return response.data;
            };

            var onFailure = function(response) {
                var deferred = $q.defer();
                deferred.reject({
                    "message": "Error saving completion data on server."
                });
                return deferred.promise;
            };

            return $http.post(properties.dhis.url + "/api/completeDataSetRegistrations/bulk", firstLevelApprovalRequests).then(onSuccess, onFailure);
        };

        var getAllLevelOneApprovalData = function(orgUnits, dataSets) {
            var onSuccess = function(response) {
                return response.data;
            };

            var onFailure = function(response) {
                var deferred = $q.defer();
                deferred.reject({
                    "message": "Error fetching data from server."
                });
                return deferred.promise;
            };

            return $http.get(properties.dhis.url + '/api/completeDataSetRegistrations', {
                "params": {
                    "dataSet": dataSets,
                    "startDate": "1900-01-01",
                    "endDate": moment().format("YYYY-MM-DD"),
                    "orgUnit": orgUnits,
                    "children": true
                }
            }).then(onSuccess, onFailure);

        };

        var saveLevelOneApprovalData = function(data) {
            var approvedList = data.completeDataSetRegistrationList;
            var payload = {
                'period': _.pluck(approvedList, 'period')[0].id,
                'orgUnit': _.pluck(approvedList, 'organisationUnit')[0].id,
                'storedBy': _.pluck(approvedList, 'storedBy')[0],
                'date': _.pluck(approvedList, 'date')[0],
                'dataSets': _.pluck(_.pluck(approvedList, 'dataSet'), 'id')
            };

            var store = db.objectStore("completeDataSets");
            return store.upsert(payload);
        };

        return {
            "approve": approve,
            "complete": complete,
            "getAllLevelOneApprovalData": getAllLevelOneApprovalData,
            "saveLevelOneApprovalData": saveLevelOneApprovalData
        };
    };
});