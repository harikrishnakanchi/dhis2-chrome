define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {
        var create = function(user) {
            var payload = {
                "users": [user]
            };
            return $http.post(properties.dhis.url + '/api/metadata', payload).then(function(data) {
                return data;
            });
        };

        var update = function(user) {
            var deleteUserPayload = function() {
                var payload = {
                    "firstName": user.firstName,
                    "surname": user.surname,
                    "userCredentials": user.userCredentials,
                    "organisationUnits": user.organisationUnits,
                };
                return payload;
            };

            var saveToDhis = function(data) {
                return $http.put(properties.dhis.url + '/api/users/' + user.id, deleteUserPayload()).then(function() {
                    return data;
                });
            };

            return saveToDhis(user);
        };

        return {
            "create": create,
            "update": update
        };
    };
});
