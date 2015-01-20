define(["properties"], function(properties) {
    var with_host = function(relative_path) {
        return properties.dhis.url + relative_path;
    };

    return {
        "approvalMultipleL1": with_host("/api/completeDataSetRegistrations/multiple"),
        "approvalMultipleL2": with_host("/api/dataApprovals/multiple"),
        "approvalMultipleL3": with_host("/api/dataAcceptances/multiple"),
        "approvalL1": with_host("/api/completeDataSetRegistrations"),
        "approvalL2": with_host("/api/dataApprovals"),
        "approvalStatus": with_host("/api/dataApprovals/status"),
        "dataValueSets": with_host("/api/dataValueSets"),
        "metadata": with_host("/api/metadata"),
        "events": with_host("/api/events"),
        "systemSettings": with_host("/api/systemSettings"),
        "translations": with_host("/api/translations"),
        "orgUnitGroups": with_host("/api/organisationUnitGroups.json"),
        "orgUnits": with_host("/api/organisationUnits.json"),
        "users": with_host("/api/users"),
        "programs": with_host("/api/programs.json")
    };
});
