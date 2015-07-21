define(["chromeUtils", "cipherUtils"], function(chromeUtils, cipherUtils) {
    return function($scope, $location, $rootScope, metadataImporter, sessionHelper) {
        var triggerImportAndSync = function() {
            metadataImporter.run().then(function() {
                chromeUtils.sendMessage("dbReady");
            });
            chromeUtils.sendMessage("productKeyDecrypted");
        };

        $scope.setAuthHeaderAndProceed = function() {
            try {
                var decryptedProductKey = cipherUtils.decrypt($scope.productKey);
                chromeUtils.setAuthHeader(decryptedProductKey);
                $rootScope.authHeader = decryptedProductKey;

                triggerImportAndSync();
                if ($rootScope.currentUser)
                    sessionHelper.logout();
                $location.path("/login");
            } catch (err) {
                $scope.isKeyInvalid = true;
            }
        };
    };
});
