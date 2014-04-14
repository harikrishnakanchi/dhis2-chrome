define([], function() {
    var url = "https://datawhqa.twhosted.com/dhis";
    return {
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
});