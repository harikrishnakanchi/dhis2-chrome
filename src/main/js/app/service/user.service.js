define(["properties", "lodash", "md5"], function(properties, _, md5) {
    return function($http, db) {
        var create = function(user) {
            var saveToDb = function() {
                var dhisUser = _.cloneDeep(user);
                dhisUser.userCredentials = _.omit(dhisUser.userCredentials, "password");

                var store = db.objectStore("users");
                return store.upsert(dhisUser);
            };

            var saveCredentialsToLocalStore = function(data) {
                var userCredentials = {
                    username: user.userCredentials.username,
                    password: md5(user.userCredentials.password),
                };

                var store = db.objectStore("localUserCredentials");
                return store.upsert(userCredentials);
            };

            var saveToDhis = function(data) {
                return $http.post(properties.dhis.url + '/api/users', user).then(function() {
                    return data;
                });
            };

            return saveToDb().then(saveCredentialsToLocalStore).then(saveToDhis);
        };

        var getAllUsernames = function() {
            var store = db.objectStore("users");
            return store.getAll().then(function(users) {
                var userCredentials = _.pluck(users, "userCredentials");
                return _.pluck(userCredentials, "username");
            });
        };

        var getAllProjectUsers = function(projectName) {
            var project = projectName.toLowerCase().replace(/ /g, "_").concat("_");

            var filterProjectUsers = function(allUsers) {
                return _.filter(allUsers, function(user) {
                    return user.userCredentials.username.indexOf(project) === 0;
                });
            };

            var store = db.objectStore("users");
            return store.getAll().then(filterProjectUsers);
        };

        return {
            "create": create,
            "getAllProjectUsers": getAllProjectUsers,
            "getAllUsernames": getAllUsernames
        };
    };
});