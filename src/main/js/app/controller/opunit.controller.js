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
                            "name": "Type",
                            "id": "TypeAttr"
                        },
                        "value": type
                    }]
                });
            });

            var onSuccess = function(data) {
                $scope.saveSuccess = true;
                $location.hash(data);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDb = function() {
                var store = db.objectStore("organisationUnits");
                return store.upsert(newOpUnits);
            };

            return orgUnitService.create(newOpUnits).then(saveToDb).then(onSuccess, onError);
        };

        $scope.delete = function(index) {
            $scope.opUnits.splice(index, 1);
        };
    };
});