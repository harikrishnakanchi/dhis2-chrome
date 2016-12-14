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

        var upsertLocale = function (locale) {
            var localeJson = {"key": "locale", "value": locale};
            var store = db.objectStore("systemSettings");
            return store.upsert(localeJson).then(function () {
                return localeJson;
            });
        };

        var get = function(key) {
            var store = db.objectStore("systemSettings");
            return store.find(key).then(function(setting) {
                return setting ? setting.value : $q.reject();
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

        var getLocale = function () {
            var returnLocale = function(locale) {
                return locale || 'en';
            };
            var catchBlock = returnLocale;
            return get("locale").then(returnLocale, catchBlock);
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

            var returnPraxisUid = function (uId) {
                return uId;
            };

            return get(praxisUidKey).then(returnPraxisUid, createPraxisUid);
        };

        var getStandardDeviationValue = function () {
            return get('standardDeviationValue').then(function (standardDeviationValue) {
                return parseFloat(standardDeviationValue);
            }, function () {
                return 1.25;
            });
        };

        return {
            "upsert": upsert,
            "upsertProductKey": upsertProductKey,
            "upsertLocale": upsertLocale,
            "get": get,
            "getDhisUrl": getDhisUrl,
            "getAuthHeader": getAuthHeader,
            "getLocale": getLocale,
            "isKeyGeneratedFromProd": isKeyGeneratedFromProd,
            "isProductKeySet": isProductKeySet,
            "loadProductKey": loadProductKey,
            "getAllowedOrgUnits": getAllowedOrgUnits,
            "getProductKeyLevel": getProductKeyLevel,
            "getPraxisUid": getPraxisUid,
            "getStandardDeviationValue": getStandardDeviationValue
        };
    };
});
