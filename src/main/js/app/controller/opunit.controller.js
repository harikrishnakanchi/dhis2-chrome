define(["lodash", "md5", "moment"], function(_, md5, moment) {
    return function($scope, orgUnitService, db, $location) {
        $scope.opUnits = [{
            'openingDate': moment().format("YYYY-MM-DD")
        }];

        $scope.addOpUnits = function() {
            $scope.opUnits.push({
                'openingDate': moment().format("YYYY-MM-DD")
            });
        };

        $scope.save = function(opUnits) {
            var parent = $scope.orgUnit;
            var newOpUnits = _.map(opUnits, function(opUnit) {
                var type = opUnit.type;
                opUnit = _.omit(opUnit, 'type');
                return _.merge(opUnit, {
                    'id': md5(opUnit.name + parent.name).substr(0, 11),
                    'shortName': opUnit.name,
                    'level': parent.level + 1,
                    'parent': _.pick(parent, "name", "id"),
                    "attributeValues": [{
                        "attribute": {
                            "id": "52ec8ccaf8f"
                        },
                        "value": type
                    }, {
                        "attribute": {
                            "id": "a1fa2777924"
                        },
                        "value": "Operation Unit"
                    }]
                });
            });

            orgUnitService.create(newOpUnits).then(function(data) {
                $scope.saveSuccess = true;
                $location.hash([$scope.orgUnit.id, data]);
            });
        };

        $scope.delete = function(index) {
            $scope.opUnits.splice(index, 1);
        };

        var init = function() {
            if (!$scope.isEditMode) {
                $scope.opUnits = [{
                    'name': $scope.orgUnit.name,
                    'type': _.find($scope.orgUnit.attributeValues, {
                        "attribute": {
                            "id": "52ec8ccaf8f"
                        }
                    }).value
                }];
            }
        };

        init();
    };
});