define(["toTree"], function(toTree) {
    return function($scope, db, projectsService, $q) {
        $scope.organisationUnits = [];
        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var transformToTree = function(args) {
            var orgUnits = args[0];
            var orgUnitLevels = args[1];
            $scope.organisationUnits = toTree(orgUnits, orgUnitLevels);
        };

        var init = function() {
            $q.all([getAll("organisationUnits"), getAll("organisationUnitLevels")]).then(transformToTree);
        };

        $scope.onOrgUnitSelect = function(orgUnit) {
            $scope.orgUnit = orgUnit;
        };

        $scope.save = function(orgUnit) {
            var onSuccess = function() {
                $scope.saveSuccess = true;
            };

            var onError = function() {
                $scope.saveSuccess = false;
            };

            return projectsService.create(orgUnit).then(onSuccess, onError);
        };

        init();
    };
});