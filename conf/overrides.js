define([], function() {
    var url = "/* @echo DHIS_URL */";
    var auth_header = "Basic " + "/* @echo DHIS_AUTH */";
    var metdataSyncInterval = "/* @echo METADATA_SYNC_INTERVAL */";

    return {
        "dhisPing": {
            "url": url + "/favicon.ico"
        },
        "dhis": {
            "url": url,
            "auth_header": auth_header
        },
        "metadata": {
            "sync": {
                "intervalInMinutes": parseInt(metdataSyncInterval)
            },
            "types": ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections", "organisationUnits", "organisationUnitLevels", "users", "programStages", "optionSets"],
        },
        "devMode": false
    };
});
