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

        var shouldShowModal = function () {
            var allowedOrgUnits = systemSettingRepository.getAllowedOrgUnits();
            var allowedOrgUnitIds = _.map(allowedOrgUnits, 'id');
            var newlyEnteredProductKey = productKeyUtils.decrypt($scope.productKey);

            if (_.isUndefined(allowedOrgUnits) || !newlyEnteredProductKey)
                return false;

            var allowedOrgUnitIdsFromNewProductKey = _.map(newlyEnteredProductKey.data.allowedOrgUnits, 'id');

            if (!_.isEqual(allowedOrgUnitIds, allowedOrgUnitIdsFromNewProductKey)) {
                return true;
            }

        };

        $scope.setAuthHeaderAndProceed = function() {
            if (shouldShowModal()) {
                return showModal(updateProductKey);
            }
            return updateProductKey();
        };

        var showModal = function(okCallback) {
            var scope = $rootScope.$new();
            scope.modalMessages = {
                "ok": $scope.resourceBundle.okLabel,
                "title": $scope.resourceBundle.updateProductKeyMenuLabel,
                "confirmationMessage": $scope.resourceBundle.updateProductKeyMessage
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
