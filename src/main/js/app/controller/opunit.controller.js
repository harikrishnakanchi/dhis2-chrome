define(["lodash", "dhisId", "moment", "orgUnitMapper"], function(_, dhisId, moment, orgUnitMapper) {
    return function($scope, $q, $hustle, orgUnitRepository, db, $location, $modal) {
        $scope.isDisabled = false;
        $scope.hospitalUnitCodes = ['Unit Code - A', 'Unit Code - B1', 'Unit Code - C1', 'Unit Code - C2', 'Unit Code - C3', 'Unit Code - X'];
        $scope.opUnits = [{
            'openingDate': moment().format("YYYY-MM-DD")
        }];

        $scope.addOpUnits = function() {
            $scope.opUnits.push({
                'openingDate': moment().format("YYYY-MM-DD")
            });
        };

        var saveToDhis = function(data) {
            return $hustle.publish({
                "data": data,
                "type": "upsertOrgUnit"
            }, "dataValues");
        };

        $scope.save = function(opUnits) {
            var parent = $scope.orgUnit;
            var newOpUnits = _.map(opUnits, function(opUnit) {
                var opUnitType = opUnit.type;
                var hospitalUnitCode = opUnit.hospitalUnitCode;
                opUnit = _.omit(opUnit, ['type', 'hospitalUnitCode']);
                return _.merge(opUnit, {
                    'id': dhisId.get(opUnit.name + parent.id),
                    'shortName': opUnit.name,
                    'level': parseInt(parent.level) + 1,
                    'parent': _.pick(parent, "name", "id"),
                    "attributeValues": [{
                        "attribute": {
                            "id": "52ec8ccaf8f",
                            "code": "opUnitType"
                        },
                        "value": opUnitType
                    }, {
                        "attribute": {
                            "id": "a1fa2777924",
                            "code": "Type"
                        },
                        "value": "Operation Unit"
                    }, {
                        "attribute": {
                            "id": "c6d3c8a7286",
                            "code": "hospitalUnitCode"

                        },
                        "value": hospitalUnitCode
                    }]
                });
            });

            parent.children = parent.children.concat(newOpUnits);

            var onSuccess = function(data) {
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm($scope.orgUnit, "savedOpUnit");
            };

            var onError = function(data) {
                $scope.saveFailure = true;
            };

            return orgUnitRepository.upsert(parent).then(function() {
                return orgUnitRepository.upsert(newOpUnits)
                    .then(saveToDhis)
                    .then(onSuccess, onError);
            });
        };

        $scope.delete = function(index) {
            $scope.opUnits.splice(index, 1);
        };

        var disableOpunit = function(orgUnit) {
            return orgUnitRepository.getAllModulesInProjects([orgUnit.id]).then(function(orgUnitsToDisable) {
                orgUnitsToDisable.push(orgUnit);
                var payload = orgUnitMapper.disable(orgUnitsToDisable);
                $scope.isDisabled = true;

                return $q.all([orgUnitRepository.upsert(payload), saveToDhis(orgUnitsToDisable)]).then(function() {
                    if ($scope.$parent.closeNewForm) $scope.$parent.closeNewForm(orgUnit, "disabledOpUnit");
                });
            });
        };

        var showModal = function(okCallback, message) {
            $scope.modalMessage = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm.dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        $scope.disable = function(orgUnit) {
            showModal(function() {
                disableOpunit(orgUnit);
            }, $scope.resourceBundle.disableOrgUnitConfirmationMessage);
        };

        var init = function() {
            if (!$scope.isNewMode) {
                $scope.opUnits = [{
                    'name': $scope.orgUnit.name,
                    'type': _.find($scope.orgUnit.attributeValues, {
                        "attribute": {
                            "code": "opUnitType"
                        }
                    }).value,
                    'hospitalUnitCode': _.find($scope.orgUnit.attributeValues, {
                        "attribute": {
                            "code": "hospitalUnitCode"
                        }
                    }).value,
                }];
                var isDisabled = _.find($scope.orgUnit.attributeValues, {
                    "attribute": {
                        "code": "isDisabled"
                    }
                });
                $scope.isDisabled = isDisabled && isDisabled.value;
            } else {
                orgUnitRepository.getAll().then(function(allOrgUnits) {
                    $scope.allOpUnits = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
                });
            }
        };

        init();
    };
});