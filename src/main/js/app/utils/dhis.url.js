define(["properties"], function(properties) {
    var with_host = function(relative_path) {
        return properties.dhis.url + '/api/25/' + relative_path;
    };

    return {
        "approvalMultipleL1": with_host("completeDataSetRegistrations/multiple"),
        "approvalMultipleL2": with_host("dataApprovals/approvals"),
        "approvalL1": with_host("completeDataSetRegistrations"),
        "unApprovals": with_host("dataApprovals/unapprovals"),
        "approvalStatus": with_host("dataApprovals/status"),
        "dataValueSets": with_host("dataValueSets"),
        "metadata": with_host("metadata"),
        "filteredMetadata": with_host("metadata.json"),
        "events": with_host("events"),
        "systemSettings": with_host("systemSettings"),
        "translations": with_host("translations"),
        "orgUnitGroups": with_host("organisationUnitGroups"),
        "orgUnits": with_host("organisationUnits"),
        "users": with_host("users"),
        "userRoles": with_host("userRoles.json"),
        "programs": with_host("programs"),
        "programStageSections": with_host("programStageSections"),
        "dataSets": with_host("dataSets"),
        "charts": with_host("charts"),
        "pivotTables": with_host("reportTables"),
        "eventReports": with_host("eventReports"),
        "analytics": with_host("analytics"),
        "eventAnalytics": with_host("analytics/events/aggregate"),
        "dataStore": with_host("dataStore"),
        "categories": with_host("categories.json"),
        "categoryCombos": with_host("categoryCombos.json"),
        "categoryOptionCombos": with_host("categoryOptionCombos.json"),
        "categoryOptions": with_host("categoryOptions.json"),
        "dataElementGroups": with_host("dataElementGroups.json"),
        "dataElements": with_host("dataElements.json"),
        "indicators": with_host("indicators.json"),
        "programIndicators": with_host("programIndicators.json"),
        "optionSets": with_host("optionSets.json"),
        "options": with_host("options.json"),
        "organisationUnitGroupSets": with_host("organisationUnitGroupSets.json"),
        "sections": with_host("sections.json"),
        "organisationUnitGroups": with_host("organisationUnitGroups.json"),
        "systemInfo": with_host("system/info"),
        "attributes": with_host("attributes.json")
    };
});