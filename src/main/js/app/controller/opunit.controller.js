define(["lodash", "md5", "moment", "orgUnitMapper"], function(_, md5, moment, orgUnitMapper) {
    return function($scope, $hustle, orgUnitService, orgUnitRepository, db, $location) {
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
                var opUnitType = opUnit.type;
                opUnit = _.omit(opUnit, 'type');
                return _.merge(opUnit, {
                    'id': md5(opUnit.name + parent.id).substr(0, 11),
                    'shortName': opUnit.name,
                    'level': parseInt(parent.level) + 1,
                    'parent': _.pick(parent, "name", "id"),
                    "attributeValues": [{
                        "attribute": {
                            "id": "52ec8ccaf8f"
                        },
                        "value": opUnitType
                    }, {
                        "attribute": {
                            "id": "a1fa2777924"
                        },
                        "value": "Operation Unit"
                    }]
                });
            });

            var onSuccess = function(data) {
                if ($scope.$parent.closeEditForm)
                    $scope.$parent.closeEditForm($scope.orgUnit.id, "savedOpUnit");
            };

            var onError = function(data) {
                $scope.saveFailure = true;
            };

            orgUnitService.create(newOpUnits).then(onSuccess, onError);
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
            } else {
                orgUnitService.getAll("organisationUnits").then(function(allOrgUnits) {
                    $scope.allOpUnits = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                });
            }
        };

        init();
    };
});