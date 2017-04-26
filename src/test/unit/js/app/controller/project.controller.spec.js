define(["projectController", "angularMocks", "utils", "lodash", "moment", "orgUnitMapper", "timecop", "orgUnitGroupHelper",
    "properties", "approvalDataRepository", "orgUnitGroupSetRepository", "translationsService", "customAttributes"],
    function(ProjectController, mocks, utils, _, moment, orgUnitMapper, timecop, OrgUnitGroupHelper,
             properties, ApprovalDataRepository, OrgUnitGroupSetRepository, TranslationsService, customAttributes) {
    describe("project controller tests", function() {
        var scope, q, userRepository, parent, fakeModal, orgUnitRepo, hustle, rootScope, approvalDataRepository, orgUnitGroupSetRepository,
            orgUnitGroupSets, translationsService, orgUnitGroupHelper, projectController;

        var initialiseController = function () {
            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, orgUnitGroupHelper, approvalDataRepository, orgUnitGroupSetRepository, translationsService);
        };

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
            translationsService = new TranslationsService();

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
                "upsertOrgUnitDesc": "upsert org unit"
            };

            scope.startLoading = jasmine.createSpy('startLoading');
            scope.stopLoading = jasmine.createSpy('stopLoading');

            scope.locale = "en";

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

            orgUnitGroupSets = [{
                "name": "Mode Of Operation",
                "code": "mode_of_operation",
                "id": "a9ca3d1ed93",
                "organisationUnitGroups": [{
                    "id": "a560238bc90",
                    "englishName": "Direct operation",
                    "name": "Direct operation"
                }, {
                    "id": "a92cee050b0",
                    "name": "Remote operation",
                    "englishName": "Remote operation"
                }]
            }, {
                "name": "Model Of Management",
                "code": "model_of_management",
                "id": "a2d4a1dee27",
                "organisationUnitGroups": [{
                    "id": "a11a7a5d55a",
                    "name": "Collaboration",
                    "englishName": "Collaboration"
                }]
            }, {
                "name": "Reason For Intervention",
                "code": "reason_for_intervention",
                "id": "a86f66f29d4",
                "organisationUnitGroups": [{
                    "id": "a8014cfca5c",
                    "name": "Natural Disaster",
                    "englishName": "Natural Disaster"
                }]
            }, {
                "name": "Type of Population",
                "code": "type_of_population",
                "id": "a8a579d5fab",
                "organisationUnitGroups": [{
                    "id": "a35778ed565",
                    "name": "Most-at-risk Population",
                    "englishName": "Most-at-risk Population"
                }, {
                    "id": "a48f665185e",
                    "name": "Refugee",
                    "englishName": "Refugee"
                }]
            }, {
                "name": "Context",
                "code": "context",
                "id": "a5c18ef7277",
                "organisationUnitGroups": [{
                    "id": "a16b4a97ce4",
                    "name": "Post-conflict",
                    "englishName": "Post-conflict"
                }]
            }, {
                "name": "Project Type",
                "code": "project_type",
                "organisationUnitGroups": [{
                    "name": "Some Type",
                    "englishName": "Some Type"
                }]
            }];
            spyOn(orgUnitGroupSetRepository, "getAll").and.returnValue(utils.getPromise(q, orgUnitGroupSets));
            spyOn(translationsService, "translate").and.callFake(function(projectFields) {
                if(projectFields[0].name == "Post-conflict") {
                    return [{
                        "id": "a16b4a97ce4",
                        "name": "Post-conflict",
                        "englishName": "Post-conflict"
                    }];
                }
                if(projectFields[0].name == "Most-at-risk Population") {
                    return [{
                        "id": "a35778ed565",
                        "name": "Most-at-risk Population",
                        "englishName": "Most-at-risk Population"
                    }, {
                        "id": "a48f665185e",
                        "name": "Refugee",
                        "englishName": "Refugee"
                    }];
                }
                if(projectFields[0].name == "Natural Disaster") {
                    return [{
                        "id": "a8014cfca5c",
                        "name": "Natural Disaster",
                        "englishName": "Natural Disaster"
                    }];
                }
                if(projectFields[0].name == "Direct operation") {
                    return [{
                        "id": "a560238bc90",
                        "name": "Direct operation",
                        "englishName": "Direct operation"
                    }, {
                        "id": "a92cee050b0",
                        "name": "Remote operation",
                        "englishName": "Remote operation"
                    }];
                }
                if(projectFields[0].name == "Collaboration") {
                    return [{
                        "id": "a11a7a5d55a",
                        "name": "Collaboration",
                        "englishName": "Collaboration"
                    }];
                }
                if(projectFields[0].name == "Some Type") {
                    return [{
                        'name': 'Some Type',
                        "englishName": "Some Type"
                    }];
                }
            });

            spyOn(customAttributes, 'getAttributeValue').and.returnValue(undefined);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it('should get all organisationUnitGroupSets for the project and set them on scope', function () {
            var mockOrgUnitGroupSets = [{
                'name': 'Mode Of Operation',
                id: 'a9ca3d1ed93',
                attributeValues:[{
                    attribute:{
                        code: 'orgUnitGroupSetLevel',
                    },
                    value: 4
                }],
                organisationUnitGroups: [{
                    'id': 'a560238bc90',
                    'name': 'Direct operation'
                }, {
                    'id': 'a92cee050b0',
                    'name': 'Remote operation',
                }]
            },{
                name: 'someOtherOrgUnitGroup',
                attributeValues:[{
                    attribute:{
                        code: 'orgUnitGroupSetLevel',
                    },
                    value: 5
                }]
            }];
            orgUnitGroupSetRepository.getAll.and.returnValue(utils.getPromise(q, mockOrgUnitGroupSets));
            customAttributes.getAttributeValue.and.callFake(function (attributeValues, code) {
                return attributeValues[0].value;
            });
            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, orgUnitGroupHelper, approvalDataRepository, orgUnitGroupSetRepository, translationsService);

            scope.$apply();

            expect(orgUnitGroupSetRepository.getAll).toHaveBeenCalled();
            expect(scope.orgUnitGroupSets).toEqual([mockOrgUnitGroupSets[0]]);
        });

        describe('save', function () {
            var orgUnit, project, parent;
            beforeEach(function () {
                orgUnit = { id: 'orgUnitId' };
                project = {
                    id: 'projectId',
                    name: 'projectName'
                };
                parent = {id: 'parentID'};
                spyOn(orgUnitMapper, 'mapToProjectForDhis').and.returnValue(project);
                spyOn(orgUnitGroupHelper, 'associateOrgunitsToGroups').and.returnValue(utils.getPromise(q, {}));
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
                orgUnitMapper.mapToProjectForDhis.and.returnValue(project);
                initialiseController();
            });

            it('should get project to upsert DHIS', function () {
                scope.save(project, parent);
                scope.$apply();

                expect(orgUnitMapper.mapToProjectForDhis).toHaveBeenCalledWith(project, parent);
            });

            it('should save the project to DB', function () {
                scope.save(project, parent);
                scope.$apply();

                expect(orgUnitRepo.upsert).toHaveBeenCalledWith([project]);
            });

            it('should publish upsertOrgUnit hustle job', function () {
                var data = 'someData';

                orgUnitRepo.upsert.and.returnValue(utils.getPromise(q, data));

                scope.save(project, parent);
                scope.$apply();

                expect(hustle.publish).toHaveBeenCalledWith({
                    'data': data,
                    'type': 'upsertOrgUnit',
                    'locale': scope.locale,
                    'desc': scope.resourceBundle.upsertOrgUnitDesc
                }, 'dataValues');
            });

            it('should associate orgUnits to selected orgUnitgroups', function () {
                orgUnit = {
                    id: 'projectId',
                    orgUnitGroupSets: {
                        someGroupSetId: {
                            id: 'someOrgUnitGroupId',
                            name: 'someOrgUnitGroupName'
                        },
                        someOtherGroupSetId: {
                            id: 'someOtherOrgUnitGroupId',
                            name: 'someOtherOrgUnitGroupName'
                        }
                    }
                };

                scope.save(orgUnit, parent);
                scope.$apply();

                var localOrgUniGroupIds = ['someOrgUnitGroupId', 'someOtherOrgUnitGroupId'];
                var syncedOrgUnitGroupIds = [];
                var orgUnitsToAssociate = [project];
                expect(orgUnitGroupHelper.associateOrgunitsToGroups).toHaveBeenCalledWith(orgUnitsToAssociate, syncedOrgUnitGroupIds, localOrgUniGroupIds);
            });

            it('should display error if saving organization unit fails', function() {
                hustle.publish.and.returnValue(utils.getRejectedPromise(q, {}));
                scope.save({}, parent);
                scope.$apply();

                expect(scope.saveFailure).toEqual(true);
            });
        });

        it("should update project", function() {
            initialiseController();
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
                desc: "upsert org unit"
            }, "dataValues");
        });

        it("should display error if updating organization unit fails", function() {
            initialiseController();
            spyOn(hustle, "publish").and.returnValue(utils.getRejectedPromise(q, {}));
            spyOn(orgUnitMapper, "mapToExistingProject").and.returnValue([]);
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

            scope.update({}, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it("should reset form", function() {
            initialiseController();
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
                autoApprove: 'false',
                orgUnitGroupSets: {}
            });
            expect(scope.saveFailure).toEqual(false);
        });

        it("should open the opening date datepicker", function() {
            initialiseController();
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
            initialiseController();
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
            scope.newOrgUnit = {};
            scope.orgUnit = {
                "name": "anyname",
                "openingDate": "2010-01-01",
                'level': 4,
                "attributeValues": [],
                "organisationUnitGroups": [{
                    "id": "a16b4a97ce4",
                    "organisationUnitGroupSet": {
                        "id": "a5c18ef7277"
                    }
                }]
            };
            var mockGroupSet = [{
                id: "a5c18ef7277",
                organisationUnitGroups: [{
                    "id": "a16b4a97ce4",
                    name: "Post-conflict"
                }]
            }];

            var expectedNewOrgUnit = {
                'name': scope.orgUnit.name,
                'openingDate': moment("2010-01-01").toDate(),
                'orgUnitGroupSets':{
                    'a5c18ef7277': {
                        "id": "a16b4a97ce4",
                        "name": "Post-conflict"
                    }
                },
                'location': "val3",
                'endDate': moment("2011-01-01").toDate(),
                'projectCode': 'RU118',
                "estimatedTargetPopulation": 1000,
                "estPopulationLessThan1Year": 11,
                "estPopulationBetween1And5Years": 12,
                "estPopulationOfWomenOfChildBearingAge": 13,
                'autoApprove': 'true'
            };

            scope.isNewMode = false;
            scope.orgUnit.parent = {
                "id": "parentId"
            };
            customAttributes.getAttributeValue.and.callFake(function (attributeValues, code) {
                var fakeAttributeValues = {
                    prjEndDate: '2011-01-01',
                    autoApprove: 'true',
                    prjLoc: 'val3',
                    projCode: 'RU118',
                    estimatedTargetPopulation: '1000',
                    estPopulationLessThan1Year: '11',
                    estPopulationBetween1And5Years: '12',
                    estPopulationOfWomenOfChildBearingAge: '13',
                    groupSetLevel: 4
                };
                return fakeAttributeValues[code];
            });
            orgUnitGroupSetRepository.getAll.and.returnValue(utils.getPromise(q, mockGroupSet));
            initialiseController();
            scope.$apply();

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

        it("should get all existing project codes while preparing new form", function() {
            var project1 = {
                "id": "Kabul1",
                "name": "Kabul-AF101",
                "attributeValues": []
            };
            customAttributes.getAttributeValue.and.returnValue('AF101');

            orgUnitRepo.getAllProjects.and.returnValue(utils.getPromise(q, [project1]));

            initialiseController();
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

            initialiseController();
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

            initialiseController();
            scope.closeForm(parentOrgUnit);

            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(parentOrgUnit);
        });

        it("should update org unit groups on updating project", function() {
            initialiseController();
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
