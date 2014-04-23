define(["lodash"], function(_) {
    return function($scope) {
        $scope.opUnits = [{
            'openingDate': new Date()
        }];

        $scope.addOpUnits = function() {
            $scope.opUnits.push({
                'openingDate': new Date()
            });
        };

        $scope.save = function(opUnits) {
            // _.map(opUnits, function(opUnit) {
            //     return _.merge(opUnit, {
            //         'id': md5(orgUnit.name + parent.name).substr(0, 11),
            //         'shortName': orgUnit.name,
            //         'level': parent.level + 1,
            //         'openingDate': moment(orgUnit.openingDate).format("YYYY-MM-DD"),
            //         'parent': _.pick(parent, "name", "id")
            //     });
            // });
        };

        $scope.delete = function(index) {
            $scope.opUnits.splice(index, 1);
        };
    };
});