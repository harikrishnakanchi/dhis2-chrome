define(['lodash', 'overrides'], function(_, overrides) {
    var url = "http://localhost:8080";
    var properties = {
        "metadata": {
            "sync": {
                "intervalInMinutes": 720,
            },
            "types": ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "sections", "organisationUnitLevels", "users", "programStages", "optionSets", "indicators", "translations"]
        },
        "http": {
            "timeout": 60000
        },
        "projectDataSync": {
            "intervalInMinutes": 720,
            "numWeeksToSync": 12,
            "numWeeksToSyncOnFirstLogIn": 52
        },
        "dhisPing": {
            "url": url + "/favicon.ico",
            "timeoutInSeconds": 3,
            "retryIntervalInMinutes": 1
        },
        "dhis": {
            "url": url,
            "auth_header": "Basic c2VydmljZS5hY2NvdW50OiFBQkNEMTIzNA==",
        },
        "queue": {
            "maxretries": 5
        },
        "logging": {
            "maxAgeinHours": 720
        },
        "messageTimeout": 5000,
        "devMode": true,
        "weeksForAutoApprove": 8,
        "weeksToDisplayStatusInDashboard": 12
    };

    return _.merge(properties, overrides);
});
