define(["chromeRuntime"], function(chromeRuntime) {

    return function($scope, $location,$rootScope, metadataImporter) {

        var triggerImportAndSync = function() {
            metadataImporter.run();
            chromeRuntime.sendMessage({
                auth_header: true
            });
        };

        $scope.setAuthHeaderAndProceed = function() {
            chrome.storage.local.set({
                "auth_header": $scope.productKey
            });

            $rootScope.auth_header = $scope.productKey;

            triggerImportAndSync();
            $location.path("/login");
        };

    };
});