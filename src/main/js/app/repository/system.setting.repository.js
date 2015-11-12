define(["lodash", "cipherUtils", "properties"], function(_, cipherUtils, properties) {
    return function(db, $q, $rootScope) {
        var decryptProductKey = function(productKey) {
            return cipherUtils.decrypt(productKey);
        };

        var upsert = function(systemSettings) {
            var store = db.objectStore("systemSettings");
            return store.upsert(systemSettings).then(function() {
                return systemSettings;
            });
        };

        var cacheProductKeyDetails = function(productKey) {
            var decryptedProductKey = JSON.parse(decryptProductKey(productKey));

            $rootScope.appData = {
                "authHeader": decryptedProductKey.data.authHeader,
                "dhisUrl": decryptedProductKey.data.dhisUrl,
                "productKeyLevel": decryptedProductKey.data.productKeyLevel,
                "allowedOrgUnits": decryptedProductKey.data.allowedOrgUnits,
                "isKeyGeneratedFromProd": decryptedProductKey.keyGeneratedFromProd
            };
        };

        var loadProductKey = function() {
            if (properties.devMode)
                return $q.when();

            return get("productKey").then(function(productKey) {
                return cacheProductKeyDetails(productKey);
            });
        };

        var upsertProductKey = function(productKeyJson) {
            try {
                JSON.parse(decryptProductKey(productKeyJson.value));
                cacheProductKeyDetails(productKeyJson.value);

                var store = db.objectStore("systemSettings");
                return store.upsert(productKeyJson).then(function() {
                    return productKeyJson;
                });
            } catch (e) {
                return $q.reject();
            }

        };

        var get = function(key) {
            var store = db.objectStore("systemSettings");
            return store.find(key).then(function(setting) {
                if (setting)
                    return setting.value;
                return $q.reject();
            });
        };

        var getDhisUrl = function() {
            if (properties.devMode && _.isUndefined($rootScope.appData.dhisUrl))
                return properties.dhis.url;

            return $rootScope.appData.dhisUrl;
        };

        var getAuthHeader = function() {
            if (properties.devMode && _.isUndefined($rootScope.appData.authHeader))
                return properties.dhis.authHeader;

            return $rootScope.appData.authHeader;
        };

        var getProductKeyLevel = function() {
            if (properties.devMode && _.isUndefined($rootScope.appData.productKeyLevel))
                return undefined;

            return $rootScope.appData.productKeyLevel;
        };

        var getAllowedOrgUnits = function() {
            if (properties.devMode && _.isUndefined($rootScope.appData.allowedOrgUnits))
                return undefined;

            return $rootScope.appData.allowedOrgUnits;
        };

        var isKeyGeneratedFromProd = function() {
            return $rootScope.appData.isKeyGeneratedFromProd || false;
        };

        var isProductKeySet = function() {
            if (properties.devMode)
                return $q.when(true);

            return get("productKey").then(function(productKey) {
                return productKey !== undefined;
            }, function() {
                return false;
            });
        };

        return {
            "upsert": upsert,
            "upsertProductKey": upsertProductKey,
            "get": get,
            "getDhisUrl": getDhisUrl,
            "getAuthHeader": getAuthHeader,
            "isKeyGeneratedFromProd": isKeyGeneratedFromProd,
            "isProductKeySet": isProductKeySet,
            "loadProductKey": loadProductKey,
            "getAllowedOrgUnits": getAllowedOrgUnits,
            "getProductKeyLevel": getProductKeyLevel
        };
    };
});
