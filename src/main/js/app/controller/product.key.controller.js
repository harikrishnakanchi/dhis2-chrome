define(["platformUtils"], function(platformUtils) {
    return function($scope, $location, $rootScope, packagedDataImporter, sessionHelper, systemSettingRepository) {
        var triggerImportAndSync = function() {
            packagedDataImporter.run().then(function() {
                platformUtils.sendMessage("dbReady");
            });
            platformUtils.sendMessage("productKeyDecrypted");
        };

        var onSuccess = function() {
            $scope.isKeyInvalid = false;
            triggerImportAndSync();
            if ($rootScope.currentUser)
                sessionHelper.logout();
            $location.path("/login");
        };

        var onFailure = function() {
            $scope.isKeyInvalid = true;
        };

        $scope.setAuthHeaderAndProceed = function() {
            var productKey = {
                "key": "productKey",
                "value": $scope.productKey
            };
            systemSettingRepository.upsertProductKey(productKey).then(onSuccess, onFailure);
        };

        var previousLocation = $location.search().prev;
        $scope.showBackButton = !!previousLocation;

        $scope.back = function () {
            $location.path(previousLocation).search({});
        };
    };
});
