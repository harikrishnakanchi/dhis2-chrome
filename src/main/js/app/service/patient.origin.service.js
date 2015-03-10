define(["dhisUrl", "md5", "moment", "lodashUtils"], function(dhisUrl, md5, moment, _) {
    return function($http) {
        var upsert = function(args) {

        };

        var getAll = function() {
            return $http.get(dhisUrl.patientOriginDetails);
        };

        var loadFromFile = function() {};

        return {
            "upsert": upsert,
            "getAll": getAll,
            "loadFromFile": loadFromFile
        };
    };
});
