define(["orgUnitGroupHelper", "angularMocks", "utils", "moment", "lodash", "orgUnitRepository", "orgUnitGroupRepository"],
    function(OrgUnitGroupHelper, mocks, utils, moment, _, OrgUnitRepository, OrgUnitGroupRepository) {
        describe("Orgunit Group Helper", function() {
            var hustle, orgUnitRepository, orgUnitGroupRepository, scope, orgUnitGroupHelper, q;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($hustle, $q, $rootScope) {
                hustle = $hustle;
                q = $q;
                scope = $rootScope.$new();

                orgUnitGroupRepository = {
                    "findAll": function () {},
                    "upsert": function() {}
                };

                orgUnitRepository = new OrgUnitRepository();

                scope.locale = "en";

                scope.resourceBundle = {
                    "upsertOrgUnitGroupsDesc": "upsertOrgUnitGroupsDesc"
                };

                spyOn(hustle, "publish");
            }));

            it("should associate the orgUnits to the new org unit groups", function() {
                var modules = [{
                    "name": "someModuleName",
                    "parent": {
                        "id": "someProjectId"
                    },
                    "active": true,
                    "shortName": "someModuleName",
                    "id": "someModuleId"
                }];

                var syncedOrgunitGroupIds = [];
                var localOrgunitGroupIds = ['someOrgunitGroupId', 'someOtherOrgunitGroupId'];

                var syncedOrgUnitGroups = [];
                var localOrgunitgroups = [{
                    "name": "someOrgunitGroupName",
                    "id": "someOrgunitGroupId",
                    "organisationUnits": []
                },{
                    "name": "someOtherOrgunitGroupName",
                    "id": "someOtherOrgunitGroupId",
                    "organisationUnits": []
                }];

                var expectedOutput = [{
                    "name": 'someOrgunitGroupName',
                    "id": 'someOrgunitGroupId',
                    "organisationUnits": [{
                        "id": 'someModuleId',
                        "name": 'someModuleName',
                        "localStatus": "NEW"
                    }]
                }, {
                    "name": 'someOtherOrgunitGroupName',
                    "id": 'someOtherOrgunitGroupId',
                    "organisationUnits": [{
                        "id": 'someModuleId',
                        "name": 'someModuleName',
                        "localStatus": "NEW"
                    }]
                }];

                spyOn(orgUnitGroupRepository, "findAll").and.returnValues(utils.getPromise(q, syncedOrgUnitGroups), utils.getPromise(q, localOrgunitgroups));
                spyOn(orgUnitGroupRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepository, orgUnitGroupRepository);

                orgUnitGroupHelper.associateOrgunitsToGroups(modules, syncedOrgunitGroupIds, localOrgunitGroupIds);
                scope.$apply();

                expect(orgUnitGroupRepository.upsert).toHaveBeenCalledWith(expectedOutput);
                expect(hustle.publish.calls.argsFor(0)).toEqual([{
                    "data": {
                        "orgUnitGroupIds": ["someOrgunitGroupId", "someOtherOrgunitGroupId"],
                        "orgUnitIds": ["someModuleId"]
                    },
                    "type": "upsertOrgUnitGroups",
                    "locale": "en",
                    "desc": "upsertOrgUnitGroupsDesc"
                }, "dataValues"]);
            });

            it("should unassociate the orgUnits from the orgUnitGroups which are unselected", function() {
                var modules = [{
                    "name": "someModuleName",
                    "parent": {
                        "id": "someProjectId"
                    },
                    "active": true,
                    "shortName": "someModuleName",
                    "id": "someModuleId"
                }];

                var syncedOrgunitGroupIds = ['someAnotherOrgUnitGroupId'];
                var localOrgunitGroupIds = [];

                var syncedOrgUnitGroups = [{
                    "name": "someAnotherGroupName",
                    "id": "someAnotherOrgUnitGroupId",
                    "organisationUnits": [{
                        "id": 'someModuleId',
                        "name": "someModuleName"
                    }]
                }];
                var localOrgunitgroups = [];

                var expectedOutput = [{
                    "name": 'someAnotherGroupName',
                    "id": 'someAnotherOrgUnitGroupId',
                    "organisationUnits": [{
                        "id": 'someModuleId',
                        "name": "someModuleName",
                        "localStatus": "DELETED"
                    }]
                }];

                spyOn(orgUnitGroupRepository, "findAll").and.returnValues(utils.getPromise(q, syncedOrgUnitGroups), utils.getPromise(q, localOrgunitgroups));
                spyOn(orgUnitGroupRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepository, orgUnitGroupRepository);

                orgUnitGroupHelper.associateOrgunitsToGroups(modules, syncedOrgunitGroupIds, localOrgunitGroupIds);
                scope.$apply();

                expect(orgUnitGroupRepository.upsert).toHaveBeenCalledWith(expectedOutput);
                expect(hustle.publish.calls.argsFor(0)).toEqual([{
                    "data": {
                        "orgUnitGroupIds": ["someAnotherOrgUnitGroupId"],
                        "orgUnitIds": ["someModuleId"]
                    },
                    "type": "upsertOrgUnitGroups",
                    "locale": "en",
                    "desc": "upsertOrgUnitGroupsDesc"
                }, "dataValues"]);
            });

            it("should associate the orgUnits to the newly selected orgUnitGroup and unassociate from the older orgunitGroup", function() {
                var modules = [{
                    "name": "someModuleName",
                    "parent": {
                        "id": "someProjectId"
                    },
                    "active": true,
                    "shortName": "someModuleName",
                    "id": "someModuleId"
                }];

                var syncedOrgunitGroupIds = ['someAnotherOrgunitGroupId'];
                var localOrgunitGroupIds = ['someOrgunitGroupId', 'someOtherOrgunitGroupId'];

                var syncedOrgUnitGroups = [{
                    "name": "someAnotherOrgunitGroup",
                    "id": "someAnotherOrgunitGroupId",
                    "organisationUnits": [{
                        "id": "someModuleId",
                        "name": "someModuleName"
                    }]
                }];
                var localOrgunitgroups = [{
                    "name": "someOrgunitGroupName",
                    "id": "someOrgunitGroupId",
                    "organisationUnits": []
                },{
                    "name": "someOtherOrgunitGroupName",
                    "id": "someOtherOrgunitGroupId",
                    "organisationUnits": []
                }];

                var expectedOutput = [{
                    "name": "someAnotherOrgunitGroup",
                    "id": "someAnotherOrgunitGroupId",
                    "organisationUnits": [{
                        "id": "someModuleId",
                        "name": "someModuleName",
                        "localStatus": "DELETED"
                    }]
                }, {
                    "name": 'someOrgunitGroupName',
                    "id": 'someOrgunitGroupId',
                    "organisationUnits": [{
                        "id": "someModuleId",
                        "name": "someModuleName",
                        "localStatus": "NEW"
                    }]
                }, {
                    "name": 'someOtherOrgunitGroupName',
                    "id": 'someOtherOrgunitGroupId',
                    "organisationUnits": [{
                        "id": 'someModuleId',
                        "name": "someModuleName",
                        "localStatus": "NEW"
                    }]
                }];

                spyOn(orgUnitGroupRepository, "findAll").and.returnValues(utils.getPromise(q, syncedOrgUnitGroups), utils.getPromise(q, localOrgunitgroups));
                spyOn(orgUnitGroupRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
                orgUnitGroupHelper = new OrgUnitGroupHelper(hustle, q, scope, orgUnitRepository, orgUnitGroupRepository);

                orgUnitGroupHelper.associateOrgunitsToGroups(modules, syncedOrgunitGroupIds, localOrgunitGroupIds);
                scope.$apply();

                expect(orgUnitGroupRepository.upsert).toHaveBeenCalledWith(expectedOutput);
                expect(hustle.publish.calls.argsFor(0)).toEqual([{
                    "data": {
                        "orgUnitGroupIds": ["someAnotherOrgunitGroupId", "someOrgunitGroupId", "someOtherOrgunitGroupId"],
                        "orgUnitIds": ["someModuleId"]
                    },
                    "type": "upsertOrgUnitGroups",
                    "locale": "en",
                    "desc": "upsertOrgUnitGroupsDesc"
                }, "dataValues"]);
            });
        });
    });
