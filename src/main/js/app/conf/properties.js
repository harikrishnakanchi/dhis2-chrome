define(['lodash', 'overrides', 'platformConfig'], function(_, overrides, platformConfig) {
    var url = 'http://localhost:8080';
    var properties = {
        metadata: {
            sync: {
                intervalInMinutes: 720
            }
        },
        http: {
            timeout: 180000
        },
        projectDataSync: {
            intervalInMinutes: 720,
            numWeeksToSync: 12,
            numWeeksToSyncOnFirstLogIn: 12,
            numWeeksForHistoricalData: 52,
            numYearsToSyncYearlyReports: 3
        },
        dhisPing: {
            url: url + '/favicon.ico',
            timeoutInSeconds: 3,
            retryIntervalInMinutes: 1
        },
        dhis: {
            url: url
        },
        praxis: {
            version: '13.0',
            fileExtension: 'prx'
        },
        queue: {
            maxretries: 3,
            delay: 100,
            skipRetryMessages: [],
            maxNumberOfTimesItemCanBeRescued: 5,
            minTimeInSecToIncrementItemRescuedCount: 120,
            httpGetRetryDelay: 10000,
            retryDelayConfig: {
                0: 10000,
                1: 10000,
                2: 10000
            }
        },
        eventsSync: {
            maximumNumberOfEventsToSync: 10000,
            pageSize: {
                eventIds: 1000,
                eventData: 200
            },
            numberOfDaysToAllowResubmit: 3
        },
        logging: {
            maxAgeinHours: 168
        },
        encryption: {
            passphrase: 'My Product Key'
        },
        paging: {
            maxPageRequests: 500
        },
        messageTimeout: 5000,
        devMode: true,
        weeksForAutoApprove: 8,
        weeksToDisplayStatusInDashboard: 12,
        metaDataRetryLimit: 5
    };

    return _.merge(properties, overrides, platformConfig);
});