define(["chromeUtils", "sjcl", "properties"], function(chromeUtils, sjcl, properties) {
    return function($scope, $location, $rootScope, metadataImporter) {
        var triggerImportAndSync = function() {
            metadataImporter.run();
            chromeUtils.sendMessage("productKeyDecrypted");
        };

        var createCipherText = function(productKey) {
            var cipherDetails = JSON.parse(atob(productKey));

            return JSON.stringify({
                "iv": cipherDetails.iv,
                "salt": cipherDetails.salt,
                "ct": cipherDetails.ct,
                "iter": properties.encryption.iter,
                "ks": properties.encryption.ks,
                "ts": properties.encryption.ts,
                "mode": properties.encryption.mode,
                "cipher": properties.encryption.cipher
            });
        };

        $scope.setAuthHeaderAndProceed = function() {
            var decryptedProductKey = sjcl.decrypt(properties.encryption.passphrase, createCipherText($scope.productKey));
            chromeUtils.setAuthHeader(decryptedProductKey);
            $rootScope.auth_header = decryptedProductKey;

            triggerImportAndSync();
            $location.path("/login");
        };
    };
});
