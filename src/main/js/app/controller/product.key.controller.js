define(["chromeUtils", "cipherUtils"], function(chromeUtils, cipherUtils) {
    return function($scope, $location, $rootScope, metadataImporter) {
        var triggerImportAndSync = function() {
            metadataImporter.run();
            chromeUtils.sendMessage("productKeyDecrypted");
        };

        $scope.setAuthHeaderAndProceed = function() {
            try {
                var decryptedProductKey = cipherUtils.decrypt($scope.productKey);

                chromeUtils.setAuthHeader(decryptedProductKey);
                $rootScope.auth_header = decryptedProductKey;

                triggerImportAndSync();
                $location.path("/login");
            } catch (err) {
                $scope.isKeyInvalid = true;
            }
        };
    };
});
