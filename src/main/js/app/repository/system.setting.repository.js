define(["lodash", "cipherUtils", "properties", "dhisId"], function(_, cipherUtils, properties, dhisId) {
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
            $rootScope.authHeader = decryptedProductKey.data.authHeader;
            $rootScope.dhisUrl = decryptedProductKey.data.dhisUrl;
            $rootScope.productKeyLevel = decryptedProductKey.data.productKeyLevel;
            $rootScope.allowedOrgUnits = decryptedProductKey.data.allowedOrgUnits;

            $rootScope.isKeyGeneratedFromProd = decryptedProductKey.keyGeneratedFromProd;
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
                return setting ? setting.value : setting;
            });
        };

        var getDhisUrl = function() {
            if (properties.devMode && _.isUndefined($rootScope.dhisUrl))
                return properties.dhis.url;

            return $rootScope.dhisUrl;
        };

        var getAuthHeader = function() {
            if (properties.devMode && _.isUndefined($rootScope.authHeader))
                return properties.dhis.authHeader;

            return $rootScope.authHeader;
        };

        var getProductKeyLevel = function() {
            if (properties.devMode && _.isUndefined($rootScope.productKeyLevel))
                $rootScope.productKeyLevel = properties.dhis.productKeyLevel;
            return $rootScope.productKeyLevel;
        };

        var getAllowedOrgUnits = function() {
            if (properties.devMode && _.isUndefined($rootScope.allowedOrgUnits))
                return undefined;

            return $rootScope.allowedOrgUnits;
        };

        var isKeyGeneratedFromProd = function() {
            return $rootScope.isKeyGeneratedFromProd || false;
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

        var getPraxisUid = function () {
            var praxisUidKey = "praxisUid";

            var createPraxisUid = function () {
                var uId = dhisId.get("b1gstr1ngWhichHa5Prax1sUid");
                return upsert({"key": praxisUidKey, "value": uId})
                    .then(function (setting) {
                        return setting.value;
                    });
            };

            return get(praxisUidKey)
                .then(function (uId) {
                    return uId || createPraxisUid();
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
            "getProductKeyLevel": getProductKeyLevel,
            "getPraxisUid": getPraxisUid
        };
    };
});
