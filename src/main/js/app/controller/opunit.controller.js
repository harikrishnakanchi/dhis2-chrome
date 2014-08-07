define(["lodash", "dhisId", "moment", "orgUnitMapper"], function(_, dhisId, moment, orgUnitMapper) {
    return function($scope, $hustle, orgUnitRepository, db, $location) {
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
                    'id': dhisId.get(opUnit.name + parent.id),
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

            var saveToDhis = function(data) {
                return $hustle.publish({
                    "data": data,
                    "type": "upsertOrgUnit"
                }, "dataValues");
            };

            var onSuccess = function(data) {
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm($scope.orgUnit, "savedOpUnit");
            };

            var onError = function(data) {
                $scope.saveFailure = true;
            };

            return orgUnitRepository.upsert(newOpUnits)
                .then(saveToDhis)
                .then(onSuccess, onError);
        };

        $scope.delete = function(index) {
            $scope.opUnits.splice(index, 1);
        };

        var init = function() {
            if (!$scope.isNewMode) {
                $scope.opUnits = [{
                    'name': $scope.orgUnit.name,
                    'type': _.find($scope.orgUnit.attributeValues, {
                        "attribute": {
                            "id": "52ec8ccaf8f"
                        }
                    }).value
                }];
            } else {
                orgUnitRepository.getAll().then(function(allOrgUnits) {
                    $scope.allOpUnits = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                });
            }
        };

        init();
    };
});