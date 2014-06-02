define(["properties", "moment"], function(properties, moment) {
    return function($http, db, $q) {

        var markAsComplete = function(dataSets, period, orgUnit, storedBy) {

            var saveToDhis = function() {
                return $http({
                    method: 'POST',
                    url: properties.dhis.url + "/api/completeDataSetRegistrations",
                    params: {
                        "ds": dataSets,
                        "pe": period,
                        "ou": orgUnit,
                        "sb": storedBy,
                        "cd": completionDate,
                        "multiOu": true
                    },
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
            };

            var completionDate = moment().toISOString();

            var payload = {
                'period': period,
                'orgUnit': orgUnit,
                'storedBy': storedBy,
                'date': completionDate,
                'dataSets': dataSets
            };

            var store = db.objectStore("completeDataSets");
            return store.upsert(payload).then(saveToDhis);
        };

        var getAllLevelOneApprovalData = function(orgUnits, dataSets) {
            var onSuccess = function(response) {
                var deferred = $q.defer();
                if (response.data.completeDataSetRegistrationList)
                    deferred.resolve(response.data.completeDataSetRegistrationList);
                else
                    deferred.resolve([]);
                return deferred.promise;
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

        var saveLevelOneApprovalData = function(completeDataSetRegistrationList) {
            var registrationsGroupedByPeriodAndOu = _.groupBy(completeDataSetRegistrationList, function(registration) {
                return [registration.period.id, registration.organisationUnit.id];
            });

            var payload = _.map(registrationsGroupedByPeriodAndOu, function(item) {
                return {
                    'period': _.pluck(item, 'period')[0].id,
                    'orgUnit': _.pluck(item, 'organisationUnit')[0].id,
                    'storedBy': _.pluck(item, 'storedBy')[0],
                    'date': _.pluck(item, 'date')[0],
                    'dataSets': _.pluck(_.pluck(item, 'dataSet'), 'id')
                };
            });

            var store = db.objectStore("completeDataSets");
            return store.upsert(payload);
        };

        return {
            "markAsComplete": markAsComplete,
            "getAllLevelOneApprovalData": getAllLevelOneApprovalData,
            "saveLevelOneApprovalData": saveLevelOneApprovalData
        };
    };
});