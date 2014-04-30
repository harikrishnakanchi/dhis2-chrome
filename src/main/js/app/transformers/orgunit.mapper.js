define(["lodash", "md5", "moment"], function(_, md5, moment) {

    var mapToProjectForDhis = function(orgUnit, parentOrgUnit) {

        var projectOrgUnit = {
            'id': md5(orgUnit.name + parentOrgUnit.name).substr(0, 11),
            'name': orgUnit.name,
            'shortName': orgUnit.name,
            'level': 4,
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

    var getProjects = function(allOrgUnits, parentId) {
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
            'openingDate': moment(dhisProject.openingDate).toDate(),
            'context': getAttributeValue(dhisProject, "prjCon"),
            'location': getAttributeValue(dhisProject, "prjLoc"),
            'projectType': getAttributeValue(dhisProject, "prjType"),
            'populationType': getAttributeValue(dhisProject, "prjPopType"),
            'endDate': endDate ? moment(endDate).toDate() : undefined,
        };
    };

    var mapToModules = function(modules, moduleParent) {
        var result = _.map(modules, function(module) {
            return {
                name: module.name,
                shortName: module.name,
                level: moduleParent.level + 1,
                id: md5(module.name + moduleParent.name).substr(0, 11),
                openingDate: moment().format("YYYY-MM-DD"),
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

    var mapToDataSets = function(modules, moduleParent) {
        var result = _.map(modules, function(module) {
            var datasets = module.datasets;
            var restructuredDatasets = _.map(datasets, function(dataset) {
                return _.merge(dataset, {
                    "organisationUnits": [{
                        "name": module.name,
                        "id": md5(module.name + moduleParent.name).substr(0, 11)
                    }]
                });
            });
            return restructuredDatasets;
        });
        return _.flatten(result);
    };

    return {
        "mapToProjectForDhis": mapToProjectForDhis,
        "mapToProjectForView": mapToProjectForView,
        "mapToModules": mapToModules,
        'mapToDataSets': mapToDataSets,
        "getProjects": getProjects
    };

});