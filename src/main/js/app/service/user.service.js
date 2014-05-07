define(["properties", "lodash"], function(properties, _) {
    return function($http, db) {
        var create = function(user) {
            var saveToDb = function() {
                var store = db.objectStore("users");
                return store.upsert(user);
            };

            var saveToDhis = function(data) {
                return $http.post(properties.dhis.url + '/api/users', user).then(function() {
                    return data;
                });
            };

            return saveToDb().then(saveToDhis);
        };

        var getAllUsernames = function() {
            var store = db.objectStore("users");
            return store.getAll().then(function(users) {
                return _.pluck(users, "username");
            });
        };

        var getAllProjectUsers = function(projectName) {
            var project = projectName.toLowerCase().replace(/ /g, "_");
            var store = db.objectStore("users");
            return store.getAll().then(function(users) {
                return _.filter(users, function(user) {
                    return user.userName.indexOf(projectName) === 0;
                });
            });
        };

        return {
            "create": create,
            "getAllProjectUsers": getAllProjectUsers,
            "getAllUsernames": getAllUsernames
        };
    };
});