define(["orgUnitGroupHelper", "angularMocks", "utils", "moment", "lodash", "orgUnitRepository", "orgUnitGroupRepository"],
    function(OrgUnitGroupHelper, mocks, utils, moment, _, OrgUnitRepository, OrgUnitGroupRepository) {
        describe("Orgunit Group Helper", function() {
            var hustle, orgUnitRepository, orgUnitGroupRepository, scope, orgUnitGroupHelper, q;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($hustle, $q, $rootScope) {
                hustle = $hustle;
                q = $q;
                scope = $rootScope.$new();

                orgUnitRepository = new OrgUnitRepository();
                orgUnitGroupRepository = {
                    "getAll": function() {},
                    "upsert": function() {}
                };

                spyOn(hustle, "publish");
            }));

            it("should add modules to orgunit groups while creating module", function() {
                var modules = [{
                    "name": "OBGYN",
                    "parent": {
                        "id": "a5dc7e2aa0e"
                    },
                    "active": true,
                    "shortName": "OBGYN",
                    "id": "a72ec34b863"
                }];

                var projectAndOpunitAttributes = [{
                    "attribute": {
                        "name": "Type",
                        "id": "a1fa2777924"
                    },
                    "value": "Operation Unit"
                }, {
                    "attribute": {
                        "name": "Hospital Unit Code",
                        "id": "c6d3c8a7286"
                    },
                    "value": "C2"
                }, {
                    "attribute": {
                        "name": "Operation Unit Type",
                        "id": "52ec8ccaf8f"
                    },
                    "value": "Hospital"
                }, {
                    "attribute": {
                        "name": "Type",
                        "id": "a1fa2777924"
                    },
                    "value": "Project"
                }, {
                    "attribute": {
                        "name": "Project Code",
                        "id": "fa5e00d5cd2"
                    },
                    "value": "CI146"
                }, {
                    "attribute": {
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": "Post-conflict"
                }, {
                    "attribute": {
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": "General Population"
                }, {
                    "attribute": {
                        "name": "Reason For Intervention",
                        "id": "e7af7f29053"
                    },
                    "value": "Access to health care"
                }, {
                    "attribute": {
                        "name": "Model Of Management",
                        "id": "d2c3e7993f6"
                    },
                    "value": "Collaboration"
                }, {
                    "attribute": {
                        "name": "Mode Of Operation",
                        "id": "a048b89d331"
                    },
                    "value": "Direct operation"
                }];

                var orgunitgroups = [{
                    "name": "Access to health care",
                    "id": "a559915efe5",
                    "organisationUnits": []
                }, {
                    "name": "Armed Conflict",
                    "id": "ab4b1006371",
                    "organisationUnits": []
                }, {
                    "name": "Collaboration",
                    "id": "a11a7a5d55a",
                    "organisationUnits": []
                }, {
                    "name": "Community",
                    "id": "a82df41632d",
                    "organisationUnits": []
                }, {
                    "name": "Cross-border instability",
                    "id": "abfef86a4b6",
                    "organisationUnits": []
                }, {
                    "name": "Direct operation",
                    "id": "a560238bc90",
                    "organisationUnits": []
                }, {
                    "name": "Epidemic",
                    "id": "a9e29c075cc",
                    "organisationUnits": []
                }, {
                    "name": "General Population",
                    "id": "afbdf5ffe08",
                    "organisationUnits": []
                }, {
                    "name": "Health Center",
                    "id": "a376a7aaec9",
                    "organisationUnits": []
                }, {
                    "name": "Hospital",
                    "id": "a8b42a1c9b8",
                    "organisationUnits": []
                }, {
                    "name": "Internal instability",
                    "id": "ac606ebc28f",
                    "organisationUnits": []
                }, {
                    "name": "Internally Displaced People",
                    "id": "a969403a997",
                    "organisationUnits": []
                }, {
                    "name": "MSF management",
                    "id": "aa9a24c9126",
                    "organisationUnits": []
                }, {
                    "name": "Most-at-risk Population",
                    "id": "a35778ed565",
                    "organisationUnits": []
                }, {
                    "name": "Natural Disaster",
                    "id": "a8014cfca5c",
                    "organisationUnits": []
                }, {
                    "name": "Post-conflict",
                    "id": "a16b4a97ce4",
                    "organisationUnits": []
                }, {
                    "name": "Refugee",
                    "id": "a48f665185e",
                    "organisationUnits": []
                }, {
                    "name": "Remote management",
                    "id": "a91227821b3",
                    "organisationUnits": []
                }, {
                    "name": "Remote operation",
                    "id": "a92cee050b0",
                    "organisationUnits": []
                }, {
                    "name": "Stable",
                    "id": "af40faf6384",
                    "organisationUnits": []
                }, {
                    "name": "Unit Code - A",
                    "id": "a0cc175b9c0",
                    "organisationUnits": []
                }, {
                    "name": "Unit Code - B1",
                    "id": "aedbab45572",
                    "organisationUnits": []
                }, {
                    "name": "Unit Code - C1",
                    "id": "aa9f7e97965",
                    "organisationUnits": []
                }, {
                    "name": "Unit Code - C2",
                    "id": "a9ab62b5ef3",
                    "organisationUnits": []
                }, {
                    "name": "Unit Code - C3",
                    "id": "a0a3d72134f",
                    "organisationUnits": []
                }, {
                    "name": "Unit Code - X",
                    "id": "a9dd4e46126",
                    "organisationUnits": []
                }];

                var expectedOutput = [{
                    name: 'Access to health care',
                    id: 'a559915efe5',
                    organisationUnits: [{
                        id: 'a72ec34b863',
                        name: 'OBGYN'
                    }]
                }, {
                    name: 'Collaboration',
                    id: 'a11a7a5d55a',
                    organisationUnits: [{
                        id: 'a72ec34b863',
                        name: 'OBGYN'
                    }]
                }, {
                    name: 'Direct operation',
                    id: 'a560238bc90',
                    organisationUnits: [{
                        id: 'a72ec34b863',
                        name: 'OBGYN'
                    }]
                }, {
                    name: 'General Population',
                    id: 'afbdf5ffe08',
                    organisationUnits: [{
                        id: 'a72ec34b863',
                        name: 'OBGYN'
                    }]
                }, {
                    name: 'Hospital',
                    id: 'a8b42a1c9b8',
                    organisationUnits: [{
                        id: 'a72ec34b863',
                        name: 'OBGYN'
                    }]
                }, {
                    name: 'Post-conflict',
                    id: 'a16b4a97ce4',
                    organisationUnits: [{
                        id: 'a72ec34b863',
                        name: 'OBGYN'
                    }]
                }, {
                    name: 'Unit Code - C2',
                    id: 'a9ab62b5ef3',
                    organisationUnits: [{
                        id: 'a72ec34b863',
                        name: 'OBGYN'
                    }]
                }];

                spyOn(orgUnitGroupRepository, "getAll").and.returnValue(utils.getPromise(q, orgunitgroups));
                spyOn(orgUnitGroupRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepository, "getProjectAndOpUnitAttributes").and.returnValue(utils.getPromise(q, projectAndOpunitAttributes));
                orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepository, orgUnitGroupRepository);

                orgUnitGroupHelper.createOrgUnitGroups(modules, false);
                scope.$apply();

                expect(orgUnitGroupRepository.upsert).toHaveBeenCalled();
                expect(orgUnitRepository.getProjectAndOpUnitAttributes).toHaveBeenCalled();
                expect(hustle.publish.calls.argsFor(0)).toEqual([{
                    "data": expectedOutput,
                    "type": "upsertOrgUnitGroups"
                }, "dataValues"]);
            });
        });
    });