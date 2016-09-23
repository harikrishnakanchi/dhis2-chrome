define([], function () {
   return function ($scope, $modalInstance) {
       $scope.okLabel = $scope.modalMessages.ok || $scope.resourceBundle.yesLabel;
       $scope.confirmationMessage = $scope.modalMessages.confirmationMessage;

       $scope.ok = function () {
           $modalInstance.close('cancel');
       };
   };
});