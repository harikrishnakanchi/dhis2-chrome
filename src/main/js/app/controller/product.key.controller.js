define(["chromeUtils", "cipherUtils"], function(chromeUtils, cipherUtils) {
    return function($scope, $location, $rootScope, packagedDataImporter, sessionHelper) {
        var triggerImportAndSync = function() {
            packagedDataImporter.run().then(function() {
                chromeUtils.sendMessage("dbReady");
            });
            chromeUtils.sendMessage("productKeyDecrypted");
        };

        $scope.setAuthHeaderAndProceed = function() {
            try {
                var decryptedProductKey = cipherUtils.decrypt($scope.productKey);
                chromeUtils.setAuthHeader(JSON.parse(decryptedProductKey).authHeader);
                $rootScope.authHeader = JSON.parse(decryptedProductKey).authHeader;
                $rootScope.dhisUrl = JSON.parse(decryptedProductKey).dhisUrl;
                $rootScope.allowedOrgUnits = JSON.parse(decryptedProductKey).allowedOrgUnits;

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
