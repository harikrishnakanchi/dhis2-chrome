define([], function () {
    return {
        fields: {
            "categories": {
                params: "id,name,shortName,created,dataDimension,dataDimensionType,lastUpdated,categoryOptions,categoryCombos,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]"
            },
            "categoryCombos": {
                params: "id,name,skipTotal,created,dataDimensionType,lastUpdated,categories,attributeValues[value,attribute[id,code,name]],categoryOptionCombos,translations[value,property,locale]"
            },
            "categoryOptionCombos": {
                params: "id,name,created,shortName,lastUpdated,categoryCombo,categoryOptions,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 200   // PageSize of 50 : ~12KB
            },
            "categoryOptions": {
                params: "id,name,shortName,created,lastUpdated,dimensionItemType,categories,organisationUnits,categoryOptionCombos,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 200   // PageSize of 50 : ~12KB
            },
            "dataElementGroups": {
                params: "id,name,shortName,created,lastUpdated,attributeValues[value,attribute[id,code,name]],dataElements,dimensionItemType,translations[value,property,locale]"
            },
            "dataElements": {
                params: ":all,!href,!publicAccess,!externalAccess,!dimensionItem,!zeroIsSignificant,!url,!access,!user,!userGroupAccesses,!aggregationLevels,optionSet[id,name,options[id,name,code]],categoryCombo,dataElementGroups,attributeValues[value,attribute[id,code,name]],dataSets,translations[value,property,locale]",
                pageSize: 100   // PageSize of 50 : ~12KB
            },
            "indicators": {
                params: ":all,!href,!displayName,!publicAccess,!externalAccess,!displayShortName,!access,!userGroupAccesses,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 100   // PageSize of 50 : ~8KB
            },
            "programIndicators": {
                params: ":all,!href,!displayName,!displayInForm,!publicAccess,!access,!userGroupAccesses,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
                pageSize: 100   // PageSize of 50 : ~6KB
            },
            "optionSets": {
                params: "id,name,code,created,lastUpdated,valueType,attributeValues[value,attribute[id,code,name]],options[id,name,code,translations[value,property,locale]],translations[value,property,locale]"
            },
            "organisationUnitGroupSets": {
                params: "id,name,code,shortName,created,lastUpdated,description,dimensionType,dataDimension,organisationUnitGroups[id,name],attributeValues[value,attribute[id,code,name]]"
            },
            "sections": {
                params: "id,name,created,lastUpdated,sortOrder,dataSet,attributeValues[value,attribute[id,code,name]],indicators,dataElements,translations[value,property,locale]",
                pageSize: 150   // PageSize of 50 : ~8KB
            },
            "users": {
                params: ":all,!href,!externalAccess,!access,!teiSearchOrganisationUnits,!dataViewOrganisationUnits,!userGroupAccesses,userCredentials[:all,userRoles[:all]],organisationUnits[:all]",
                pageSize: 25    // PageSize of 50 : ~50KB
            },
            "userRoles": {
                params: "name,id,displayName,lastUpdated"
            },
            "attributes": {
                params: "id,code,lastUpdated,name,valueType,mandatory"
            },
            "organisationUnitGroups": {
                params: ":all,!externalAccess,!access,!userGroupAccess,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]"
            },
            "dataSets": {
                params: ":all,attributeValues[:identifiable,value,attribute[:identifiable]],!organisationUnits,translations[value,property,locale],!dataSetElements"
            },
            "programs": {
                params: "id,name,displayName,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]],translations[value,property,locale]"
            },
            "organisationUnits": {
                params: ":all,parent[:identifiable],attributeValues[:identifiable,value,attribute[:identifiable]],dataSets,!access,!href,!uuid",
                pageSize: 150   //PageSize of 50 : ~ 9KB-10KB
            },
            "translations": {
                params: ":all,!access,!userGroupAccesses,!externalAccess,!href,attributeValues[value,attribute[id,code,name]]",
                pageSize: 300   //PageSize of 50 : ~2KB - 3KB
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
            "organisationUnitGroupSets",
            "sections",
            "users",
            "userRoles",
            "attributes",
            "translations"
        ]
    };
});
