define([], function() {
    var lostChangesDialog = function($scope, $modalInstance) {
        $scope.notificationTitle = $scope.notificationMessages.notificationTitle || "";
        $scope.okLabel = $scope.resourceBundle.okLabel;
        $scope.notificationMessage = $scope.notificationMessages.notificationMessage;

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
