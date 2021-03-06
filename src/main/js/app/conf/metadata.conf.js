define([], function () {
    return {
        fields: {
            "categories": {
                params: "id,name,shortName,created,dataDimension,dataDimensionType,lastUpdated,categoryOptions,categoryCombos,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                paging: true
            },
            "categoryCombos": {
                params: "id,name,skipTotal,created,dataDimensionType,lastUpdated,categories,attributeValues[value,attribute[id,code,name]],categoryOptionCombos,translations[value,property,locale]",
                paging: true
            },
            "categoryOptionCombos": {
                params: "id,name,created,shortName,lastUpdated,categoryCombo,categoryOptions,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 200,   // PageSize of 50 : ~12KB
                paging: true
            },
            "categoryOptions": {
                params: "id,name,shortName,created,lastUpdated,dimensionItemType,categories,organisationUnits,categoryOptionCombos,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 200,   // PageSize of 50 : ~12KB
                paging: true
            },
            "dataElementGroups": {
                params: "id,name,shortName,created,lastUpdated,attributeValues[value,attribute[id,code,name]],dataElements,dimensionItemType,translations[value,property,locale]",
                paging: true
            },
            "dataElements": { //TODO Remove name from optionSet and name, code from options once all the fields are updated with 12.0
                params: "id,lastUpdated,created,name,shortName,formName,valueType,dimensionItemType,domainType,optionSetValue,description,optionSet[id,name,options[id,name,code]],categoryCombo,dataElementGroups,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 100,   // PageSize of 50 : ~12KB
                paging: true
            },
            "indicators": {
                params: "id,lastUpdated,created,name,shortName,description,dimensionItem,numerator,denominator,dimensionItemType,indicatorType,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 100,   // PageSize of 50 : ~8KB
                paging: true
            },
            "programIndicators": {
                params: "id,lastUpdated,created,name,shortName,aggregationType,expression,filter,dimensionItemType,program,description,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 100,   // PageSize of 50 : ~6KB
                paging: true
            },
            "optionSets": { // TODO Remove all fields from options once all the fields are updated with 12.0
                params: "id,name,code,created,lastUpdated,valueType,attributeValues[value,attribute[id,code,name]],options[id,name,code,translations[value,property,locale]],translations[value,property,locale]",
                paging: true
            },
            "options": {
                params: "id,name,code,translations[value,property,locale]",
                pageSize: 150,   // PageSize of 150 : ~22KB
                paging: true
            },
            "organisationUnitGroupSets": { //TODO Remove name from organisationUnitGroups once all the fields are updated with 12.0
                params: "id,name,code,shortName,created,lastUpdated,description,dimensionType,dataDimension,organisationUnitGroups[id,name],attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                paging: true
            },
            "sections": {
                params: "id,name,created,lastUpdated,sortOrder,dataSet,attributeValues[value,attribute[id,code,name]],indicators,dataElements,translations[value,property,locale]",
                pageSize: 150,   // PageSize of 50 : ~8KB
                paging: true
            },
            "users": {
                params: "id,firstName,surname,userCredentials[id,username,disabled,userRoles[id,name]],organisationUnits[id,name]",
                pageSize: 200,    // PageSize of 200 : ~10KB
                paging: true
            },
            "userRoles": {
                params: "name,id,displayName,lastUpdated",
                paging: true
            },
            "attributes": {
                params: "id,code,lastUpdated,name,valueType,mandatory",
                paging: true
            },
            "organisationUnitGroups": {
                params: "id,lastUpdated,created,name,shortName,organisationUnitGroupSet,organisationUnits,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                paging: true
            },
            "dataSets": {
                params: "id,lastUpdated,created,name,shortName,code,categoryCombo,workflow,user,sections,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                paging: true
            },
            "programs": { // TODO Remove name & programStageDataElements from programStageSections once all the fields are updated with 12.0
                params: "id,name,displayName,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,sortOrder,programStageDataElements[id,compulsory,dataElement[id,name]],translations[value,property,locale]]],translations[value,property,locale]",
                paging: true
            },
            "programStageSections": {
                params: "id,name,sortOrder,programStageDataElements[id,compulsory,dataElement[id,name]],translations[value,property,locale]",
                paging: true
            },
            "organisationUnits": {
                params: "id,lastUpdated,level,created,name,shortName,openingDate,coordinates,user,ancestors,dataSets,programs,organisationUnitGroups,parent[id,name],attributeValues[value,attribute[id,code,name]]",
                pageSize: 150,   //PageSize of 50 : ~ 9KB-10KB
                paging: true
            },
            "systemSettings": {
                key: "fieldAppSettings,versionCompatibilityInfo,notificationSetting",
                paging: false
            }
        },
        entities: [
            "categories",
            "categoryCombos",
            "categoryOptionCombos",
            "categoryOptions",
            "dataElementGroups",
            "dataElements",
            "indicators",
            "programIndicators",
            "optionSets",
            "options",
            "organisationUnitGroupSets",
            "sections",
            "users",
            "userRoles",
            "attributes",
            "programStageSections"
        ]
    };
});
