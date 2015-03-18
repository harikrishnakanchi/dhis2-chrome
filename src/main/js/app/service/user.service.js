define(["dhisUrl", "lodash"], function(dhisUrl, _) {
    return function($http, db) {
        var create = function(user) {
            user.userCredentials = _.omit(user.userCredentials, "password");
            var payload = {
                "users": [user]
            };
            return $http.post(dhisUrl.metadata, payload).then(function(data) {
                return data;
            });
        };

        var update = function(user) {
            user.userCredentials = _.omit(user.userCredentials, "password");

            var payload = {
                "firstName": user.firstName,
                "surname": user.surname,
                "userCredentials": user.userCredentials,
                "organisationUnits": user.organisationUnits,
            };

            var saveToDhis = function(data) {
                return $http.put(dhisUrl.users + '/' + user.id, payload).then(function() {
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
