define([], function() {
    var build = function(data) {
        return [{
            "dataElement": "ab9634a7827",
            "period": data.period,
            "orgUnit": "e3e286c6ca8",
            "categoryOptionCombo": "a5f3ef21762",
            "value": data.values[0] || "5",
            "storedBy": "prj_user",
            "created": data.lastUpdated || "2015-01-08T00:00:00",
            "lastUpdated": data.lastUpdated || "2015-01-08T00:00:00",
            "followUp": false
        }, {
            "dataElement": "ab9634a7827",
            "period": data.period,
            "orgUnit": "e3e286c6ca8",
            "categoryOptionCombo": "a71450caa89",
            "value": data.values[1] || "5",
            "storedBy": "prj_user",
            "created": data.lastUpdated || "2015-01-08T00:00:00",
            "lastUpdated": data.lastUpdated || "2015-01-08T00:00:00",
            "followUp": false
        }];
    };

    return {
        "build": build
    };
});
