define(["lodash", "dhisId", "moment", "customAttributes"], function(_, dhisId, moment, customAttributes) {
    var buildProjectAttributeValues = function(orgUnit) {
        var attributeValues = [];
        var projectContext = orgUnit.context ? (orgUnit.context.originalObject ? orgUnit.context.originalObject.englishName : orgUnit.context.englishName) : orgUnit.context;
        var populationType = orgUnit.populationType ? (orgUnit.populationType.originalObject ? orgUnit.populationType.originalObject.englishName : orgUnit.populationType.englishName) : orgUnit.populationType;
        var reasonForIntervention = orgUnit.reasonForIntervention ? (orgUnit.reasonForIntervention.originalObject ? orgUnit.reasonForIntervention.originalObject.englishName : orgUnit.reasonForIntervention.englishName) : orgUnit.reasonForIntervention;
        var modeOfOperation = orgUnit.modeOfOperation ? (orgUnit.modeOfOperation.originalObject ? orgUnit.modeOfOperation.originalObject.englishName : orgUnit.modeOfOperation.englishName) : orgUnit.modeOfOperation;
        var modelOfManagement = orgUnit.modelOfManagement ? (orgUnit.modelOfManagement.originalObject ? orgUnit.modelOfManagement.originalObject.englishName : orgUnit.modelOfManagement.englishName) : orgUnit.modelOfManagement;
        var projectType = orgUnit.projectType ? (orgUnit.projectType.originalObject ? orgUnit.projectType.originalObject.englishName : orgUnit.projectType.englishName) : orgUnit.projectType;
        var estimatedTargetPopulation = orgUnit.estimatedTargetPopulation ? orgUnit.estimatedTargetPopulation.toString() : "";
        var estimatedPopulationLessThan1Year = orgUnit.estPopulationLessThan1Year ? orgUnit.estPopulationLessThan1Year.toString() : "";
        var estPopulationBetween1And5Years = orgUnit.estPopulationBetween1And5Years ? orgUnit.estPopulationBetween1And5Years.toString() : "";
        var estimatedPopulationOfWomenOfChildBearingAge = orgUnit.estPopulationOfWomenOfChildBearingAge ? orgUnit.estPopulationOfWomenOfChildBearingAge.toString() : "";

        attributeValues.push(customAttributes.createAttribute(customAttributes.TYPE, "Project"),
            customAttributes.createAttribute(customAttributes.PROJECT_CONTEXT_CODE, projectContext),
            customAttributes.createAttribute(customAttributes.PROJECT_LOCATION_CODE, orgUnit.location),
            customAttributes.createAttribute(customAttributes.PROJECT_POPULATION_TYPE_CODE, populationType),
            customAttributes.createAttribute(customAttributes.PROJECT_CODE, orgUnit.projectCode),
            customAttributes.createAttribute(customAttributes.REASON_FOR_INTERVENTION_CODE, reasonForIntervention),
            customAttributes.createAttribute(customAttributes.MODE_OF_OPERATION_CODE, modeOfOperation),
            customAttributes.createAttribute(customAttributes.MODEL_OF_MANAGEMENT_CODE, modelOfManagement),
            customAttributes.createAttribute(customAttributes.AUTO_APPROVE, orgUnit.autoApprove),
            customAttributes.createAttribute(customAttributes.NEW_DATA_MODEL_CODE, "true"),
            customAttributes.createAttribute(customAttributes.PROJECT_TYPE_CODE, projectType),
            customAttributes.createAttribute(customAttributes.ESTIMATED_TARGET_POPULATION_CODE, estimatedTargetPopulation),
            customAttributes.createAttribute(customAttributes.EST_POPULATION_LESS_THAN_1_YEAR_CODE, estimatedPopulationLessThan1Year),
            customAttributes.createAttribute(customAttributes.EST_POPULATION_BETWEEN_1_AND_5_YEARS_CODE, estPopulationBetween1And5Years),
            customAttributes.createAttribute(customAttributes.EST_POPULATION_OF_WOMEN_OF_CHILD_BEARING_AGE_CODE, estimatedPopulationOfWomenOfChildBearingAge));

        if (orgUnit.endDate)
            attributeValues.push(customAttributes.createAttribute(customAttributes.PROJECT_END_DATE_CODE, moment(orgUnit.endDate).format("YYYY-MM-DD")));

        return customAttributes.cleanAttributeValues(attributeValues);
    };

    this.disable = function(orgUnits) {
        var isDisabledAttr = customAttributes.createAttribute(customAttributes.DISABLED_CODE, "true");

        var disableOrgUnit = function(orgUnit) {
            orgUnit.attributeValues = _.reject(orgUnit.attributeValues, {
                "attribute": {
                    "code": customAttributes.DISABLED_CODE
                }
            });
            orgUnit.attributeValues.push(isDisabledAttr);
            return orgUnit;
        };

        return angular.isArray(orgUnits) ? _.map(orgUnits, disableOrgUnit) : disableOrgUnit(orgUnits);
    };

    this.mapToExistingProject = function(newProject, existingProject) {
        existingProject.name = newProject.name;
        existingProject.openingDate = moment(newProject.openingDate).format("YYYY-MM-DD");
        existingProject.attributeValues = buildProjectAttributeValues(newProject);
        return existingProject;
    };

    this.mapToProjectForDhis = function(orgUnit, parentOrgUnit) {
        var projectOrgUnit = {
            'id': dhisId.get(orgUnit.name + parentOrgUnit.id),
            'name': orgUnit.name,
            'level': parseInt(parentOrgUnit.level) + 1,
            'shortName': orgUnit.name,
            'openingDate': moment(orgUnit.openingDate).format("YYYY-MM-DD"),
            'parent': _.pick(parentOrgUnit, "name", "id"),
            'attributeValues': buildProjectAttributeValues(orgUnit)
        };

        return projectOrgUnit;
    };

    this.mapOrgUnitToProject = function (dhisProject, orgUnitGroupSets) {
        var endDate = customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.PROJECT_END_DATE_CODE);
        var autoApprove = customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.AUTO_APPROVE);
        var getOrgUnitGroupsForProject = function () {
            return  _.transform(orgUnitGroupSets, function (map, orgUnitGroupSet) {
                var groupSetValueForProject = _.find(dhisProject.organisationUnitGroups, function (orgUnitGroupInProject) {
                    return orgUnitGroupSet.id === _.get(orgUnitGroupInProject.organisationUnitGroupSet, 'id');
                });
                if (groupSetValueForProject) {
                    var groupSetName = _.find(orgUnitGroupSet.organisationUnitGroups, function (group) {
                        return group.id === groupSetValueForProject.id;
                    });
                    map[orgUnitGroupSet.id] = {
                        id: groupSetValueForProject.id,
                        name: _.get(groupSetName, 'name')
                    };
                }
                else
                    map[orgUnitGroupSet.id] = undefined;
                return map;
            }, {});
        };

        return {
            'name': dhisProject.name,
            'openingDate': moment(dhisProject.openingDate).toDate(),
            'endDate': endDate ? moment(endDate).toDate() : undefined,

            'location': customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.PROJECT_LOCATION_CODE),
            'projectCode': customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.PROJECT_CODE),

            'estimatedTargetPopulation': parseInt(customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.ESTIMATED_TARGET_POPULATION_CODE)),
            'estPopulationLessThan1Year': parseInt(customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.EST_POPULATION_LESS_THAN_1_YEAR_CODE)),
            'estPopulationBetween1And5Years': parseInt(customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.EST_POPULATION_BETWEEN_1_AND_5_YEARS_CODE)),
            'estPopulationOfWomenOfChildBearingAge': parseInt(customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.EST_POPULATION_OF_WOMEN_OF_CHILD_BEARING_AGE_CODE)),
            'autoApprove': autoApprove === undefined ? "false" : autoApprove,
            'orgUnitGroupSets': getOrgUnitGroupsForProject()
        };
    };

    this.mapToProject = function(dhisProject, allContexts, allPopTypes, reasonForIntervention, modeOfOperation, modelOfManagement, allProjectTypes) {

        var getTranslatedName = function (allOptions, code) {
            var value = customAttributes.getAttributeValue(dhisProject.attributeValues, code);
            var result = _.filter(allOptions, function (option) {
                return option.englishName == value;
            });
            return result[0] ? result[0] : undefined;
        };

        var endDate = customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.PROJECT_END_DATE_CODE);
        var autoApprove = customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.AUTO_APPROVE);
        return {
            'name': dhisProject.name,
            'openingDate': moment(dhisProject.openingDate).toDate(),
            'endDate': endDate ? moment(endDate).toDate() : undefined,

            'location': customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.PROJECT_LOCATION_CODE),
            'projectCode': customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.PROJECT_CODE),

            'context': getTranslatedName(allContexts, customAttributes.PROJECT_CONTEXT_CODE),
            'populationType': getTranslatedName(allPopTypes, customAttributes.PROJECT_POPULATION_TYPE_CODE),
            'projectType': getTranslatedName(allProjectTypes, customAttributes.PROJECT_TYPE_CODE),
            'reasonForIntervention': getTranslatedName(reasonForIntervention, customAttributes.REASON_FOR_INTERVENTION_CODE),
            'modeOfOperation': getTranslatedName(modeOfOperation, customAttributes.MODE_OF_OPERATION_CODE),
            'modelOfManagement': getTranslatedName(modelOfManagement, customAttributes.MODEL_OF_MANAGEMENT_CODE),

            'estimatedTargetPopulation': parseInt(customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.ESTIMATED_TARGET_POPULATION_CODE)),
            'estPopulationLessThan1Year': parseInt(customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.EST_POPULATION_LESS_THAN_1_YEAR_CODE)),
            'estPopulationBetween1And5Years': parseInt(customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.EST_POPULATION_BETWEEN_1_AND_5_YEARS_CODE)),
            'estPopulationOfWomenOfChildBearingAge': parseInt(customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.EST_POPULATION_OF_WOMEN_OF_CHILD_BEARING_AGE_CODE)),
            'autoApprove': autoApprove === undefined ? "false" : autoApprove
        };
    };

    this.mapToModule = function(module, moduleId, moduleLevel) {
        var isLineList = module.serviceType === "Linelist" ? "true" : "false";
        return {
            name: module.name,
            shortName: module.name,
            displayName: module.parent.name + " - " + module.name,
            id: moduleId || dhisId.get(module.name + module.parent.id),
            level: moduleLevel || parseInt(module.parent.level) + 1,
            openingDate: moment.utc(module.openingDate).format('YYYY-MM-DD'),
            attributeValues: [customAttributes.createAttribute(customAttributes.TYPE, "Module"),
                customAttributes.createAttribute(customAttributes.LINE_LIST_ATTRIBUTE_CODE, isLineList),
                customAttributes.createAttribute(customAttributes.NEW_DATA_MODEL_CODE, "true")],
            parent: {
                name: module.parent.name,
                id: module.parent.id
            }
        };
    };

    var isOfType = function(orgUnit, type) {
        return customAttributes.getAttributeValue(orgUnit.attributeValues, customAttributes.TYPE) === type;
    };

    this.filterModules = function(orgUnits) {
        var populateDisplayName = function(module) {
            var parent = _.find(orgUnits, {
                'id': module.parent.id
            });
            return _.merge(module, {
                displayName: isOfType(parent, "Operation Unit") ? parent.name + " - " + module.name : module.name
            });
        };

        var modules = _.filter(orgUnits, function(orgUnit) {
            return isOfType(orgUnit, "Module");
        });

        return _.map(modules, populateDisplayName);
    };

    this.createPatientOriginPayload = function(patientOrigins, parentOrgUnits) {
        patientOrigins = _.isArray(patientOrigins) ? patientOrigins : [patientOrigins];
        parentOrgUnits = _.isArray(parentOrgUnits) ? parentOrgUnits : [parentOrgUnits];

        var payload = _.map(patientOrigins, function(patientOrigin) {
            return _.map(parentOrgUnits, function(parent) {

                var patientOriginPayload = {
                    "name": patientOrigin.name,
                    "shortName": patientOrigin.name,
                    "displayName": patientOrigin.name,
                    "id": dhisId.get(patientOrigin.name + parent.id),
                    "level": 7,
                    "openingDate": parent.openingDate,
                    "attributeValues": [customAttributes.createAttribute(customAttributes.TYPE, "Patient Origin"),
                        customAttributes.createAttribute(customAttributes.NEW_DATA_MODEL_CODE, "true")],
                    "parent": {
                        "id": parent.id
                    }
                };

                if (patientOrigin.isDisabled === true) {
                    patientOriginPayload.attributeValues.push(customAttributes.createAttribute(customAttributes.DISABLED_CODE, "true"));
                }

                if (!_.isUndefined(patientOrigin.longitude) && !_.isUndefined(patientOrigin.latitude)) {
                    patientOriginPayload.coordinates = "[" + patientOrigin.longitude + "," + patientOrigin.latitude + "]";
                    patientOriginPayload.featureType = "POINT";
                }
                return patientOriginPayload;
            });
        });
        return _.flatten(payload);
    };

    return this;
});
