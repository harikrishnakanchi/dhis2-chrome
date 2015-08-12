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

        var loadFromFile = function() {
            return $http.get("/data/systemSettings.json").then(transform);
        };

        var upsertReferralLocations = function(args) {
            var key = "referralLocations_" + args.id;
            var payload = JSON.stringify(_.omit(args, "id"));
            return $http({
                "method": "POST",
                "url": dhisUrl.systemSettings + "/" + key,
                "data": payload,
                "headers": {
                    "Content-Type": "text/plain"
                }
            });
        };

        return {
            "upsert": upsert,
            "getAll": getAll,
            "loadFromFile": loadFromFile,
            "upsertReferralLocations": upsertReferralLocations
        };
    };
});
