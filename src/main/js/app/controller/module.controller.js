define([], function() {
    return function($scope) {
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

    };
});