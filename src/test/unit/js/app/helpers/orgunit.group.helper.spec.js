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

                scope.locale = "en";

                scope.resourceBundle = {
                    "upsertOrgUnitGroupsDesc": "upsertOrgUnitGroupsDesc"
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
                        "name": "Hospital Unit Code",
                        "id": "c6d3c8a7286",
                        "code": "hospitalUnitCode"
                    },
                    "value": "C2"
                }, {
                    "attribute": {
                        "name": "Operation Unit Type",
                        "id": "52ec8ccaf8f"
                    },
                    "value": "Hospital"
                }];

                var orgunitgroups = [{
                    "name": "Hospital",
                    "id": "a8b42a1c9b8",
                    "organisationUnits": []
                }, {
                    "name": "Post-conflict",
                    "id": "a16b4a97ce4",
                    "organisationUnits": [{
                        "id": 'a72ec34b863',
                        "name": 'OBGYN'
                    }]
                }, {
                    "name": "General Population",
                    "id": "a16b4653ce4",
                    "organisationUnits": []
                }, {
                    "name": "Unit Code - C2",
                    "id": "a9ab62b5ef3",
                    "organisationUnits": []
                }, {
                    "name": "Unit Code - A",
                    "id": "w2aws2d2ef3",
                    "organisationUnits": [{
                        "id": 'a72ec34b863',
                        "name": 'OBGYN'
                    }]
                }];

                var expectedOutput = [{
                    "name": "Post-conflict",
                    "id": "a16b4a97ce4",
                    "organisationUnits": [{
                        "id": 'a72ec34b863',
                        "name": 'OBGYN',
                        "localStatus": "DELETED"
                    }]
                }, {
                    "name": "Unit Code - A",
                    "id": "w2aws2d2ef3",
                    "organisationUnits": [{
                        "id": 'a72ec34b863',
                        "name": 'OBGYN',
                        "localStatus": "DELETED"
                    }]
                }, {
                    "name": 'Unit Code - C2',
                    "id": 'a9ab62b5ef3',
                    "organisationUnits": [{
                        "id": 'a72ec34b863',
                        "name": 'OBGYN',
                        "localStatus": "NEW"
                    }]
                }, {
                    "name": 'Hospital',
                    "id": 'a8b42a1c9b8',
                    "organisationUnits": [{
                        "id": 'a72ec34b863',
                        "name": 'OBGYN',
                        "localStatus": "NEW"
                    }]
                }];

                spyOn(orgUnitGroupRepository, "getAll").and.returnValue(utils.getPromise(q, orgunitgroups));
                spyOn(orgUnitGroupRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                spyOn(orgUnitRepository, "getProjectAndOpUnitAttributes").and.returnValue(utils.getPromise(q, projectAndOpunitAttributes));
                orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepository, orgUnitGroupRepository);

                orgUnitGroupHelper.createOrgUnitGroups(modules, true);
                scope.$apply();

                expect(orgUnitGroupRepository.upsert).toHaveBeenCalledWith(expectedOutput);
                expect(orgUnitRepository.getProjectAndOpUnitAttributes).toHaveBeenCalled();
                expect(hustle.publish.calls.argsFor(0)).toEqual([{
                    "data": {
                        "orgUnitGroupIds": ["a16b4a97ce4", "w2aws2d2ef3", "a9ab62b5ef3", "a8b42a1c9b8"],
                        "orgUnitIds": ["a72ec34b863"]
                    },
                    "type": "upsertOrgUnitGroups",
                    "locale": "en",
                    "desc": "upsertOrgUnitGroupsDesc"
                }, "dataValues"]);
            });
        });
    });
