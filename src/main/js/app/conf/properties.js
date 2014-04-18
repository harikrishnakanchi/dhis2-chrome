define(['lodash', 'overrides'], function(_, overrides) {
    var url = "https://localhost:8080";
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
        }
    };

    return _.merge(properties, overrides);
});