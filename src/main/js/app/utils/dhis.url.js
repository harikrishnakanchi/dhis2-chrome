define(["properties"], function(properties) {
    var with_host = function(relative_path) {
        return properties.dhis.url + relative_path;
    };

    return {
        "approvalMultipleL1": with_host("/api/completeDataSetRegistrations/multiple"),
        "approvalMultipleL2": with_host("/api/dataApprovals/multiple"),
        "approvalL1": with_host("/api/completeDataSetRegistrations"),
        "approvalL2": with_host("/api/dataApprovals"),
        "approvalStatus": with_host("/api/dataApprovals/status"),
        "dataValueSets": with_host("/api/dataValueSets"),
        "metadata": with_host("/api/metadata"),
        "filteredMetadata": with_host("/api/metadata.json"),
        "events": with_host("/api/events"),
        "systemSettings": with_host("/api/systemSettings"),
        "translations": with_host("/api/translations"),
        "orgUnitGroups": with_host("/api/organisationUnitGroups"),
        "orgUnits": with_host("/api/organisationUnits.json"),
        "users": with_host("/api/users"),
        "getProgramsAndStages": with_host("/api/programs.json?fields=id,name,displayName,shortName,programType,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]]&paging=false"),
        "dataSets": with_host("/api/dataSets"),
        "charts": with_host("/api/charts"),
        "pivotTables": with_host("/api/reportTables"),
        "analytics": with_host("/api/analytics")
    };
});