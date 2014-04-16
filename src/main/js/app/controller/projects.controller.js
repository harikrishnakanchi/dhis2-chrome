define(["toTree"], function(toTree) {
    return function($scope, db) {
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

        init();
    };
});