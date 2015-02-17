define(["dhisUrl", "md5", "moment", "lodashUtils"], function(dhisUrl, md5, moment, _) {
    return function($http) {
        var upsert = function(args) {
            var key = "exclude_" + args.key;
            return $http({
                method: 'POST',
                url: dhisUrl.systemSettings + '/' + key,
                data: JSON.stringify(args.value),
                headers: {
                    'Content-Type': 'text/plain'
                }
            });
        };

        var transform = function(response) {
            var result = [];
            _.transform(response.data, function(acc, value, key) {
                if (_.startsWith(key, 'exclude_')) {
                    result.push({
                        "key": key.replace('exclude_', ''),
                        "value": JSON.parse(value)
                    });
                }
            });
            return result;
        };

        var getAll = function() {
            return $http.get(dhisUrl.systemSettings).then(transform);
        };

        return {
            "upsert": upsert,
            "getAll": getAll
        };
    };
});