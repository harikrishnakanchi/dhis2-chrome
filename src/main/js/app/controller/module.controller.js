define(["lodash", "orgUnitMapper", "moment", "md5"], function(_, orgUnitMapper, moment, md5) {
    return function($scope, orgUnitService, db, $location) {
        var init = function() {
            var setDatasets = function(datasets) {
                $scope.dataSets = datasets;
            };
            var store = db.objectStore("dataSets");
            store.getAll().then(setDatasets);
        };

        $scope.modules = [{
            'openingDate': moment().format("YYYY-MM-DD"),
            'datasets': []
        }];

        $scope.addModules = function() {
            $scope.modules.push({
                'openingDate': moment().format("YYYY-MM-DD"),
                'datasets': []
            });
        };

        $scope.save = function(modules) {
            var parent = $scope.orgUnit;
            var associateDatasets = function() {
                var datasets = orgUnitMapper.mapToDataSets(modules, parent);
                orgUnitService.mapDataSetsToOrgUnit(datasets).then(function(data) {
                    $scope.saveSuccess = true;
                    $location.hash([$scope.orgUnit.id, data]);
                });
            };


            var moduleDatasets = orgUnitMapper.mapToModules(modules, parent);
            orgUnitService.create(moduleDatasets).then(associateDatasets);
        };

        $scope.delete = function(index) {
            $scope.modules.splice(index, 1);
        };

        init();
    };
});