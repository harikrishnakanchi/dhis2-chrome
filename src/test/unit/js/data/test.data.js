define(["lodash"], function(_) {

    var dataSets = [{
        "name": "OPD",
        "id": "DS_OPD",
        "organisationUnits": [{
            "id": "mod1"
        }],
        "orgUnitIds": ["mod1"],
        "attributeValues": [{
            "attribute": {
                "id": "wFC6joy3I8Q",
                "code": "isNewDataModel",
            },
            "value": "false"
        }],
        "sections": [{
            "id": "Sec1"
        }, {
            "id": "Sec2"
        }]
    }, {
        "name": "Vaccination",
        "id": "Vacc",
        "organisationUnits": [{
            "id": "mod2"
        }],
        "orgUnitIds": ["mod2"],
        "attributeValues": [{
            "attribute": {
                "id": "wFC6joy3I8Q",
                "code": "isNewDataModel",
            },
            "value": "true"
        }],
        "sections": [{
            "id": "Sec3"
        }]
    }, {
        "name": "Geographic Origin",
        "id": "Geographic Origin",
        "organisationUnits": [{
            "id": "origin1",
        }, {
            "id": "origin2",
        }],
        "orgUnitIds": ["origin1", "origin2"],
        "attributeValues": [{
            "attribute": {
                "id": "wFC6joy3I8Q",
                "code": "isNewDataModel",
            },
            "value": "true"
        }],
        "sections": [{
            "id": "Origin"
        }]
    }];

    var categoryOptions = [{
        "id": "CO1",
        "name": "Resident"
    }, {
        "id": "CO2",
        "name": "Migrant"
    }, {
        "id": "CO3",
        "name": "LessThan5"
    }, {
        "id": "CO4",
        "name": "GreaterThan5"
    }];

    var categories = [{
        "id": "CT1",
        "categoryOptions": [categoryOptions[0], categoryOptions[1]]
    }, {
        "id": "CT2",
        "categoryOptions": [categoryOptions[2], categoryOptions[3]]
    }];

    var categoryCombos = [{
        "id": "CC1",
        "name": "CatCombo1",
        "categories": [categories[0], categories[1]]
    }, {
        "id": "CC2",
        "name": "CatCombo2",
        "categories": [categories[1]]
    }];

    var categoryOptionCombos = [{
        "id": "1",
        "categoryCombo": {
            "id": "CC1"
        },
        "name": "(CO1, CO3)",
        "code": "(CO1, CO3)_excludeFromTotal",
        "categoryOptions": [{
            "id": "CO1",
            "name": "Resident"
        }, {
            "id": "CO3",
            "name": "LessThan5"
        }]
    }, {
        "id": "2",
        "categoryCombo": {
            "id": "CC1"
        },
        "name": "(CO1, CO4)",
        "categoryOptions": [{
            "id": "CO1",
            "name": "Resident"
        }, {
            "id": "CO4",
            "name": "GreaterThan5"
        }]
    }, {
        "id": "3",
        "categoryCombo": {
            "id": "CC1"
        },
        "name": "(CO2, CO3)",
        "categoryOptions": [{
            "id": "CO2",
            "name": "Migrant"
        }, {
            "id": "CO3",
            "name": "LessThan5"
        }]
    }, {
        "id": "4",
        "categoryCombo": {
            "id": "CC1"
        },
        "name": "(CO2, CO4)",
        "categoryOptions": [{
            "id": "CO2",
            "name": "Migrant"
        }, {
            "id": "CO4",
            "name": "GreaterThan5"
        }]
    }, {
        "id": "5",
        "categoryCombo": {
            "id": "CC2"
        },
        "name": "(CO4)",
        "categoryOptions": [{
            "id": "CO4",
            "name": "GreaterThan5"
        }]
    }, {
        "id": "6",
        "categoryCombo": {
            "id": "CC2"
        },
        "name": "(CO3)",
        "categoryOptions": [{
            "id": "CO3",
            "name": "LessThan5"
        }]
    }];

    var dataElements = [{
        "id": "DE1",
        "code": "DE1_code",
        "name": "DE1 - ITFC",
        "shortName": "DE1 - ITFC",
        "formName": "DE1",
        "description": "some desc1",
        "categoryCombo": {
            "id": categoryCombos[0].id,
            "name": categoryCombos[0].name
        },
        "attributeValues": [{
            "value": "true",
            "attribute": {
                "id": "HjaBYio5UFK",
                "code": "mandatory"
            }
        }]
    }, {
        "id": "DE2",
        "code": "DE2_code",
        "name": "DE2 - ITFC",
        "shortName": "DE2 - ITFC",
        "formName": "DE2",
        "description": "some desc2",
        "categoryCombo": {
            "id": categoryCombos[1].id,
            "name": categoryCombos[1].name
        },
        "attributeValues": [{
            "value": "false",
            "attribute": {
                "id": "HjaBYio5UFK",
                "code": "mandatory"
            }
        }]
    }, {
        "id": "DE3",
        "code": "DE3_code",
        "name": "DE3 - ITFC",
        "shortName": "DE3 - ITFC",
        "formName": "DE3",
        "description": "some desc3",
        "categoryCombo": {
            "id": categoryCombos[1].id,
            "name": categoryCombos[1].name
        }
    }, {
        "id": "DE4",
        "code": "DE4_code",
        "name": "DE4 - ITFC",
        "shortName": "DE4 - ITFC",
        "formName": "DE4",
        "categoryCombo": {
            "id": categoryCombos[1].id,
            "name": categoryCombos[1].name
        }
    }];

    var sections = [{
        "id": "Sec1",
        "name": "Section 1",
        "sortOrder": 0,
        "dataSet": _.pick(dataSets[0], ['name', 'id']),
        "dataElements": [{
            "id": "DE1",
            "name": "DE1 - ITFC"
        }, {
            "id": "DE2",
            "name": "DE2 - ITFC"
        }, {
            "id": "DE4",
            "name": "DE4 - ITFC"
        }]
    }, {
        "id": "Sec2",
        "name": "Section 2",
        "sortOrder": 1,
        "dataSet": _.pick(dataSets[0], ['name', 'id']),
        "dataElements": [{
            "id": "DE1",
            "name": "DE1 - ITFC"
        }]
    }, {
        "id": "Sec3",
        "name": "Section 3",
        "sortOrder": 0,
        "dataSet": _.pick(dataSets[1], ['name', 'id']),
        "dataElements": [{
            "id": "DE3",
            "name": "DE3 - ITFC"
        }]
    }, {
        "id": "Origin",
        "name": "Origin",
        "sortOrder": 0,
        "dataSet": _.pick(dataSets[2], ['name', 'id']),
        "dataElements": [{
            "id": "DE4",
            "name": "Number Of Patients - Geographic Origin"
        }]
    }];

    var organisationUnits = [{
        "name": "proj1",
        "id": "proj_1",
        "parent": {
            "id": "country_1"
        },
        "attributeValues": [{
            "attribute": {
                "id": "a1fa2777924"
            },
            "value": "Project"
        }]
    }, {
        "name": "proj2",
        "id": "proj_2",
        "parent": {
            "id": "country_1"
        },
        "attributeValues": [{
            "attribute": {
                "id": "a1fa2777924"
            },
            "value": "Project"
        }]
    }, {
        "name": "mod1",
        "id": "mod1",
        "parent": {
            "id": "proj_1"
        },
        "attributeValues": [{
            "attribute": {
                "id": "a1fa2777924"
            },
            "value": "Module"
        }]
    }, {
        "name": "mod2",
        "id": "mod2",
        "parent": {
            "id": "proj_1"
        },
        "attributeValues": [{
            "attribute": {
                "id": "a1fa2777924"
            },
            "value": "Module"
        }]
    }, {
        "name": "mod3",
        "id": "mod3",
        "parent": {
            "id": "proj_2"
        },
        "attributeValues": [{
            "attribute": {
                "id": "a1fa2777924"
            },
            "value": "Module"
        }]
    }, {
        "name": "modunderopunit",
        "id": "mod11",
        "parent": {
            "id": "opunit1"
        },
        "attributeValues": [{
            "attribute": {
                "id": "a1fa2777924"
            },
            "value": "Module"
        }]
    }, {
        "name": "opunitUnderPrj",
        "id": "opunit1",
        "parent": {
            "id": "proj_1"
        },
        "attributeValues": [{
            "attribute": {
                "id": "a1fa2777924"
            },
            "value": "Operation Unit"
        }]
    }];

    var systemSettings = [{
        "excludedDataElements": {
            "moduleId": ["DE4"]
        },
        "id": "parent"
    }];

    var data = {
        "dataSets": dataSets,
        "categoryOptions": categoryOptions,
        "categories": categories,
        "categoryCombos": categoryCombos,
        "categoryOptionCombos": categoryOptionCombos,
        "dataElements": dataElements,
        "sections": sections,
        "organisationUnits": organisationUnits,
        "systemSettings": systemSettings
    };

    return {
        "get": function(typeName) {
            return _.cloneDeep(data[typeName]);
        }
    };

});
