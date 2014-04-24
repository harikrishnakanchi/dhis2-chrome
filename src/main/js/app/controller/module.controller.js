define([], function() {
    return function($scope, orgUnitService, db, $location) {
        var init = function() {
            var setDatasets = function(datasets) {
                $scope.dataSets = datasets;
            };
            var store = db.objectStore("dataSets");
            $scope.rightList = [];
            store.getAll().then(setDatasets);
        };

        $scope.modules = [{
            'openingDate': new Date()
        }];

        $scope.addModules = function() {
            $scope.modules.push({
                'openingDate': new Date()
            });
        };

        $scope.save = function(modules) {

        };

        $scope.delete = function(index) {
            $scope.modules.splice(index, 1);
        };

        init();
    };
});