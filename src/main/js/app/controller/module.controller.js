define(["lodash", "orgUnitMapper", "moment", "md5"], function(_, orgUnitMapper, moment, md5) {
    return function($scope, orgUnitService, db, $location) {
        var init = function() {
            var leftPanedatasets = [];
            var setUpEditForm = function() {
                $scope.modules = [];

                var store = db.objectStore("dataSets");
                store.getAll().then(function(datasets) {
                    $scope.allDatasets = datasets;
                    $scope.addModules();
                });
            };

            var setUpView = function() {
                orgUnitService.getDatasetsAssociatedWithOrgUnit($scope.orgUnit).then(function(associatedDatasets) {
                    $scope.modules = [{
                        'name': $scope.orgUnit.name,
                        'datasets': associatedDatasets
                    }];

                    var store = db.objectStore("dataSets");
                    store.getAll().then(function(allDatasets) {
                        _.each($scope.modules, function(module) {
                            module.allDatasets = _.reject(allDatasets, function(dataset) {
                                return _.any(associatedDatasets, dataset);
                            });
                        });
                    });
                });
            };

            if ($scope.isEditMode)
                setUpEditForm();
            else
                setUpView();
        };

        $scope.addModules = function() {
            $scope.modules.push({
                'openingDate': moment().format("YYYY-MM-DD"),
                'datasets': [],
                'allDatasets': _.clone($scope.allDatasets, true),
            });
        };

        $scope.save = function(modules) {
            var parent = $scope.orgUnit;
            var associateDatasets = function() {
                var datasets = orgUnitMapper.mapToDataSets(modules, parent);
                orgUnitService.associateDataSetsToOrgUnit(datasets).then(function(data) {
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