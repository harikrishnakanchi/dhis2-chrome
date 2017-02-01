define([], function () {
    return {
        types: {
            "categories": "id,name,shortName,created,dataDimension,dataDimensionType,lastUpdated,categoryOptions,categoryCombos,attributeValues[value,attribute[id,code,name]]",
            "categoryCombos": "id,name,skipTotal,created,dataDimensionType,lastUpdated,categories,attributeValues[value,attribute[id,code,name]],categoryOptionCombos",
            "categoryOptionCombos": "id,name,created,shortName,lastUpdated,categoryCombo,categoryOptions,attributeValues[value,attribute[id,code,name]]",
            "categoryOptions": "id,name,shortName,created,lastUpdated,dimensionItemType,categories,organisationUnits,categoryOptionCombos,attributeValues[value,attribute[id,code,name]]",
            "dataElementGroups": "id,name,shortName,created,lastUpdated,attributeValues[value,attribute[id,code,name]],dataElements,dimensionItemType",
            "dataElements": ":all,!href,!publicAccess,!externalAccess,!dimensionItem,!zeroIsSignificant,!url,!access,!user,!userGroupAccesses,!aggregationLevels,optionSet[id,name,options[id,name,code]],categoryCombo,dataElementGroups,attributeValues[value,attribute[id,code,name]],dataSets",
            "indicators": ":all,!href,!displayName,!publicAccess,!externalAccess,!displayShortName,!access,!userGroupAccesses,attributeValues[value,attribute[id,code,name]]",
            "programIndicators": ":all,!href,!displayName,!displayInForm,!publicAccess,!access,!userGroupAccesses,attributeValues[value,attribute[id,code,name]]",
            "optionSets": "id,name,code,created,lastUpdated,valueType,attributeValues[value,attribute[id,code,name]],options[id,name,code]",
            "organisationUnitGroupSets": "id,name,code,shortName,created,lastUpdated,description,dimensionType,dataDimension,organisationUnitGroups[id,name],attributeValues[value,attribute[id,code,name]]",
            "sections": "id,name,created,lastUpdated,sortOrder,dataSet,attributeValues[value,attribute[id,code,name]],indicators,dataElements",
            "users": ":all,!href,!externalAccess,!access,!teiSearchOrganisationUnits,!dataViewOrganisationUnits,!userGroupAccesses,userCredentials[:all,userRoles[:all]],organisationUnits[:all]",
            "userRoles": "name,id,displayName,lastUpdated",
            "attributes": "id,code,lastUpdated,name,valueType,mandatory"
        }
    };
});
