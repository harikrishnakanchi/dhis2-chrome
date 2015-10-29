define(["chromeUtils"], function(chromeUtils) {
    return function($scope, $location, $rootScope, packagedDataImporter, sessionHelper, systemSettingRepository) {
        var triggerImportAndSync = function() {
            packagedDataImporter.run().then(function() {
                chromeUtils.sendMessage("dbReady");
            });
            chromeUtils.sendMessage("productKeyDecrypted");
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
    };
});
