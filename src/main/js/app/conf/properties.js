define(['lodash', 'overrides'], function(_, overrides) {
    var url = "http://localhost:8080";
    var properties = {
        "metadata": {
            "sync": {
                "intervalInMinutes": 720,
            },
            "types": ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements",
                "sections", "organisationUnitLevels", "users", "optionSets", "translations", "organisationUnitGroupSets", "dataElementGroups"
            ]
        },
        "http": {
            "timeout": 180000
        },
        "projectDataSync": {
            "intervalInMinutes": 720,
            "numWeeksToSync": 12,
            "numWeeksToSyncOnFirstLogIn": 12
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
            "skipRetryMessages": ["downloadMetadata", "downloadProjectData"],
            "retryDelayConfig": {
                0: 10000,
                1: 10000,
                2: 10000,
                3: 10000,
                4: 10000
            },
            "checkMsgcountDelayInMinutes": 1
        },
        "eventsSync": {
            "numberOfDaysToAllowResubmit": 3
        },
        "logging": {
            "maxAgeinHours": 168
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