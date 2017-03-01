define([], function() {
    return {
        dhis: {
            authHeader: 'Basic YWRtaW46ZGlzdHJpY3Q=',
            productKeyLevel: 'global'
        },
        support_email: 'supportEmail',
        organisationSettings: {
            geographicOriginDisabled: false,
            referralLocationDisabled: false,
            userNameValidations: {
                "Data entry user": "PROJECT_CODE_PREFIX",
                "Project Level Approver": "PROJECT_CODE_PREFIX",
                "Observer": "PROJECT_CODE_PREFIX",
                "Coordination Level Approver": "EMAIL"
            }
        }
    };
});