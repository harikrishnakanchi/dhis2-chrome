define(["dhisUrl", "md5", "moment", "lodashUtils"], function(dhisUrl, md5, moment, _) {
    return function($http) {
        var upsert = function(patientOriginDetails) {
            var key = "origin_details_" + patientOriginDetails.orgUnit;
            var payload = {
                "origins": patientOriginDetails.origins
            };

            return $http({
                "method": "POST",
                "url": dhisUrl.systemSettings + "/" + key,
                "data": JSON.stringify(payload),
                "headers": {
                    "Content-Type": "text/plain"
                }
            });
        };

        var transform = function(response) {
            return _.transform(response.data, function(acc, value, key) {
                if (_.startsWith(key, "origin_details_")) {
                    acc.push({
                        "orgUnit": key.replace("origin_details_", ""),
                        "origins": JSON.parse(value).origins
                    });
                }
            }, []);
        };

        var getAll = function() {
            return $http.get(dhisUrl.systemSettings).then(transform);
        };

        var loadFromFile = function() {};

        return {
            "upsert": upsert,
            "getAll": getAll,
            "loadFromFile": loadFromFile
        };
    };
});
