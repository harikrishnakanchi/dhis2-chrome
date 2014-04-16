define(["toTree"], function(toTree) {
    return function($scope, db, projectsService) {
        $scope.organisationUnits = [];
        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var transformToTree = function(orgUnits) {
            $scope.organisationUnits = toTree(orgUnits);
        };

        var init = function() {
            getAll("organisationUnits").then(transformToTree);
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