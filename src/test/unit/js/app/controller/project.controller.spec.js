define(["projectController", "angularMocks", "utils", "lodash", "moment"], function(ProjectController, mocks, utils, _, moment) {

    describe("project controller tests", function() {

        var scope, timeout, q, location, orgUnitService, anchorScroll, orgunitMapper, userService,
            fakeModal, orgUnitRepo, hustle;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout, $location) {
            scope = $rootScope.$new();
            hustle = $hustle;
            q = $q;
            timeout = $timeout;
            location = $location;

            orgUnitMapper = {
                getChildOrgUnitNames: function() {}
            };

            orgUnitService = {
                "create": function() {},
                "getAll": function() {
                    return utils.getPromise(q, {});
                }
            };
            orgUnitRepo = jasmine.createSpyObj({}, ['save']);

            userService = {
                "getAllProjectUsers": function() {
                    return utils.getPromise(q, [{}]);
                },
                "toggleDisabledState": function() {
                    return utils.getPromise(q, "");
                }
            };

            scope.isEditMode = true;
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
            projectController = new ProjectController(scope, hustle, orgUnitService, orgUnitRepo, q, location, timeout, anchorScroll, userService);
        }));

        it("should save project in dhis", function() {
            var orgUnitId = '1ef081fea77';

            var newOrgUnit = {
                'name': 'Org1',
                'location': 'Some Location',
                'openingDate': moment().toDate(),
                'endDate': moment().add('days', 7).toDate(),
                'projectCode': 'AB001',
                'event': 'Other'
            };

            var parent = {
                'name': 'Name1',
                'id': 'Id1',
                'level': 2,
            };

            spyOn(orgUnitService, 'create').and.returnValue(utils.getPromise(q, orgUnitId));
            spyOn(location, 'hash');

            scope.save(newOrgUnit, parent);
            scope.$apply();

            var expectedNewOrgUnit = [{
                id: orgUnitId,
                name: newOrgUnit.name,
                shortName: newOrgUnit.name,
                level: 3,
                openingDate: moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                parent: {
                    id: parent.id,
                    name: parent.name,
                },
                "attributeValues": [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Project"
                }, {
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": newOrgUnit.context
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location",
                        "id": "CaQPMk01JB8"
                    },
                    "value": newOrgUnit.location
                }, {
                    "attribute": {
                        "code": "prjType",
                        "name": "Type of project",
                        "id": "bnbnSvRdFYo"
                    },
                    "value": newOrgUnit.projectType
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": newOrgUnit.populationType
                }, {
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code",
                        "id": "fa5e00d5cd2"
                    },
                    "value": newOrgUnit.projectCode
                }, {
                    "attribute": {
                        "code": "event",
                        "name": "Event",
                        "id": "a4ecfc70574"
                    },
                    "value": newOrgUnit.event
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": moment(newOrgUnit.endDate).format("YYYY-MM-DD")
                }],
            }];

            expect(orgUnitService.create).toHaveBeenCalledWith(expectedNewOrgUnit);
        });

        it("should display error if saving organization unit fails", function() {
            var newOrgUnit = {};

            spyOn(orgUnitService, 'create').and.returnValue(utils.getRejectedPromise(q, {}));

            scope.save(newOrgUnit, parent);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it("should reset form", function() {
            scope.newOrgUnit = {
                'id': '123',
                'openingDate': moment().add('days', -7).toDate(),
                'endDate': moment().add('days', 7).toDate(),
            };
            scope.saveFailure = true;

            scope.reset();
            scope.$apply();

            expect(scope.newOrgUnit).toEqual({
                openingDate: moment().format('YYYY-MM-DD'),
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
                        "code": "prjType",
                        "name": "Type of project",
                        "id": "bnbnSvRdFYo"
                    },
                    "value": "val4"
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
                        "code": "event",
                        "name": "Event",
                        "id": "a4ecfc70574"
                    },
                    "value": "Armed Conflict: disruption of health systems due to conflict"
                }, {
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code",
                        "id": "fa5e00d5cd2"
                    },
                    "value": "RU118"
                }]
            };
            var expectedNewOrgUnit = {
                'name': scope.orgUnit.name,
                'openingDate': moment("2010-01-01").format("YYYY-MM-DD"),
                'context': "val2",
                'location': "val3",
                'projectType': "val4",
                'endDate': moment("2011-01-01").format("YYYY-MM-DD"),
                'populationType': "val6",
                'event': 'Armed Conflict: disruption of health systems due to conflict',
                'projectCode': 'RU118'
            };

            scope.isEditMode = false;

            projectController = new ProjectController(scope, hustle, orgUnitService, orgUnitRepo, q, location, timeout, anchorScroll, userService);

            expect(scope.newOrgUnit).toEqual(expectedNewOrgUnit);
        });

        it('should set project users in view mode', function() {
            scope.orgUnit = {
                "name": "anyname",
            };
            scope.isEditMode = false;
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
            spyOn(userService, "getAllProjectUsers").and.returnValue(utils.getPromise(q, users));

            projectController = new ProjectController(scope, hustle, orgUnitService, orgUnitRepo, q, location, timeout, anchorScroll, userService);
            scope.$apply();

            expect(scope.projectUsers).toEqual(expectedUsers);
        });

        it("should set user project as currently selected project", function() {
            scope.orgUnit = {
                "name": "anyname",
            };
            scope.currentUser = {
                'id': 'admin'
            };
            scope.setUserProject();

            expect(scope.currentUser.organisationUnits[0]).toEqual(scope.orgUnit);
        });

        it("should not toggle user's disabled state if confirmation cancelled", function() {
            spyOn(fakeModal, 'open').and.returnValue({
                result: utils.getRejectedPromise(q, {})
            });
            projectController = new ProjectController(scope, hustle, orgUnitService, orgUnitRepo, q, location, timeout, anchorScroll, userService, fakeModal);
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
            spyOn(userService, 'toggleDisabledState').and.returnValue(utils.getPromise(q, {}));

            projectController = new ProjectController(scope, hustle, orgUnitService, orgUnitRepo, q, location, timeout, anchorScroll, userService, fakeModal);
            var user = {
                id: '123',
                name: "blah blah",
                userCredentials: {
                    disabled: false
                }
            };
            scope.toggleUserDisabledState(user, true);
            scope.$apply();

            expect(scope.userStateSuccessfullyToggled).toBe(true);
        });

    });

});