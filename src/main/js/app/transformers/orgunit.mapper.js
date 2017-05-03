define(["lodash", "dhisId", "moment", "customAttributes"], function(_, dhisId, moment, customAttributes) {
    var buildProjectAttributeValues = function(orgUnit) {
        var attributeValues = [];
        var estimatedTargetPopulation = orgUnit.estimatedTargetPopulation ? orgUnit.estimatedTargetPopulation.toString() : "";
        var estimatedPopulationLessThan1Year = orgUnit.estPopulationLessThan1Year ? orgUnit.estPopulationLessThan1Year.toString() : "";
        var estPopulationBetween1And5Years = orgUnit.estPopulationBetween1And5Years ? orgUnit.estPopulationBetween1And5Years.toString() : "";
        var estimatedPopulationOfWomenOfChildBearingAge = orgUnit.estPopulationOfWomenOfChildBearingAge ? orgUnit.estPopulationOfWomenOfChildBearingAge.toString() : "";

        attributeValues.push(customAttributes.createAttribute(customAttributes.TYPE, "Project"),
            customAttributes.createAttribute(customAttributes.PROJECT_LOCATION_CODE, orgUnit.location),
            customAttributes.createAttribute(customAttributes.PROJECT_CODE, orgUnit.projectCode),
            customAttributes.createAttribute(customAttributes.AUTO_APPROVE, orgUnit.autoApprove),
            customAttributes.createAttribute(customAttributes.NEW_DATA_MODEL_CODE, "true"),
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

    var buildOrgUnitGroups = function (orgUnit) {
        var orgUnitGroupSetsWithValue = _.omit(orgUnit.orgUnitGroupSets, _.isUndefined);
        return _.transform(orgUnitGroupSetsWithValue, function (acc, orgUnitGroup, orgUniGroupSetId) {
            var organisationUnitGroup = {
                id: orgUnitGroup.id,
                organisationUnitGroupSet: {
                    id: orgUniGroupSetId
                }
            };
            acc.push(organisationUnitGroup);
        }, []);
    };

    this.mapToExistingProject = function(newProject, existingProject) {
        existingProject.name = newProject.name;
        existingProject.openingDate = moment(newProject.openingDate).format("YYYY-MM-DD");
        existingProject.attributeValues = buildProjectAttributeValues(newProject);
        existingProject.organisationUnitGroups = buildOrgUnitGroups(newProject);
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
            'attributeValues': buildProjectAttributeValues(orgUnit),
            'organisationUnitGroups': buildOrgUnitGroups(orgUnit)
        };

        return projectOrgUnit;
    };

    var getOrgUnitGroups = function (orgUnit, orgUnitGroupSets) {
        return  _.transform(orgUnitGroupSets, function (map, orgUnitGroupSet) {
            var groupSetValue = _.find(orgUnit.organisationUnitGroups, function (orgUnitGroup) {
                return orgUnitGroupSet.id === _.get(orgUnitGroup.organisationUnitGroupSet, 'id');
            });
            if (groupSetValue) {
                var groupSetName = _.find(orgUnitGroupSet.organisationUnitGroups, function (group) {
                    return group.id === groupSetValue.id;
                });
                map[orgUnitGroupSet.id] = {
                    id: groupSetValue.id,
                    name: _.get(groupSetName, 'name')
                };
            }
            else
                map[orgUnitGroupSet.id] = undefined;
            return map;
        }, {});
    };

    this.mapOrgUnitToProject = function (dhisProject, orgUnitGroupSets) {
        var endDate = customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.PROJECT_END_DATE_CODE);
        var autoApprove = customAttributes.getAttributeValue(dhisProject.attributeValues, customAttributes.AUTO_APPROVE);

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
            'orgUnitGroupSets': getOrgUnitGroups(dhisProject, orgUnitGroupSets)
        };
    };

    this.mapOrgUnitToOpUnit = function (opUnit, orgUnitGroupSets) {
        var coordinates = opUnit.coordinates;
        coordinates = coordinates ? coordinates.substr(1, coordinates.length - 2).split(",") : coordinates;
        var mappedOpUnit = {
            name: opUnit.name,
            openingDate: opUnit.openingDate,
            orgUnitGroupSets: getOrgUnitGroups(opUnit, orgUnitGroupSets)
        };
        if (coordinates) {
            mappedOpUnit.longitude = parseFloat(coordinates[0]);
            mappedOpUnit.latitude = parseFloat(coordinates[1]);
        }
         return mappedOpUnit;
    };

    var createAttributesForOpUnit = function () {
        return [customAttributes.createAttribute(customAttributes.TYPE, "Operation Unit"),
            customAttributes.createAttribute(customAttributes.NEW_DATA_MODEL_CODE, "true")];
    };
    this.mapToOpUnitForDHIS = function (opUnit, project, existingProject) {
        var opUnitId = existingProject ? project.id : dhisId.get(opUnit.name + project.id),
            opUnitLevel = existingProject ? project.level : parseInt(project.level) + 1,
            opUnitParent = existingProject ? project.parent : _.pick(project, "name", "id");

        var orgUnit = _.merge(opUnit, {
            'id': opUnitId,
            'shortName': opUnit.name,
            'level': opUnitLevel,
            'parent': opUnitParent,
            'attributeValues': createAttributesForOpUnit()
        });

        if (!_.isUndefined(orgUnit.longitude) && !_.isUndefined(orgUnit.latitude)) {
            orgUnit.coordinates = "[" + opUnit.longitude + "," + orgUnit.latitude + "]";
            orgUnit.featureType = "POINT";
        }

        orgUnit.organisationUnitGroups = buildOrgUnitGroups(orgUnit);
        orgUnit = _.omit(orgUnit, ['type', 'latitude', 'longitude', 'orgUnitGroupSets']);
        return orgUnit;
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
