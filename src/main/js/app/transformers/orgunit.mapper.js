define(["lodash", "dhisId", "moment"], function(_, dhisId, moment) {
    var buildProjectAttributeValues = function(orgUnit) {
        var attributeValues = [{
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "Type",
                "name": "Type"
            },
            value: "Project"
        }];
        attributeValues.push({
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "prjCon",
                "name": "Context"
            },
            "value": orgUnit.context
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "prjLoc",
                "name": "Location"
            },
            "value": orgUnit.location
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "prjPopType",
                "name": "Type of population"
            },
            "value": orgUnit.populationType
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "projCode",
                "name": "Project Code"
            },
            "value": orgUnit.projectCode
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "reasonForIntervention",
                "name": "Reason For Intervention"
            },
            "value": orgUnit.reasonForIntervention
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "modeOfOperation",
                "name": "Mode Of Operation"
            },
            "value": orgUnit.modeOfOperation
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "modelOfManagement",
                "name": "Model Of Management"
            },
            "value": orgUnit.modelOfManagement
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "autoApprove",
                "name": "Auto Approve"
            },
            "value": orgUnit.autoApprove
        }, {
            "created": moment().toISOString(),
            "lastUpdated": moment().toISOString(),
            "attribute": {
                "code": "isNewDataModel",
                "name": "Is New Data Model"
            },
            "value": "true"
        });

        if (orgUnit.endDate)
            attributeValues.push({
                "created": moment().toISOString(),
                "lastUpdated": moment().toISOString(),
                "attribute": {
                    "code": "prjEndDate",
                    "name": "End date"
                },
                "value": moment(orgUnit.endDate).format("YYYY-MM-DD")
            });

        return attributeValues;
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
                    "code": "isDisabled"
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

    this.getAttributeValue = function(dhisProject, code) {
        var attribute = _.find(dhisProject.attributeValues, {
            'attribute': {
                'code': code
            }
        });

        return attribute ? attribute.value : undefined;
    };

    this.mapToProject = function(dhisProject) {
        var endDate = self.getAttributeValue(dhisProject, "prjEndDate");
        var autoApprove = self.getAttributeValue(dhisProject, "autoApprove");
        return {
            'name': dhisProject.name,
            'openingDate': moment(dhisProject.openingDate).toDate(),
            'context': self.getAttributeValue(dhisProject, "prjCon"),
            'location': self.getAttributeValue(dhisProject, "prjLoc"),
            'populationType': self.getAttributeValue(dhisProject, "prjPopType"),
            'endDate': endDate ? moment(endDate).toDate() : undefined,
            'projectCode': self.getAttributeValue(dhisProject, "projCode"),
            'reasonForIntervention': self.getAttributeValue(dhisProject, "reasonForIntervention"),
            'modeOfOperation': self.getAttributeValue(dhisProject, "modeOfOperation"),
            'modelOfManagement': self.getAttributeValue(dhisProject, "modelOfManagement"),
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
            openingDate: moment(module.openingDate).toDate(),
            attributeValues: [{
                created: moment().toISOString(),
                lastUpdated: moment().toISOString(),
                attribute: {
                    "code": "Type",
                    "name": "Type"
                },
                value: "Module"
            }, {
                created: moment().toISOString(),
                lastUpdated: moment().toISOString(),
                attribute: {
                    "code": "isLineListService",
                    "name": "Is Linelist Service"
                },
                value: module.serviceType === "Linelist" ? "true" : "false"
            }, {
                created: moment().toISOString(),
                lastUpdated: moment().toISOString(),
                attribute: {
                    "code": "isNewDataModel",
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
        return _.any(orgUnit.attributeValues, {
            attribute: {
                code: "type"
            },
            value: type
        });
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
                            "code": "Type",
                            "name": "Type"
                        },
                        "value": "Patient Origin"
                    }, {
                        "attribute": {
                            "code": "isNewDataModel",
                            "name": "Is New Data Model"
                        },
                        "value": "true"
                    }],
                    "parent": {
                        "id": parent.id
                    }
                };

                if (!_.isUndefined(patientOrigin.longitude) && !_.isUndefined(patientOrigin.latitude)) {
                    patientOriginPayload.coordinates = "[" + patientOrigin.longitude + "," + patientOrigin.latitude + "]";
                    patientOriginPayload.featureType = "Point";
                }
                return patientOriginPayload;
            });
        });
        return _.flatten(payload);
    };

    return this;
});
