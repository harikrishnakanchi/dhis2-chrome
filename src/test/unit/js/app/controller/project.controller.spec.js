define(["projectController", "angularMocks", "utils", "lodash", "moment", "orgUnitMapper", "timecop", "orgUnitGroupHelper", "properties", "approvalDataRepository", "orgUnitGroupSetRepository"], function(ProjectController, mocks, utils, _, moment, orgUnitMapper, timecop, OrgUnitGroupHelper, properties, ApprovalDataRepository, OrgUnitGroupSetRepository) {
    describe("project controller tests", function() {
        var scope, q, userRepository, parent, fakeModal, orgUnitRepo, hustle, rootScope, approvalDataRepository, orgUnitGroupSetRepository, orgUnitGroupSets;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            hustle = $hustle;
            q = $q;
            orgUnitGroupHelper = new OrgUnitGroupHelper();

            orgUnitRepo = utils.getMockRepo(q);
            orgUnitRepo.getChildOrgUnitNames = jasmine.createSpy("getChildOrgUnitNames").and.returnValue(utils.getPromise(q, []));
            orgUnitRepo.getAllModulesInOrgUnits = jasmine.createSpy("getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, []));
            orgUnitRepo.findAllByParent = jasmine.createSpy("findAllByParent").and.returnValue(utils.getPromise(q, []));

            approvalDataRepository = new ApprovalDataRepository();
            orgUnitGroupSetRepository = new OrgUnitGroupSetRepository();

            userRepository = {
                "upsert": function() {
                    return utils.getPromise(q, [{}]);
                },
                "getAllProjectUsers": function() {
                    return utils.getPromise(q, [{}]);
                }
            };

            parent = {
                "id": "parent",
                "name": "parent",
                "children": []
            };

            scope.isNewMode = true;
            scope.orgUnit = {
                id: "blah"
            };

            scope.resourceBundle = {
                "upsertOrgUnitDesc": "upsert org unit ",
                "uploadApprovalDataDesc": "approve data at coordination level for ",
                "uploadCompletionDataDesc": "approve data at project level for "
            };

            scope.currentUser = {
                "locale": "en"
            };

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

            orgUnitGroupSets = [{
                "name": "Mode Of Operation",
                "code": "mode_of_operation",
                "id": "a9ca3d1ed93",
                "organisationUnitGroups": [{
                    "id": "a560238bc90",
                    "name": "Direct operation"
                }, {
                    "id": "a92cee050b0",
                    "name": "Remote operation"
                }]
            }, {
                "name": "Model Of Management",
                "code": "model_of_management",
                "id": "a2d4a1dee27",
                "organisationUnitGroups": [{
                    "id": "a11a7a5d55a",
                    "name": "Collaboration"
                }]
            }, {
                "name": "Reason For Intervention",
                "code": "reason_for_intervention",
                "id": "a86f66f29d4",
                "organisationUnitGroups": [{
                    "id": "a8014cfca5c",
                    "name": "Natural Disaster"
                }]
            }, {
                "name": "Type of Population",
                "code": "type_of_population",
                "id": "a8a579d5fab",
                "organisationUnitGroups": [{
                    "id": "a35778ed565",
                    "name": "Most-at-risk Population"
                }, {
                    "id": "a48f665185e",
                    "name": "Refugee"
                }]
            }, {
                "name": "Context",
                "code": "context",
                "id": "a5c18ef7277",
                "organisationUnitGroups": [{
                    "id": "a16b4a97ce4",
                    "name": "Post-conflict"
                }]
            }, {
                "name": "Project Type",
                "code": "project_type",
                "organisationUnitGroups": [{
                    "name": "Some Type"
                }]
            }];
            spyOn(orgUnitGroupSetRepository, "getAll").and.returnValue(utils.getPromise(q, orgUnitGroupSets));
            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, orgUnitGroupHelper, approvalDataRepository, orgUnitGroupSetRepository);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should set initial value for project attributes on init", function() {
            scope.$apply();

            expect(scope.allContexts).toEqual([{
                "id": "a16b4a97ce4",
                "name": "Post-conflict"
            }]);
            expect(scope.allPopTypes).toEqual([{
                "id": "a35778ed565",
                "name": "Most-at-risk Population"
            }, {
                "id": "a48f665185e",
                "name": "Refugee"
            }]);
            expect(scope.reasonForIntervention).toEqual([{
                "id": "a8014cfca5c",
                "name": "Natural Disaster"
            }]);
            expect(scope.modeOfOperation).toEqual([{
                "id": "a560238bc90",
                "name": "Direct operation"
            }, {
                "id": "a92cee050b0",
                "name": "Remote operation"
            }]);
            expect(scope.modelOfManagement).toEqual([{
                "id": "a11a7a5d55a",
                "name": "Collaboration"
            }]);
        });

        it("should save project in dhis", function() {
            var newOrgUnit = {};
            var expectedNewOrgUnit = {
                "id": "blah",
                "name": "blah"
            };
            spyOn(orgUnitMapper, "mapToProjectForDhis").and.returnValue(expectedNewOrgUnit);
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(location, 'hash');

            scope.save(newOrgUnit, parent);
            scope.$apply();
        });

        it("should display error if saving organization unit fails", function() {
            spyOn(hustle, "publish").and.returnValue(utils.getRejectedPromise(q, {}));

            scope.save({}, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it("should update project", function() {
            var expectedNewOrgUnit = {
                "id": "blah",
                "name": "blah"
            };

            spyOn(orgUnitMapper, "mapToExistingProject").and.returnValue(expectedNewOrgUnit);
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(location, 'hash');
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

            scope.update({}, {});
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith([expectedNewOrgUnit]);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: [expectedNewOrgUnit],
                type: "upsertOrgUnit",
                locale: "en",
                desc: "upsert org unit blah"
            }, "dataValues");
        });

        it("should display error if updating organization unit fails", function() {
            spyOn(hustle, "publish").and.returnValue(utils.getRejectedPromise(q, {}));
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

            scope.update({}, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it("should reset form", function() {
            scope.newOrgUnit = {
                'id': '123',
                'openingDate': moment().add(-7, 'days').toDate(),
                'endDate': moment().add(7, 'days').toDate(),
            };
            scope.saveFailure = true;

            scope.reset();
            scope.$apply();

            expect(scope.newOrgUnit).toEqual({
                openingDate: moment().toDate(),
                autoApprove: 'false'
            });
            expect(scope.saveFailure).toEqual(false);
        });

        it("should open the opening date datepicker", function() {
            var event = {
                preventDefault: function() {},
                stopPropagation: function() {}
            };
            spyOn(event, 'preventDefault');
            spyOn(event, 'stopPropagation');

            scope.openOpeningDate(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(scope.openingDate).toBe(true);
            expect(scope.endDate).toBe(false);
        });

        it("should open the end date datepicker", function() {
            var event = {
                preventDefault: function() {},
                stopPropagation: function() {}
            };
            spyOn(event, 'preventDefault');
            spyOn(event, 'stopPropagation');

            scope.openEndDate(event);

            expect(event.preventDefault).toHaveBeenCalled();
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(scope.openingDate).toBe(false);
            expect(scope.endDate).toBe(true);
        });

        it("should show project details when in view mode", function() {
            scope.$apply();

            scope.newOrgUnit = {};
            scope.orgUnit = {
                "name": "anyname",
                "openingDate": "2010-01-01",
                'level': 3,
                "attributeValues": [{
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": "Post-conflict"
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location",
                        "id": "CaQPMk01JB8"
                    },
                    "value": "val3"
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": "2011-01-01"
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": "Most-at-risk Population"
                }, {
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code",
                        "id": "fa5e00d5cd2"
                    },
                    "value": "RU118"
                }, {
                    "attribute": {
                        "code": 'reasonForIntervention',
                        "name": 'Reason For Intervention',
                        "id": 'e7af7f29053'
                    },
                    "value": 'Natural Disaster'
                }, {
                    "attribute": {
                        "code": 'modeOfOperation',
                        "name": 'Mode Of Operation',
                        "id": 'a048b89d331'
                    },
                    "value": 'Direct operation'
                }, {
                    "attribute": {
                        "code": 'modelOfManagement',
                        "name": 'Model Of Management',
                        "id": 'd2c3e7993f6'
                    },
                    "value": 'Collaboration'
                }, {
                    "attribute": {
                        "code": "autoApprove",
                        "name": "Auto Approve",
                        "id": "e65afaec61d"
                    },
                    "value": "true"
                }, {
                    "attribute": {
                        "code": "projectType",
                        "name": "Project Type",
                    },
                    "value": "Some Type"
                }, {
                    "attribute": {
                        "code": "population",
                        "name": "Population"
                    },
                    "value": "1000"
                }, {
                    "attribute": {
                        "code": "proportionOfChildrenLessThanOneYearOld",
                        "name": "Proportion of children < 1 year old",
                    },
                    "value": "11"
                }, {
                    "attribute": {
                        "code": "proportionOfChildrenLessThatFiveYearsOld",
                        "name": "Proportion of children < 5 years old"
                    },
                    "value": "12"
                }, {
                    "attribute": {
                        "code": "proportionOfWomenOfChildBearingAge",
                        "name": "Proportion of women of child bearing age"
                    },
                    "value": "13"
                }]
            };
            var expectedNewOrgUnit = {
                'name': scope.orgUnit.name,
                'openingDate': moment("2010-01-01").toDate(),
                'context': {
                    "id": "a16b4a97ce4",
                    "name": "Post-conflict"
                },
                'location': "val3",
                'endDate': moment("2011-01-01").toDate(),
                'populationType': {
                    "id": "a35778ed565",
                    "name": "Most-at-risk Population"
                },
                'projectCode': 'RU118',
                'reasonForIntervention': {
                    "id": "a8014cfca5c",
                    "name": "Natural Disaster"
                },
                'modeOfOperation': {
                    "id": "a560238bc90",
                    "name": 'Direct operation'
                },
                'modelOfManagement': {
                    "id": "a11a7a5d55a",
                    "name": 'Collaboration'
                },
                'projectType': {
                    'name': 'Some Type'
                },
                "population": "1000",
                "proportionChildrenLessThanOneYear": "11",
                "proportionChildrenLessThanFiveYears": "12",
                "proportionWomenOfChildBearingAge": "13",
                'autoApprove': 'true'
            };

            scope.isNewMode = false;
            scope.orgUnit.parent = {
                "id": "parentId"
            };
            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, orgUnitGroupHelper, approvalDataRepository, orgUnitGroupSetRepository);
            scope.$apply();

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

        it("should get all existing project codes while preparing new form", function() {
            var project1 = {
                "id": "Kabul1",
                "name": "Kabul-AF101",
                "attributeValues": [{
                    "attribute": {
                        "code": "projCode"
                    },
                    "value": "AF101"
                }]
            };

            orgUnitRepo.getAllProjects.and.returnValue(utils.getPromise(q, [project1]));

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, orgUnitGroupHelper, approvalDataRepository, orgUnitGroupSetRepository);
            scope.$apply();

            expect(scope.existingProjectCodes).toEqual(["AF101"]);
        });

        it("should get the names of all peer projects while preparing new form", function() {
            var project1 = {
                "id": "Kabul1",
                "name": "Kabul-AF101",
                "attributeValues": [{
                    "attribute": {
                        "code": "projCode"
                    },
                    "value": "AF101"
                }]
            };

            orgUnitRepo.findAllByParent.and.returnValue(utils.getPromise(q, [project1]));

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, orgUnitGroupHelper, approvalDataRepository, orgUnitGroupSetRepository);
            scope.$apply();

            expect(scope.peerProjects).toEqual(["Kabul-AF101"]);
        });

        it("should take the user to the view page of the parent country on clicking cancel", function() {
            var parentOrgUnit = {
                'id': 'parent',
                'name': 'parent'
            };

            scope.$parent = {
                "closeNewForm": function() {}
            };

            spyOn(scope.$parent, "closeNewForm").and.callFake(function(parentOrgUnit) {
                return;
            });

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, orgUnitGroupHelper, approvalDataRepository, orgUnitGroupSetRepository);

            scope.closeForm(parentOrgUnit);

            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(parentOrgUnit);
        });

        it("should update org unit groups on updating project", function() {
            var modules = [{
                "name": "OBGYN",
                "parent": {
                    "id": "a5dc7e2aa0e"
                },
                "active": true,
                "shortName": "OBGYN",
                "id": "a72ec34b863",
                "attributeValues": [{
                    "attribute": {
                        "code": "Type",
                    },
                    "value": "Module"
                }, {
                    "attribute": {
                        "code": "isLineListService",
                    },
                    "value": "true"
                }]
            }];

            var originOrgUnits = [{
                "id": "child1",
                "name": "child1"
            }, {
                "id": "child2",
                "name": "child2"
            }];

            var orgUnit = {
                "id": "blah"
            };
            var newOrgUnit = {
                "id": "blah",
                "autoApprove": true,
                "children": [{
                    "id": "op1"
                }]
            };

            orgUnitRepo.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

            spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitMapper, "mapToExistingProject").and.returnValue(newOrgUnit);
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(location, 'hash');
            orgUnitRepo.getAllModulesInOrgUnits = jasmine.createSpy("getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, modules));

            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

            scope.update(newOrgUnit, orgUnit);
            scope.$apply();


            var expectedOrgunitsToAssociate = [{
                "id": "child1",
                "name": "child1"
            }, {
                "id": "child2",
                "name": "child2"
            }];

            expect(orgUnitGroupHelper.createOrgUnitGroups).toHaveBeenCalledWith(expectedOrgunitsToAssociate, true);
        });
    });

});
