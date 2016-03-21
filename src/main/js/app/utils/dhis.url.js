define(["properties"], function(properties) {
    var with_host = function(relative_path) {
        return properties.dhis.url + relative_path;
    };

    var filter_fields = function(url) {
        var allMetadataFields = ["attributes", "dataApprovalLevels", "users", "userRoles", "userGroups", "options", "optionSets", "categories", "categoryOptions",
            "categoryCombos", "categoryOptionCombos", "dashboardItems", "dashboards", "dataElementGroups", "dataElementGroupSets", "indicators", "indicatorTypes",
            "organisationUnits", "organisationUnitGroups", "organisationUnitGroupSets", "organisationUnitLevels", "sqlViews", "charts", "reportTables",
            "sections", "dataSets", "eventReports", "eventCharts", "programs", "programStages", "programStageSections", "trackedEntities", "translations"
        ];

        var requiredMetadataFields = properties.metadata.types;
        var fieldsToFilter = _.difference(allMetadataFields, requiredMetadataFields);

        var filterParams = _.reduce(fieldsToFilter, function(result, field, i) {
            return i < fieldsToFilter.length - 1 ? result + field + "=false&" : result + field + "=false";
        }, "?");

        return url + filterParams;
    };

    return {
        "approvalMultipleL1": with_host("/api/completeDataSetRegistrations/multiple"),
        "approvalMultipleL2": with_host("/api/dataApprovals/multiple"),
        "approvalL1": with_host("/api/completeDataSetRegistrations"),
        "approvalL2": with_host("/api/dataApprovals"),
        "approvalStatus": with_host("/api/dataApprovals/status"),
        "dataValueSets": with_host("/api/dataValueSets"),
        "metadata": with_host("/api/metadata"),
        "filteredMetadata": filter_fields(with_host("/api/metadata.json")),
        "events": with_host("/api/events"),
        "systemSettings": with_host("/api/systemSettings"),
        "translations": with_host("/api/translations"),
        "orgUnitGroups": with_host("/api/organisationUnitGroups"),
        "orgUnits": with_host("/api/organisationUnits.json"),
        "users": with_host("/api/users"),
        "getProgramsAndStages": with_host("/api/programs.json?fields=id,name,displayName,organisationUnits,attributeValues,programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]]&paging=false"),
        "dataSets": with_host("/api/dataSets"),
        "charts": with_host("/api/charts"),
        "pivotTables": with_host("/api/reportTables"),
        "analytics": with_host("/api/analytics")
    };
});