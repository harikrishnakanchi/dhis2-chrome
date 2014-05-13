    define(["lodash"], function(_) {
        return function($scope, $q, dataService, $rootScope) {
            var dataValues = [];
            var ORG_UNIT = "proj_104";

            var onSuccess = function(response) {
                $scope.isSyncRunning = false;
                $scope.isSyncDone = true;
            };

            var saveToDb = function(response) {
                return dataService.saveToDb(response.dataValues, ORG_UNIT);
            };

            $scope.syncNow = function() {
                $scope.isSyncRunning = true;
                dataService.get(ORG_UNIT).then(saveToDb).then(onSuccess);
            };

            $scope.canEnterData = function() {
                if ($rootScope.currentUser === undefined)
                    return false;
                var allowedRoles = ["Data entry user"];
                return _.any($rootScope.currentUser.userCredentials.userAuthorityGroups, function(userAuth) {
                    return _.contains(allowedRoles, userAuth.name);
                });
            };

            $scope.canViewOrManageProjects = function() {
                if ($rootScope.currentUser === undefined)
                    return false;

                var allowedRoles = ["Superuser"];
                return _.any($rootScope.currentUser.userCredentials.userAuthorityGroups, function(userAuth) {
                    return _.contains(allowedRoles, userAuth.name);
                });
            };

            $scope.canTriggerDataSync = function() {
                if ($rootScope.currentUser === undefined)
                    return false;

                var allowedRoles = ["Superuser", "Data entry user", "Approver - Level 1", "Approver - Level 2"];
                return _.any($rootScope.currentUser.userCredentials.userAuthorityGroups, function(userAuth) {
                    return _.contains(allowedRoles, userAuth.name);
                });
            };

        };
    });