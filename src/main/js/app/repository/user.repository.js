define(["lodash", "properties", "platformUtils"], function(_, properties, platformUtils) {
    return function(db) {
        this.upsert = function(user) {
            var dhisUser = _.cloneDeep(user);
            dhisUser.userCredentials = _.omit(dhisUser.userCredentials, "password");
            var store = db.objectStore("users");
            return store.upsert(dhisUser).then(function() {
                return user;
            });
        };

        this.getAllUsernames = function() {
            var store = db.objectStore("users");
            return store.getAll().then(function(users) {
                var userCredentials = _.pluck(users, "userCredentials");
                return _.pluck(userCredentials, "username");
            });
        };

        this.getAllProjectUsers = function(project) {
            var filterProjectUsers = function(allUsers) {
                return _.filter(allUsers, {
                    "organisationUnits": [{
                        'id': project.id
                    }]
                });
            };
            var store = db.objectStore("users");
            return store.getAll().then(filterProjectUsers);
        };

        this.getUser = function(username) {
            var userStore = db.objectStore("users");
            return userStore.find(username);
        };

        this.getUserCredentials = function(username) {
            var credentials = properties.organisationSettings.userCredentials[platformUtils.platform];
            var userPassword = (username === "superadmin" || username === "projectadmin") ? credentials[username] : credentials.project_user;
            return { username: username, password: userPassword };
        };

        this.getUserRoles = function (roleNames) {
            var store = db.objectStore("userRoles");
            return store.getAll().then(function (roles) {
                return _.filter(roles, function (role) {
                    return _.contains(roleNames, role.name);
                });
            });
        };

        this.upsertUserRoles = function (userRoles) {
            var store = db.objectStore("userRoles");
            store.upsert(userRoles);
        };
    };
});