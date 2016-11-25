define(["lodash", "dhisId", "moment", "customAttributes"], function(_, dhisId, moment, customAttributes) {
    var buildProjectAttributeValues = function(orgUnit) {
        var attributeValues = [{
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.TYPE,
                "name": "Type"
            },
            value: "Project"
        }];
        attributeValues.push({
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.PROJECT_CONTEXT_CODE,
                "name": "Context"
            },
            "value": orgUnit.context ? (orgUnit.context.originalObject ? orgUnit.context.originalObject.englishName : orgUnit.context.englishName) : orgUnit.context
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.PROJECT_LOCATION_CODE,
                "name": "Location"
            },
            "value": orgUnit.location
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.PROJECT_POPULATION_TYPE_CODE,
                "name": "Type of population"
            },
            "value": orgUnit.populationType ? (orgUnit.populationType.originalObject ? orgUnit.populationType.originalObject.englishName : orgUnit.populationType.englishName) : orgUnit.populationType
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.PROJECT_CODE,
                "name": "Project Code"
            },
            "value": orgUnit.projectCode
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.REASON_FOR_INTERVENTION_CODE,
                "name": "Reason For Intervention"
            },
            "value": orgUnit.reasonForIntervention ? (orgUnit.reasonForIntervention.originalObject ? orgUnit.reasonForIntervention.originalObject.englishName : orgUnit.reasonForIntervention.englishName) : orgUnit.reasonForIntervention
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.MODE_OF_OPERATION_CODE,
                "name": "Mode Of Operation"
            },
            "value": orgUnit.modeOfOperation ? (orgUnit.modeOfOperation.originalObject ? orgUnit.modeOfOperation.originalObject.englishName : orgUnit.modeOfOperation.englishName) : orgUnit.modeOfOperation
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.MODEL_OF_MANAGEMENT_CODE,
                "name": "Model Of Management"
            },
            "value": orgUnit.modelOfManagement ? (orgUnit.modelOfManagement.originalObject ? orgUnit.modelOfManagement.originalObject.englishName : orgUnit.modelOfManagement.englishName) : orgUnit.modelOfManagement
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.AUTO_APPROVE,
                "name": "Auto Approve"
            },
            "value": orgUnit.autoApprove
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.NEW_DATA_MODEL_CODE,
                "name": "Is New Data Model"
            },
            "value": "true"
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.PROJECT_TYPE_CODE,
                "name": "Project Type"
            },
            "value": orgUnit.projectType ? (orgUnit.projectType.originalObject ? orgUnit.projectType.originalObject.englishName : orgUnit.projectType.englishName) : orgUnit.projectType
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.ESTIMATED_TARGET_POPULATION_CODE,
                "name": "Estimated target population"
            },
            "value": orgUnit.estimatedTargetPopulation ? orgUnit.estimatedTargetPopulation.toString() : ""
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.EST_POPULATION_LESS_THAN_1_YEAR_CODE,
                "name": "Est. population less than 1 year"
            },
            "value": orgUnit.estPopulationLessThan1Year ? orgUnit.estPopulationLessThan1Year.toString() : ""
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.EST_POPULATION_BETWEEN_1_AND_5_YEARS_CODE,
                "name": "Est. population between 1 and 5 years"
            },
            "value": orgUnit.estPopulationBetween1And5Years ? orgUnit.estPopulationBetween1And5Years.toString() : ""
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": customAttributes.EST_POPULATION_OF_WOMEN_OF_CHILD_BEARING_AGE_CODE,
                "name": "Est. population of women of child bearing age"
            },
            "value": orgUnit.estPopulationOfWomenOfChildBearingAge ? orgUnit.estPopulationOfWomenOfChildBearingAge.toString() : ""
        });

        if (orgUnit.endDate)
            attributeValues.push({
                "created": moment().toISOString(),
                "lastUpdated": moment().toISOString(),
                "attribute": {
                    "code": customAttributes.PROJECT_END_DATE_CODE,
                    "name": "End date"
                },
                "value": moment(orgUnit.endDate).format("YYYY-MM-DD")
            });

        return customAttributes.cleanAttributeValues(attributeValues);
    };

    this.disable = function(orgUnits) {
        var attributeValue = {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            'attribute': {
                "code": "isDisabled",
                "name": "Is Disabled"
            },
            value: "true"
        };

        var disableOrgUnit = function(orgUnit) {
            orgUnit.attributeValues = _.reject(orgUnit.attributeValues, {
                "attribute": {
                    "code": customAttributes.DISABLED_CODE
                }
            });
            orgUnit.attributeValues.push(attributeValue);
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
        return {
            name: module.name,
            shortName: module.name,
            displayName: module.parent.name + " - " + module.name,
            id: moduleId || dhisId.get(module.name + module.parent.id),
            level: moduleLevel || parseInt(module.parent.level) + 1,
            openingDate: moment.utc(module.openingDate).format('YYYY-MM-DD'),
            attributeValues: [{
                created: moment().toISOString(),
                lastUpdated: moment().toISOString(),
                attribute: {
                    "code": customAttributes.TYPE,
                    "name": "Type"
                },
                value: "Module"
            }, {
                created: moment().toISOString(),
                lastUpdated: moment().toISOString(),
                attribute: {
                    "code": customAttributes.LINE_LIST_ATTRIBUTE_CODE,
                    "name": "Is Linelist Service"
                },
                value: module.serviceType === "Linelist" ? "true" : "false"
            }, {
                created: moment().toISOString(),
                lastUpdated: moment().toISOString(),
                attribute: {
                    "code": customAttributes.NEW_DATA_MODEL_CODE,
                    "name": "Is New Data Model"
                },
                value: "true"
            }],
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
                    "attributeValues": [{
                        "attribute": {
                            "code": customAttributes.TYPE,
                            "name": "Type"
                        },
                        "value": "Patient Origin"
                    }, {
                        "attribute": {
                            "code": customAttributes.NEW_DATA_MODEL_CODE,
                            "name": "Is New Data Model"
                        },
                        "value": "true"
                    }],
                    "parent": {
                        "id": parent.id
                    }
                };

                if (patientOrigin.isDisabled === true) {
                    var isDisabledAttr = {
                        "attribute": {
                            "code": customAttributes.DISABLED_CODE,
                        },
                        "value": "true"
                    };
                    patientOriginPayload.attributeValues.push(isDisabledAttr);
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
