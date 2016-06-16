define([], function() {
    var lostChangesDialog = function($scope, $modalInstance) {
        $scope.okLabel = $scope.resourceBundle.okLabel;
        var description = $scope.description || $scope.resourceBundle.noDescriptionLabel;
        $scope.notificationTitle = $scope.title;
        $scope.notificationMessage = description;
        $scope.isDataPresent = !!$scope.data;

        var resetMessages = function() {
            $scope.notificationMessages = {};
        };

        $scope.ok = function() {
            resetMessages();
            $modalInstance.dismiss('cancel');
        };
    };

    return lostChangesDialog;
});
