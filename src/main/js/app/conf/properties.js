define(['lodash', 'overrides'], function(_, overrides) {
    var url = "http://localhost:8080";
    var properties = {
        "metadata": {
            "sync": {
                "intervalInMinutes": 1,
            },
            "types": ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "organisationUnits", "organisationUnitLevels", "users"],
        },
        "http": {
            "timeout": 10000
        },
        "projectDataSync": {
            "intervalInMinutes": 1,
            "numWeeksToSync": 4
        },
        "dhisPing": {
            "url": url + "/favicon.ico",
            "timeoutInSeconds": 3,
            "retryIntervalInMinutes": 1
        },
        "dhis": {
            "url": url,
            "auth_header": "Basic c2VydmljZS5hY2NvdW50Okkxb1Y2Y29HNWVkMw==",
        },
        "queue": {
            "maxretries": 5
        },
        "messageTimeout": 5000,
        "devMode": true
    };

    return _.merge(properties, overrides);
});