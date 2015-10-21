define(["chromeUtils"], function(chromeUtils) {
    return function($scope, $location, $rootScope, packagedDataImporter, sessionHelper, systemSettingRepository) {
        var triggerImportAndSync = function() {
            packagedDataImporter.run().then(function() {
                chromeUtils.sendMessage("dbReady");
            });
            chromeUtils.sendMessage("productKeyDecrypted");
        };

        $scope.setAuthHeaderAndProceed = function() {
            var productKey = {
                "key": "productKey",
                "value": $scope.productKey
            };
            systemSettingRepository.upsertProductKey(productKey).then(function() {
                triggerImportAndSync();
                if ($rootScope.currentUser)
                    sessionHelper.logout();
                $location.path("/login");
            });
        };
    };
});
