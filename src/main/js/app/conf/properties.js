define([], function() {
    return {
        "metadata": {
            "sync": {
                "intervalInMinutes": 1,
            },
            "types": ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "organisationUnits", "organisationUnitLevels"],
            "url": "http://localhost:8080/api/metaData",
            "auth_header": "Basic YWRtaW46ZGlzdHJpY3Q=",
        }
    };
});