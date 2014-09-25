define(["projectController", "angularMocks", "utils", "lodash", "moment", "orgUnitMapper"], function(ProjectController, mocks, utils, _, moment, orgUnitMapper) {

    describe("project controller tests", function() {

        var scope, timeout, q, location, anchorScroll, userRepository,
            fakeModal, orgUnitRepo, hustle, rootScope;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout, $location) {
            scope = $rootScope.$new();
            rootScope = $rootScope;
            hustle = $hustle;
            q = $q;
            timeout = $timeout;
            location = $location;

            orgUnitRepo = utils.getMockRepo(q);

            userRepository = {
                "upsert": function() {
                    return utils.getPromise(q, [{}]);
                },
                "getAllProjectUsers": function() {
                    return utils.getPromise(q, [{}]);
                }
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
            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository);
        }));

        it("should save project in dhis", function(done) {
            var expectedNewOrgUnit = {
                "id": "blah"
            };
            spyOn(orgUnitMapper, "mapToProjectForDhis").and.returnValue(expectedNewOrgUnit);
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(location, 'hash');
            rootScope.$on('resetProjects', function() {
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

            scope.save({}, {});
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

            scope.update({}, {});
            scope.$apply();

            expect(orgUnitRepo.upsert).toHaveBeenCalledWith(expectedNewOrgUnit);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedNewOrgUnit,
                type: "upsertOrgUnit"
            }, "dataValues");

        });

        it("should display error if updating organization unit fails", function() {
            spyOn(hustle, "publish").and.returnValue(utils.getRejectedPromise(q, {}));

            scope.update(newOrgUnit, parent);
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
                openingDate: moment().format('YYYY-MM-DD'),
                autoApprove : 'false'
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
                'openingDate': moment("2010-01-01").format("YYYY-MM-DD"),
                'context': "val2",
                'location': "val3",
                'endDate': moment("2011-01-01").format("YYYY-MM-DD"),
                'populationType': "val6",
                'projectCode': 'RU118',
                'reasonForIntervention': 'Armed Conflict',
                'modeOfOperation': 'Direct Operation',
                'modelOfManagement': 'Collaboration',
                'autoApprove': 'true'
            };

            scope.isNewMode = false;

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository);

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

        it('should set project users in view mode', function() {
            scope.orgUnit = {
                "name": "anyname",
            };
            scope.isNewMode = false;
            var users = [{
                'userCredentials': {
                    'username': 'foobar',
                    'userAuthorityGroups': [{
                        "name": 'Role1',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Role2',
                        "id": 'Role2Id'
                    }]
                }
            }, {
                'userCredentials': {
                    'username': 'blah',
                    'userAuthorityGroups': [{
                        "name": 'Role1',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Role3',
                        "id": 'Role3Id'
                    }]
                }
            }];

            var expectedUsers = [{
                'roles': 'Role1, Role2',
                'userCredentials': {
                    'username': 'foobar',
                    'userAuthorityGroups': [{
                        "name": 'Role1',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Role2',
                        "id": 'Role2Id',
                    }]
                }
            }, {
                'roles': 'Role1, Role3',
                'userCredentials': {
                    'username': 'blah',
                    'userAuthorityGroups': [{
                        "name": 'Role1',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Role3',
                        "id": 'Role3Id'
                    }]
                }
            }];
            spyOn(userRepository, "getAllProjectUsers").and.returnValue(utils.getPromise(q, users));

            projectController = new ProjectController(scope, rootScope, hustle, orgUnitRepo, q, location, timeout, anchorScroll, userRepository);
            scope.$apply();

            expect(scope.projectUsers).toEqual(expectedUsers);
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

    });

});