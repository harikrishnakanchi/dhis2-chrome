define(['lodash', 'overrides'], function(_, overrides) {
    var url = "http://localhost:8080";
    var properties = {
        "metadata": {
            "sync": {
                "intervalInMinutes": 720,
            },
            "types": ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements",
                "sections", "organisationUnitLevels", "users", "programStages", "optionSets", "indicators", "translations"
            ]
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
            "url": url
        },
        "queue": {
            "maxretries": 5,
            "delay": 100,
            "skipRetryMessages": ["downloadMetadata", "downloadData", "downloadOrgUnit", "downloadOrgUnitGroups", "downloadDatasets",
                "downloadProgram", "downloadEventData", "downloadSystemSetting", "downloadPatientOriginDetails"
            ],
            "retryDelayConfig": {
                0: 10000,
                1: 10000,
                2: 10000,
                3: 10000,
                4: 10000
            },
            "checkMsgcountDelayInMinutes": 1
        },
        "logging": {
            "maxAgeinHours": 720
        },
        "encryption": {
            "passphrase": "My Product Key"
        },
        "messageTimeout": 5000,
        "devMode": true,
        "weeksForAutoApprove": 8,
        "weeksToDisplayStatusInDashboard": 12
    };

    return _.merge(properties, overrides);
});
