define(["projectController", "angularMocks", "utils", "lodash", "moment", "orgUnitMapper", "timecop", "orgUnitGroupHelper", "properties", "approvalDataRepository"], function(ProjectController, mocks, utils, _, moment, orgUnitMapper, timecop, OrgUnitGroupHelper, properties, ApprovalDataRepository) {
    describe("project controller tests", function() {
        var scope, timeout, q, location, anchorScroll, userRepository, parent,
            fakeModal, orgUnitRepo, hustle, rootScope, patientOriginRepository, approvalDataRepository;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout, $location) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            hustle = $hustle;
            q = $q;
            timeout = $timeout;
            location = $location;
            orgUnitGroupHelper = new OrgUnitGroupHelper();

            orgUnitRepo = utils.getMockRepo(q);

            approvalDataRepository = new ApprovalDataRepository();

            userRepository = {
                "upsert": function() {
                    return utils.getPromise(q, [{}]);
                },
                "getAllProjectUsers": function() {
                    return utils.getPromise(q, [{}]);
                }
            };

            patientOriginRepository = {
                "get": function() {
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

            fakeModal = {
                close: function() {
                    this.result.confirmCallBack();
                },
                dismiss: function(type) {
                    this.result.cancelCallback(type);
                },
                open: function(object) {}
            };

            anchorScroll = jasmine.createSpy();

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository, fakeModal, orgUnitGroupHelper, patientOriginRepository, approvalDataRepository);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should save project in dhis", function(done) {
            var newOrgUnit = {};
            var expectedNewOrgUnit = {
                "id": "blah"
            };
            spyOn(orgUnitMapper, "mapToProjectForDhis").and.returnValue(expectedNewOrgUnit);
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(location, 'hash');
            rootScope.$on('resetProjects', function() {
                expect(orgUnitMapper.mapToProjectForDhis).toHaveBeenCalledWith(newOrgUnit, parent);
                expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedNewOrgUnit);
                expect(hustle.publish).toHaveBeenCalledWith({
                    data: expectedNewOrgUnit,
                    type: "upsertOrgUnit"
                }, "dataValues");

                done();
            });
            scope.save(newOrgUnit, parent);
            scope.$apply();
            rootScope.$apply();
        });

        it("should display error if saving organization unit fails", function() {
            spyOn(hustle, "publish").and.returnValue(utils.getRejectedPromise(q, {}));

            scope.save({}, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it("should update project", function() {
            var expectedNewOrgUnit = {
                "id": "blah"
            };

            spyOn(orgUnitMapper, "mapToExistingProject").and.returnValue(expectedNewOrgUnit);
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(location, 'hash');
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));

            scope.update({}, {});
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedNewOrgUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedNewOrgUnit,
                type: "upsertOrgUnit"
            }, "dataValues");
        });

        it("should approve existing data for project if autoApprove is set to true", function() {
            var orgUnit = {
                "id": "blah"
            };
            var newOrgUnit = {
                "id": "blah",
                "autoApprove": true
            };

            var modules = [{
                "id": "mod1",
                "name": "mod1"
            }, {
                "id": "mod2",
                "name": "mod2"
            }, {
                "id": "mod3",
                "name": "mod3"
            }];

            var expectedPeriodAndOrgUnits = [{
                "period": '2014W22',
                "orgUnit": 'mod1'
            }, {
                "period": '2014W21',
                "orgUnit": 'mod1'
            }, {
                "period": '2014W20',
                "orgUnit": 'mod1'
            }, {
                "period": '2014W19',
                "orgUnit": 'mod1'
            }, {
                "period": '2014W18',
                "orgUnit": 'mod1'
            }, {
                "period": '2014W17',
                "orgUnit": 'mod1'
            }, {
                "period": '2014W16',
                "orgUnit": 'mod1'
            }, {
                "period": '2014W15',
                "orgUnit": 'mod1'
            }, {
                "period": '2014W22',
                "orgUnit": 'mod2'
            }, {
                "period": '2014W21',
                "orgUnit": 'mod2'
            }, {
                "period": '2014W20',
                "orgUnit": 'mod2'
            }, {
                "period": '2014W19',
                "orgUnit": 'mod2'
            }, {
                "period": '2014W18',
                "orgUnit": 'mod2'
            }, {
                "period": '2014W17',
                "orgUnit": 'mod2'
            }, {
                "period": '2014W16',
                "orgUnit": 'mod2'
            }, {
                "period": '2014W15',
                "orgUnit": 'mod2'
            }, {
                "period": '2014W22',
                "orgUnit": 'mod3'
            }, {
                "period": '2014W21',
                "orgUnit": 'mod3'
            }, {
                "period": '2014W20',
                "orgUnit": 'mod3'
            }, {
                "period": '2014W19',
                "orgUnit": 'mod3'
            }, {
                "period": '2014W18',
                "orgUnit": 'mod3'
            }, {
                "period": '2014W17',
                "orgUnit": 'mod3'
            }, {
                "period": '2014W16',
                "orgUnit": 'mod3'
            }, {
                "period": '2014W15',
                "orgUnit": 'mod3'
            }];

            spyOn(approvalDataRepository, "markAsApproved").and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitMapper, "mapToExistingProject").and.returnValue(newOrgUnit);
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(location, 'hash');
            spyOn(orgUnitGroupHelper, "createOrgUnitGroups").and.returnValue(utils.getPromise(q, {}));
            orgUnitRepo.getAllModulesInOrgUnitsExceptCurrentModules = jasmine.createSpy("getAllModulesInOrgUnitsExceptCurrentModules").and.returnValue(utils.getPromise(q, modules));

            scope.update(newOrgUnit, orgUnit);
            scope.$apply();

            expect(approvalDataRepository.markAsApproved).toHaveBeenCalledWith(expectedPeriodAndOrgUnits, "admin");
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": expectedPeriodAndOrgUnits,
                "type": "uploadCompletionData"
            }, "dataValues");
            expect(hustle.publish).toHaveBeenCalledWith({
                "data": expectedPeriodAndOrgUnits,
                "type": "uploadApprovalData"
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
                    "value": "val2"
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
                    "value": "val6"
                }, {
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code",
                        "id": "fa5e00d5cd2"
                    },
                    "value": "RU118"
                }, {
                    attribute: {
                        code: 'reasonForIntervention',
                        name: 'Reason For Intervention',
                        id: 'e7af7f29053'
                    },
                    value: 'Armed Conflict'
                }, {
                    attribute: {
                        code: 'modeOfOperation',
                        name: 'Mode Of Operation',
                        id: 'a048b89d331'
                    },
                    value: 'Direct Operation'
                }, {
                    attribute: {
                        code: 'modelOfManagement',
                        name: 'Model Of Management',
                        id: 'd2c3e7993f6'
                    },
                    value: 'Collaboration'
                }, {
                    'attribute': {
                        'code': 'autoApprove',
                        'name': 'Auto Approve',
                        'id': 'e65afaec61d'
                    },
                    'value': 'true'
                }]
            };
            var expectedNewOrgUnit = {
                'name': scope.orgUnit.name,
                'openingDate': moment("2010-01-01").toDate(),
                'context': "val2",
                'location': "val3",
                'endDate': moment("2011-01-01").toDate(),
                'populationType': "val6",
                'projectCode': 'RU118',
                'reasonForIntervention': 'Armed Conflict',
                'modeOfOperation': 'Direct Operation',
                'modelOfManagement': 'Collaboration',
                'autoApprove': 'true'
            };

            scope.isNewMode = false;

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository, fakeModal, orgUnitGroupHelper, patientOriginRepository);

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

        it('should set project users and origin details in view mode', function() {
            scope.orgUnit = {
                "name": "anyname",
                "parent": {
                    "id": "someId"
                }
            };
            scope.isNewMode = false;
            var users = [{
                'userCredentials': {
                    'username': 'foobar',
                    'userRoles': [{
                        "name": 'Data Entry User',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Project Level Approver',
                        "id": 'Role2Id'
                    }]
                }
            }, {
                'userCredentials': {
                    'username': 'blah',
                    'userRoles': [{
                        "name": 'Data Entry User',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Coordination Level Approver',
                        "id": 'Role3Id'
                    }]
                }
            }];

            var patientOrigins = {
                "orgUnit": "projid",
                "origins": [{
                    "originName": "test",
                    "latitude": 78,
                    "longitude": 80
                }]
            };

            var expectedUsers = [{
                'roles': 'Data Entry User, Project Level Approver',
                'userCredentials': {
                    'username': 'foobar',
                    'userRoles': [{
                        "name": 'Data Entry User',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Project Level Approver',
                        "id": 'Role2Id',
                    }]
                }
            }, {
                'roles': 'Data Entry User, Coordination Level Approver',
                'userCredentials': {
                    'username': 'blah',
                    'userRoles': [{
                        "name": 'Data Entry User',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Coordination Level Approver',
                        "id": 'Role3Id'
                    }]
                }
            }];
            spyOn(userRepository, "getAllProjectUsers").and.returnValue(utils.getPromise(q, users));
            spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, patientOrigins));

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository, fakeModal, orgUnitGroupHelper, patientOriginRepository);
            scope.$apply();

            expect(scope.projectUsers).toEqual(expectedUsers);
            expect(scope.originDetails).toEqual(patientOrigins.origins);
        });

        it("should set user project as currently selected project", function() {
            scope.orgUnit = {
                "name": "anyname",
            };
            scope.currentUser = {
                "id": "msfadmin"
            };
            scope.setUserProject();

            expect(scope.currentUser.organisationUnits[0]).toEqual(scope.orgUnit);
        });

        it("should not toggle user's disabled state if confirmation cancelled", function() {
            spyOn(fakeModal, 'open').and.returnValue({
                result: utils.getRejectedPromise(q, {})
            });
            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository, fakeModal);
            var user = {
                id: '123',
                name: "blah blah",
                userCredentials: {
                    disabled: false
                }
            };
            scope.toggleUserDisabledState(user, true);
            scope.$apply();

            expect(scope.userStateSuccessfullyToggled).toBe(false);
        });

        it("should toggle user's disabled state if confirmed", function() {
            spyOn(fakeModal, 'open').and.returnValue({
                result: utils.getPromise(q, {})
            });

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository, fakeModal);

            var user = {
                id: '123',
                name: "blah blah",
                userCredentials: {
                    disabled: false
                }
            };

            var expectedUser = {
                id: '123',
                name: "blah blah",
                userCredentials: {
                    disabled: true
                }
            };

            var expectedMessage = {
                data: user,
                type: 'updateUser'
            };
            spyOn(userRepository, "upsert").and.returnValue(utils.getPromise(q, user));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            scope.toggleUserDisabledState(user);
            scope.$apply();

            expect(scope.userStateSuccessfullyToggled).toBe(true);
            expect(userRepository.upsert).toHaveBeenCalledWith(expectedUser);
            expect(hustle.publish).toHaveBeenCalledWith(expectedMessage, "dataValues");
        });

        it("should get all existing project codes while preparing new form", function() {
            var country1 = {
                "id": "Af1",
                "name": "Afghanistan",
                "attributeValues": [{
                    "attribute": {
                        "code": "projCode"
                    },
                    "value": ""
                }]
            };

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

            var module1 = {
                "id": "module1",
                "name": "Mod1"
            };

            var allOrgUnits = [country1, project1, module1];
            orgUnitRepo = utils.getMockRepo(q, allOrgUnits);

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository, fakeModal, orgUnitGroupHelper, patientOriginRepository);
            scope.$apply();

            expect(scope.existingProjectCodes).toEqual(["AF101"]);
        });

        it("should take the user to the view page of the parent country on clicking cancel", function(){
            var parentOrgUnit = {
                'id' : 'parent',
                'name': 'parent'
            };

            scope.$parent = {
                "closeNewForm" : function() {}
            };

            spyOn(scope.$parent,"closeNewForm").and.callFake(function(parentOrgUnit){
                return;
            });

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository, fakeModal, orgUnitGroupHelper, patientOriginRepository);

            scope.closeForm(parentOrgUnit);

            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(parentOrgUnit);
        });
    });

});
