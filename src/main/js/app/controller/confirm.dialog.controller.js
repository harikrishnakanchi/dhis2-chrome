define([], function() {
    var lostChangesDialog = function($scope, $modalInstance) {
        $scope.modalTitle = $scope.modalMessages.title || "";
        $scope.okLabel = $scope.modalMessages.ok || $scope.resourceBundle.yesLabel;
        $scope.cancelLabel = $scope.modalMessages.cancel || $scope.resourceBundle.cancelLabel;
        $scope.confirmationMessage = $scope.modalMessages.confirmationMessage;

        var resetMessages = function() {
        	$scope.modalMessages = {};
        };

        $scope.ok = function() {
        	resetMessages();
            $modalInstance.close();
        };


        $scope.cancel = function() {
        	resetMessages();
            $modalInstance.dismiss('cancel');
        };
    };

    return lostChangesDialog;
});