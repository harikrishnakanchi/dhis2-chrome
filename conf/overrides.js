define([], function() {
    var url = '<%= DHIS_URL %>';
    var metdataSyncInterval = '<%= METADATA_SYNC_INTERVAL %>';
    var passphrase = '<%= PASSPHRASE %>';
    var iter = parseInt('<%= ITER %>');
    var ks = parseInt('<%= KS %>');
    var ts = parseInt('<%= TS %>');
    var supportEmail = '<%= SUPPORT_EMAIL %>';
    var devMode = '<%= DEV_MODE %>';

    return {
        dhisPing: {
            url: url + '/favicon.ico'
        },
        dhis: {
            url: url
        },
        metadata: {
            sync: {
                intervalInMinutes: parseInt(metdataSyncInterval)
            }
        },
        queue: {
            retryDelayConfig: {
                0: 900000,
                1: 900000,
                2: 1800000,
                3: 43200000,
                4: 43200000
            }
        },
        encryption: {
            passphrase: passphrase,
            iter: iter,
            ks: ks,
            ts: ts
        },
        devMode: (devMode === 'true'),
        support_email: supportEmail
    };
});
