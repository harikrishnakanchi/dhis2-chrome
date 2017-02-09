define([], function () {
    return {
        fields: {
            "categories": "id,name,shortName,created,dataDimension,dataDimensionType,lastUpdated,categoryOptions,categoryCombos,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
            "categoryCombos": "id,name,skipTotal,created,dataDimensionType,lastUpdated,categories,attributeValues[value,attribute[id,code,name]],categoryOptionCombos,translations[value,property,locale]",
            "categoryOptionCombos": "id,name,created,shortName,lastUpdated,categoryCombo,categoryOptions,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
            "categoryOptions": "id,name,shortName,created,lastUpdated,dimensionItemType,categories,organisationUnits,categoryOptionCombos,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
            "dataElementGroups": "id,name,shortName,created,lastUpdated,attributeValues[value,attribute[id,code,name]],dataElements,dimensionItemType,translations[value,property,locale]",
            "dataElements": ":all,!href,!publicAccess,!externalAccess,!dimensionItem,!zeroIsSignificant,!url,!access,!user,!userGroupAccesses,!aggregationLevels,optionSet[id,name,options[id,name,code]],categoryCombo,dataElementGroups,attributeValues[value,attribute[id,code,name]],dataSets,translations[value,property,locale]",
            "indicators": ":all,!href,!displayName,!publicAccess,!externalAccess,!displayShortName,!access,!userGroupAccesses,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
            "programIndicators": ":all,!href,!displayName,!displayInForm,!publicAccess,!access,!userGroupAccesses,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
            "optionSets": "id,name,code,created,lastUpdated,valueType,attributeValues[value,attribute[id,code,name]],options[id,name,code,translations[value,property,locale]],translations[value,property,locale]",
            "organisationUnitGroupSets": "id,name,code,shortName,created,lastUpdated,description,dimensionType,dataDimension,organisationUnitGroups[id,name],attributeValues[value,attribute[id,code,name]]",
            "sections": "id,name,created,lastUpdated,sortOrder,dataSet,attributeValues[value,attribute[id,code,name]],indicators,dataElements,translations[value,property,locale]",
            "users": ":all,!href,!externalAccess,!access,!teiSearchOrganisationUnits,!dataViewOrganisationUnits,!userGroupAccesses,userCredentials[:all,userRoles[:all]],organisationUnits[:all]",
            "userRoles": "name,id,displayName,lastUpdated",
            "attributes": "id,code,lastUpdated,name,valueType,mandatory",
            "organisationUnitGroups": ":all,!externalAccess,!access,!userGroupAccess,attributeValues[value,attribute[id,code,name]],translations[value,property,locale]",
            "dataSets": ":all,attributeValues[:identifiable,value,attribute[:identifiable]],!organisationUnits,translations[value,property,locale]",
            "programs": "id,name,displayName,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]],translations[value,property,locale]",
            "organisationUnits": ":all,parent[:identifiable],attributeValues[:identifiable,value,attribute[:identifiable]],dataSets,!access,!href,!uuid"
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
            "attributes"
        ]
    };
});
