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

        $scope.getModuleNameId = function(index) {
            return "moduleName" + index;
        };

        $scope.shouldShow = function(i) {
            var form = $scope['form' + i];
            return form && form.moduleName && form.moduleName.$dirty && form.moduleName.$invalid;
        };
    };
});