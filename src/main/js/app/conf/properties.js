define(['lodash', 'overrides'], function(_, overrides) {
    var url = "http://localhost:8080";
    var properties = {
        "metadata": {
            "sync": {
                "intervalInMinutes": 1,
            },
            "types": ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "organisationUnits", "organisationUnitLevels"],
        },
        "dhis": {
            "url": url,
            "auth_header": "Basic YWRtaW46ZGlzdHJpY3Q=",
        },
        "messageTimeout": 5000,
        "devMode": true
    };

    return _.merge(properties, overrides);
});