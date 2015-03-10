define(["dhisUrl", "md5", "moment", "lodashUtils"], function(dhisUrl, md5, moment, _) {
    return function($http) {
        var upsert = function(patientOriginDetails) {
            var payload = {};
            payload[patientOriginDetails.key] = patientOriginDetails.value;
            return $http({
                method: 'POST',
                url: dhisUrl.patientOriginDetails,
                data: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
        };

        var transform = function(response) {
            var result = [];
            _.transform(response.data, function(acc, value, key) {
                result.push({
                    "key": key,
                    "value": JSON.parse(value)
                });
            });
            return result;
        };

        var getAll = function() {
            return $http.get(dhisUrl.patientOriginDetails).then(transform);
        };

        var loadFromFile = function() {};

        return {
            "upsert": upsert,
            "getAll": getAll,
            "loadFromFile": loadFromFile
        };
    };
});
