define(["properties"], function(properties) {
    var with_host = function(relative_path) {
        return properties.dhis.url + relative_path;
    };

    return {
        "approvalMultipleL1": with_host("/api/completeDataSetRegistrations/multiple"),
        "approvalMultipleL2": with_host("/api/dataApprovals/approvals"),
        "approvalL1": with_host("/api/completeDataSetRegistrations"),
        "unApprovals": with_host("/api/dataApprovals/unapprovals"),
        "approvalStatus": with_host("/api/dataApprovals/status"),
        "dataValueSets": with_host("/api/dataValueSets"),
        "metadata": with_host("/api/metadata"),
        "filteredMetadata": with_host("/api/metadata.json"),
        "events": with_host("/api/events"),
        "systemSettings": with_host("/api/systemSettings"),
        "translations": with_host("/api/translations"),
        "orgUnitGroups": with_host("/api/organisationUnitGroups"),
        "orgUnits": with_host("/api/organisationUnits"),
        "users": with_host("/api/users"),
        "userRoles": with_host("/api/userRoles.json"),
        "programs": with_host("/api/programs"),
        "dataSets": with_host("/api/dataSets"),
        "charts": with_host("/api/charts"),
        "pivotTables": with_host("/api/reportTables"),
        "analytics": with_host("/api/analytics"),
        "dataStore": with_host("/api/dataStore"),
        "categories": with_host("/api/categories.json"),
        "categoryCombos": with_host("/api/categoryCombos.json"),
        "categoryOptionCombos": with_host("/api/categoryOptionCombos.json"),
        "categoryOptions": with_host("/api/categoryOptions.json"),
        "dataElementGroups": with_host("/api/dataElementGroups.json"),
        "dataElements": with_host("/api/dataElements.json"),
        "indicators": with_host("/api/indicators.json"),
        "programIndicators": with_host("/api/programIndicators.json"),
        "optionSets": with_host("/api/optionSets.json"),
        "options": with_host("/api/options.json"),
        "organisationUnitGroupSets": with_host("/api/organisationUnitGroupSets.json"),
        "sections": with_host("/api/sections.json"),
        "organisationUnitGroups": with_host("/api/organisationUnitGroups.json"),
        "systemInfo": with_host("/api/system/info"),
        "attributes": with_host("/api/attributes.json")
    };
});