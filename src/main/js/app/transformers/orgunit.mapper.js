define(["lodash", "md5", "moment"], function(_, md5, moment) {

    var mapToProjectForDhis = function(orgUnit, parentOrgUnit) {

        var projectOrgUnit = {
            'id': md5(orgUnit.name + parentOrgUnit.name).substr(0, 11),
            'name': orgUnit.name,
            'level': parseInt(parentOrgUnit.level) + 1,
            'shortName': orgUnit.name,
            'openingDate': moment(orgUnit.openingDate).format("YYYY-MM-DD"),
            'parent': _.pick(parentOrgUnit, "name", "id"),
            'attributeValues': [{
                'attribute': {
                    id: "a1fa2777924"
                },
                value: "Project"
            }]
        };

        projectOrgUnit.attributeValues.push({
            "attribute": {
                "code": "prjCon",
                "name": "Context",
                "id": "Gy8V8WeGgYs"
            },
            "value": orgUnit.context
        }, {
            "attribute": {
                "code": "prjLoc",
                "name": "Location",
                "id": "CaQPMk01JB8"
            },
            "value": orgUnit.location
        }, {
            "attribute": {
                "code": "prjType",
                "name": "Type of project",
                "id": "bnbnSvRdFYo"
            },
            "value": orgUnit.projectType
        }, {
            "attribute": {
                "code": "prjPopType",
                "name": "Type of population",
                "id": "Byx9QE6IvXB"
            },
            "value": orgUnit.populationType
        }, {
            "attribute": {
                "code": "projCode",
                "name": "Project Code",
                "id": "fa5e00d5cd2"
            },
            "value": orgUnit.projectCode
        }, {
            "attribute": {
                "code": "event",
                "name": "Event",
                "id": "a4ecfc70574"
            },
            "value": orgUnit.event
        });

        if (orgUnit.endDate)
            projectOrgUnit.attributeValues.push({
                "attribute": {
                    "code": "prjEndDate",
                    "name": "End date",
                    "id": "ZbUuOnEmVs5"
                },
                "value": moment(orgUnit.endDate).format("YYYY-MM-DD")
            });


        return projectOrgUnit;

    };

    var getChildOrgUnitNames = function(allOrgUnits, parentId) {
        return _.pluck(_.filter(allOrgUnits, {
            parent: {
                id: parentId,
            }
        }), 'name');
    };

    var getAttributeValue = function(dhisProject, code) {
        var attribute = _.find(dhisProject.attributeValues, {
            'attribute': {
                'code': code
            }
        });

        if (attribute)
            return attribute.value;

        return undefined;
    };


    var mapToProjectForView = function(dhisProject) {
        var endDate = getAttributeValue(dhisProject, "prjEndDate");
        return {
            'name': dhisProject.name,
            'openingDate': moment(dhisProject.openingDate).format("YYYY-MM-DD"),
            'context': getAttributeValue(dhisProject, "prjCon"),
            'location': getAttributeValue(dhisProject, "prjLoc"),
            'projectType': getAttributeValue(dhisProject, "prjType"),
            'populationType': getAttributeValue(dhisProject, "prjPopType"),
            'endDate': endDate ? moment(endDate).format("YYYY-MM-DD") : undefined,
            'event': getAttributeValue(dhisProject, "event"),
            'projectCode': getAttributeValue(dhisProject, "projCode"),
        };
    };

    var mapToModules = function(modules, moduleParent) {
        var result = _.map(modules, function(module) {
            return {
                name: module.name,
                shortName: module.name,
                id: md5(module.name + moduleParent.name).substr(0, 11),
                level: parseInt(moduleParent.level) + 1,
                openingDate: moment().format("YYYY-MM-DD"),
                selectedDataset: module.selectedDataset,
                selectedSections: module.selectedSections,
                selectedDataElements: module.selectedDataElements,
                attributeValues: [{
                    attribute: {
                        id: "a1fa2777924"
                    },
                    value: "Module"
                }],
                parent: {
                    name: moduleParent.name,
                    id: moduleParent.id
                }
            };
        });
        return result;
    };

    var mapToDataSets = function(modules, moduleParent, originalDatasets) {
        var currentDatasets = _.filter(originalDatasets, function(ds) {
            return _.any(modules, {
                "datasets": [{
                    "id": ds.id
                }]
            });
        });
        return _.map(currentDatasets, function(ds) {
            var belongsToThisDataSet = {
                "datasets": [{
                    "id": ds.id
                }]
            };
            var intoOrgUnits = function(module) {
                return {
                    "name": module.name,
                    "id": md5(module.name + moduleParent.name).substr(0, 11)
                };
            };

            var modulesWithThisDataset = _.map(_.filter(modules, belongsToThisDataSet), intoOrgUnits);
            ds.organisationUnits = ds.organisationUnits || [];
            ds.organisationUnits = ds.organisationUnits.concat(modulesWithThisDataset);
            return ds;
        });
    };

    var isOfType = function(orgUnit, type) {
        return _.any(orgUnit.attributeValues, {
            attribute: {
                id: "a1fa2777924"
            },
            value: type
        });
    };

    var filterModules = function(orgUnits) {
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

    return {
        "mapToProjectForDhis": mapToProjectForDhis,
        "mapToProjectForView": mapToProjectForView,
        "mapToModules": mapToModules,
        'mapToDataSets': mapToDataSets,
        "getChildOrgUnitNames": getChildOrgUnitNames,
        "filterModules": filterModules
    };
});