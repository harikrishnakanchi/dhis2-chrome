define(["lodash", "dhisId", "moment", "orgUnitMapper"], function(_, dhisId, moment, orgUnitMapper) {
    return function($scope, $q, $hustle, orgUnitRepository, orgUnitGroupHelper, db, $location, $modal, patientOriginRepository) {
        $scope.isDisabled = false;
        $scope.hospitalUnitCodes = ['A', 'B1', 'C1', 'C2', 'C3', 'X'];
        $scope.opUnit = {
            'openingDate': moment().format("YYYY-MM-DD")
        };

        var saveToDhis = function(data) {
            return $hustle.publish({
                "data": data,
                "type": "upsertOrgUnit"
            }, "dataValues");
        };

        var onSuccess = function(hustlePayload) {
            var opUnits = hustlePayload === undefined ? [$scope.orgUnit] : hustlePayload.data.data;
            if ($scope.$parent.closeNewForm)
                $scope.$parent.closeNewForm(opUnits[0], "savedOpUnit");
        };

        var onError = function(data) {
            $scope.saveFailure = true;
        };

        var getAttributeValues = function(opUnitType, hospitalUnitCode) {
            hospitalUnitCode = opUnitType === "Hospital" ? hospitalUnitCode : "";
            return [{
                "created": moment().toISOString(),
                "lastUpdated": moment().toISOString(),
                "attribute": {
                    "code": "opUnitType"
                },
                "value": opUnitType
            }, {
                "created": moment().toISOString(),
                "lastUpdated": moment().toISOString(),
                "attribute": {
                    "code": "Type"
                },
                "value": "Operation Unit"
            }, {
                "created": moment().toISOString(),
                "lastUpdated": moment().toISOString(),
                "attribute": {
                    "code": "hospitalUnitCode"
                },
                "value": hospitalUnitCode
            }, {
                "created": moment().toISOString(),
                "lastUpdated": moment().toISOString(),
                "attribute": {
                    "code": "isNewDataModel"
                },
                "value": "true"
            }];
        };

        var publishMessage = function(data, action) {
            return $hustle.publish({
                "data": data,
                "type": action
            }, "dataValues");
        };

        $scope.save = function(opUnit) {
            var parent = $scope.orgUnit;

            opUnit = _.merge(opUnit, {
                'id': dhisId.get(opUnit.name + parent.id),
                'shortName': opUnit.name,
                'level': parseInt(parent.level) + 1,
                'parent': _.pick(parent, "name", "id"),
                "attributeValues": getAttributeValues(opUnit.type, opUnit.hospitalUnitCode)
            });
            opUnit = _.omit(opUnit, ['type', 'hospitalUnitCode']);

            var patientOriginPayload = {
                "orgUnit": opUnit.id,
                "origins": [{
                    "name": "Unknown",
                    "clientLastUpdated": moment().toISOString()
                }]
            };
            return patientOriginRepository.upsert(patientOriginPayload)
                .then(_.partial(publishMessage, patientOriginPayload, "uploadPatientOriginDetails"))
                .then(_.partial(orgUnitRepository.upsert, opUnit))
                .then(saveToDhis)
                .then(onSuccess, onError);
        };

        $scope.update = function(opUnit) {
            opUnit = _.merge(opUnit, {
                'id': $scope.orgUnit.id,
                'shortName': opUnit.name,
                'level': $scope.orgUnit.level,
                'parent': _.pick($scope.orgUnit.parent, "name", "id"),
                'children': $scope.orgUnit.children,
                "attributeValues": getAttributeValues(opUnit.type, opUnit.hospitalUnitCode)
            });
            opUnit = _.omit(opUnit, ['type', 'hospitalUnitCode']);

            var updateOrgUnitGroupsForModules = function() {
                return orgUnitRepository.getAllModulesInOrgUnits($scope.orgUnit.id).then(function(modules) {
                    return orgUnitGroupHelper.createOrgUnitGroups(modules, true);
                });
            };

            return orgUnitRepository.upsert(opUnit)
                .then(saveToDhis).then(updateOrgUnitGroupsForModules)
                .then(onSuccess, onError);
        };

        $scope.closeForm = function() {
            $scope.$parent.closeNewForm($scope.orgUnit);
        };

        var disableOpunit = function(orgUnit) {
            return orgUnitRepository.getAllModulesInOrgUnits([orgUnit.id]).then(function(orgUnitsToDisable) {
                orgUnitsToDisable.push(orgUnit);
                var payload = orgUnitMapper.disable(orgUnitsToDisable);
                $scope.isDisabled = true;

                return $q.all([orgUnitRepository.upsert(payload), saveToDhis(orgUnitsToDisable)]).then(function() {
                    if ($scope.$parent.closeNewForm) $scope.$parent.closeNewForm(orgUnit, "disabledOpUnit");
                });
            });
        };

        var showModal = function(okCallback, message) {
            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        $scope.disable = function(orgUnit) {
            var modalMessages = {
                "confirmationMessage": $scope.resourceBundle.disableOrgUnitConfirmationMessage
            };
            showModal(function() {
                disableOpunit(orgUnit);
            }, modalMessages);
        };

        $scope.reset = function() {
            $scope.opUnit = {
                'openingDate': moment().format("YYYY-MM-DD")
            };
        };

        var setOriginDetails = function(originDetails) {
            if (!_.isEmpty(originDetails)) {
                $scope.originDetails = _.reject(originDetails.origins, function(origin) {
                    return _.isUndefined(origin.longitude) && _.isUndefined(origin.latitude);
                });
            }
        };

        var init = function() {
            if (!$scope.isNewMode) {
                $scope.opUnit = {
                    'name': $scope.orgUnit.name,
                    'openingDate': $scope.orgUnit.openingDate,
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
                };

                var isDisabled = _.find($scope.orgUnit.attributeValues, {
                    "attribute": {
                        "code": "isDisabled"
                    }
                });
                $scope.isDisabled = isDisabled && isDisabled.value === "true" ? true : false;
                patientOriginRepository.get($scope.orgUnit.id).then(setOriginDetails);
            }
            var parentId = $scope.isNewMode ? $scope.orgUnit.id : $scope.orgUnit.parent.id;
            orgUnitRepository.getChildOrgUnitNames(parentId).then(function(data) {
                $scope.allOpunitNames = data;
            });
        };

        init();
    };
});
