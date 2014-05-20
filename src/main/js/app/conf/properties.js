define(['lodash', 'overrides'], function(_, overrides) {
    var url = "http://localhost:8080";
    var properties = {
        "metadata": {
            "sync": {
                "intervalInMinutes": 1,
            },
            "types": ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "organisationUnits", "organisationUnitLevels", "users"],
        },
        "dhis": {
            "url": url,
            "auth_header": "Basic c2VydmljZS5hY2NvdW50Okkxb1Y2Y29HNWVkMw==",
        },
        "messageTimeout": 5000,
        "devMode": true
    };

    return _.merge(properties, overrides);
});