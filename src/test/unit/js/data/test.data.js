define(["lodash"], function(_) {

    var dataSets = [{
        "name": "OPD",
        "id": "DS_OPD",
        "organisationUnits": [{
            "id": "mod1"
        }]
    }, {
        "name": "Vaccination",
        "id": "Vacc",
        "organisationUnits": [{
            "id": "mod2"
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
        "categories": [categories[0], categories[1]]
    }, {
        "id": "CC2",
        "categories": [categories[1]]
    }];

    var categoryOptionCombos = [{
        "id": "1",
        "categoryCombo": {
            "id": "CC1"
        },
        "name": "(CO1, CO3)",
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
        "name": "DE1 - ITFC",
        "shortName": "DE1 - ITFC",
        "formName": "DE1",
        "categoryCombo": categoryCombos[0]
    }, {
        "id": "DE2",
        "name": "DE2 - ITFC",
        "shortName": "DE2 - ITFC",
        "formName": "DE2",
        "categoryCombo": categoryCombos[1]
    }, {
        "id": "DE3",
        "name": "DE3 - ITFC",
        "shortName": "DE3 - ITFC",
        "formName": "DE3",
        "categoryCombo": categoryCombos[1]
    }, {
        "id": "DE4",
        "name": "DE4 - ITFC",
        "shortName": "DE4 - ITFC",
        "formName": "DE4",
        "categoryCombo": categoryCombos[1]
    }];

    var sections = [{
        "id": "Sec1",
        "dataSet": dataSets[0],
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
        "dataSet": dataSets[0],
        "dataElements": [{
            "id": "DE1",
            "name": "DE1 - ITFC"
        }]
    }, {
        "id": "Sec3",
        "dataSet": dataSets[1],
        "dataElements": [{
            "id": "DE3",
            "name": "DE3 - ITFC"
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