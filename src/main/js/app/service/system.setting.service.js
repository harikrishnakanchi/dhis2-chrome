define(["dhisUrl", "md5", "moment", "lodashUtils"], function(dhisUrl, md5, moment, _) {
    return function($http) {
        var upsert = function(args) {
            var key = "exclude_" + args.key;
            return $http({
                "method": "POST",
                "url": dhisUrl.systemSettings + "/" + key,
                "data": JSON.stringify(args.value),
                "headers": {
                    "Content-Type": "text/plain"
                }
            });
        };

        var transform = function(response) {
            var result = [];
            _.transform(response.data, function(acc, value, key) {
                if (_.startsWith(key, "exclude_")) {
                    result.push({
                        "key": key.replace("exclude_", ""),
                        "value": JSON.parse(value)
                    });
                }
                if (key === "moduleTemplates") {
                    result.push({
                        "key": key,
                        "value": value
                    });
                }
            });
            return result;
        };

        var getAll = function() {
            return $http.get(dhisUrl.systemSettings).then(transform);
        };

        var referralLocationKey = function(opUnitId) {
            return "referralLocations_" + opUnitId;
        };

        var upsertReferralLocations = function(payload) {
            var key = referralLocationKey(payload.id);
            return $http({
                "method": "POST",
                "url": dhisUrl.systemSettings + "/" + key,
                "data": JSON.stringify(payload),
                "headers": {
                    "Content-Type": "text/plain"
                }
            });
        };

        var getReferralLocations = function(opUnitIds) {
            var queryParameters = _.map(opUnitIds, function(opUnitId) {
                return "key=" + referralLocationKey(opUnitId);
            });
            var queryString = "?" + queryParameters.join("&");
            return $http.get(dhisUrl.systemSettings + queryString).then(function(response){
                return _.map(response.data, function(value) {
                    return JSON.parse(value);
                });
            });
        };

        return {
            "upsert": upsert,
            "getAll": getAll,
            "upsertReferralLocations": upsertReferralLocations,
            "getReferralLocations": getReferralLocations
        };
    };
});
