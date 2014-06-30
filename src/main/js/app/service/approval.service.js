define(["properties", "moment"], function(properties, moment) {
    return function($http, db, $q) {
        this.markAsComplete = function(dataSets, period, orgUnit, storedBy, completionDate) {
            return $http.post(properties.dhis.url + "/api/completeDataSetRegistrations", undefined, {
                params: {
                    "ds": dataSets,
                    "pe": period,
                    "ou": orgUnit,
                    "sb": storedBy,
                    "cd": completionDate,
                    "multiOu": true
                }
            });
        };

        this.saveCompletionToDB = function(payload) {
            var store = db.objectStore("completeDataSets");
            return store.upsert(payload);
        };

        this.getAllLevelOneApprovalData = function(orgUnits, dataSets) {
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

        this.saveLevelOneApprovalData = function(completeDataSetRegistrationList) {
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
    };
});