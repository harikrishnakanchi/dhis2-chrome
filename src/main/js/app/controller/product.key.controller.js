define(["productKeyUtils"], function(productKeyUtils) {
    return function($scope, $location, $rootScope, $modal, packagedDataImporter, sessionHelper, systemSettingRepository) {
        var onSuccess = function() {
            $scope.isKeyInvalid = false;

            if ($rootScope.currentUser) sessionHelper.logout();
            $location.path("/login");
        };

        var onFailure = function() {
            $scope.isKeyInvalid = true;
        };

        var updateProductKey = function () {
            var productKey = {
                "key": "productKey",
                "value": $scope.productKey
            };
            return systemSettingRepository.upsertProductKey(productKey).then(onSuccess, onFailure);
        };

        $scope.setAuthHeaderAndProceed = function() {
            var allowedOrgUnits = systemSettingRepository.getAllowedOrgUnits();
            if (_.isUndefined(allowedOrgUnits))
                return updateProductKey();

            var allowedOrgUnitIds = _.map(allowedOrgUnits, 'id');
            var newlyEnteredProductKey = productKeyUtils.decrypt($scope.productKey);
            var allowedOrgUnitIdsFromNewProductKey = _.map(newlyEnteredProductKey && newlyEnteredProductKey.data.allowedOrgUnits, 'id');

            if (newlyEnteredProductKey && !_.isEqual(allowedOrgUnitIds, allowedOrgUnitIdsFromNewProductKey)) {
                return showModal(updateProductKey);
            }
            return updateProductKey();
        };

        var showModal = function(okCallback) {
            var scope = $rootScope.$new();
            scope.modalMessages = {
                "ok": $scope.resourceBundle.okLabel,
                "title": $scope.resourceBundle.updateProductKeyMenuLabel,
                "confirmationMessage": "Are you sure you want to update the product key?"
            };

            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: scope
            });

            return modalInstance.result.then(okCallback);
        };

        var previousLocation = $location.search().prev;
        $scope.showBackButton = !!previousLocation;

        $scope.back = function () {
            $location.path(previousLocation).search({});
        };
    };
});
