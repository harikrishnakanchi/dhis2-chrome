define(["toTree"], function(toTree) {
    return function($scope, db, projectsService, $q) {
        $scope.organisationUnits = [];
        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var save = function(args) {
            var orgUnits = args[0];
            $scope.orgUnitLevelsMap = _.transform(args[1], function(result, orgUnit) {
                result[orgUnit.level] = orgUnit.name;
            }, {});
            $scope.organisationUnits = toTree(orgUnits);
        };

        var init = function() {
            $q.all([getAll("organisationUnits"), getAll("organisationUnitLevels")]).then(save);
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