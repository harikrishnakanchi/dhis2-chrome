define(["toTree", "lodash", "md5"], function(toTree, _, md5) {
    return function($scope, db, projectsService, $q) {
        $scope.organisationUnits = [];

        $scope.reset = function() {
            $scope.newOrgUnit = {};
            $scope.openCreateForm = false;
        };

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
            $scope.reset();
            $q.all([getAll("organisationUnits"), getAll("organisationUnitLevels")]).then(save);
        };

        $scope.onOrgUnitSelect = function(orgUnit) {
            $scope.reset();
            $scope.orgUnit = orgUnit;
        };

        $scope.save = function(orgUnit, parent) {
            orgUnit = _.merge(orgUnit, {
                'id': md5(orgUnit.name + parent.name).substr(0, 11),
                'shortName': orgUnit.name,
                'level': parent.level + 1,
                'parent': _.pick(parent, "name", "id")
            });
            var onSuccess = function() {
                $scope.saveSuccess = true;
            };

            var onError = function() {
                $scope.saveSuccess = false;
            };

            return projectsService.create(orgUnit).then(onSuccess, onError);
        };

        $scope.getNextLevel = function(orgUnit) {
            return orgUnit ? $scope.orgUnitLevelsMap[orgUnit.level + 1] : undefined;
        };

        $scope.canCreateChild = function(orgUnit) {
            return _.contains(["Country", "Project"], $scope.getNextLevel(orgUnit));
        };

        init();
    };
});