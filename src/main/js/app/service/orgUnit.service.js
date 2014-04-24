define(["properties"], function(properties) {
    return function($http) {
        var getPayload = function(orgUnit) {
            return {
                "organisationUnits": orgUnit
            };
        };

        var getPayloadForProject = function(orgUnit) {
            orgUnit = _.merge(orgUnit, {
                "attributeValues": [{
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
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": orgUnit.endDate
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": orgUnit.populationType
                }],
            });

            orgUnit = _.omit(orgUnit, ['consultDays', 'context', 'location', 'projectType', 'endDate', 'populationType']);

            return {
                "organisationUnits": [orgUnit]
            };
        };

        var create = function(orgUnit) {
            var payload = orgUnit.level === 4 ? getPayloadForProject(orgUnit) : getPayload(orgUnit);
            return $http.post(properties.dhis.url + '/api/metadata', payload);
        };

        return {
            "create": create
        };
    };
});