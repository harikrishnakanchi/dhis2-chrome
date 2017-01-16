define([], function() {
    return function($scope, $modalInstance) {
        $scope.ok = function() {
            $modalInstance.dismiss('cancel');
        };
    };
});
