define(["lodash", "md5", "moment"], function(_, md5, moment) {

    var mapToProjectForDhis = function(orgUnit, parentOrgUnit) {

        var projectOrgUnit = {
            'id': md5(orgUnit.name + parentOrgUnit.name).substr(0, 11),
            'name': orgUnit.name,
            'shortName': orgUnit.name,
            'level': 4,
            'openingDate': moment(orgUnit.openingDate).format("YYYY-MM-DD"),
            'parent': _.pick(parentOrgUnit, "name", "id"),
            'attributeValues': []
        };

        projectOrgUnit.attributeValues.push({
            "attribute": {
                "code": "prjConDays",
                "name": "No of Consultation days per week",
                "id": "VKc7bvogtcP"
            },
            "value": orgUnit.consultDays
        }, {
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
            'consultDays': getAttributeValue(dhisProject, "prjConDays"),
            'context': getAttributeValue(dhisProject, "prjCon"),
            'location': getAttributeValue(dhisProject, "prjLoc"),
            'projectType': getAttributeValue(dhisProject, "prjType"),
            'populationType': getAttributeValue(dhisProject, "prjPopType"),
            'endDate': endDate ? moment(endDate).toDate() : undefined,
        };
    };

    return {
        "mapToProjectForDhis": mapToProjectForDhis,
        "mapToProjectForView": mapToProjectForView,
    };
});