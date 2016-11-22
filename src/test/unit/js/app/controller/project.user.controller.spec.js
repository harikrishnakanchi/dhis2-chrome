define(["projectUserController", "angularMocks", "utils", "dhisId"], function(ProjectUserController, mocks, utils, dhisId) {
    describe("projectUserControllerspec", function() {
        var scope, projectUserController, q, userRepository, hustle, fakeModal, timeout;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;
            timeout = $timeout;

            scope.orgUnit = {
                "name": "Proj 1",
                "id": "someId",
                "attributeValues": [{
                    "attribute": {
                        "code": "projCode"
                    },
                    "value": "PRJ"
                }, {
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Project"
                }]
            };

            scope.locale = "en";

            scope.resourceBundle = {
                "createUserDesc": "create user",
                "updateUserDesc": "update user",
                "usernamePrefixValidation": "Username should begin with"
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

            userRepository = utils.getMockRepo(q);
            userRepository.getAllUsernames = function() {};
            userRepository.getAllProjectUsers = function() {};

            spyOn(userRepository, "getAllUsernames").and.returnValue(utils.getPromise(q, {}));
            spyOn(userRepository, "getAllProjectUsers").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            projectUserController = new ProjectUserController(scope, hustle, timeout, fakeModal, userRepository);
        }));

        it("should create user", function() {
            var user = {
                username: "ProJ_1_Blah",
                password: "P@ssw0rd",
                userRole: {
                    name: 'SomeRole'
                }
            };
            var expectedUserPayload = {
                "username": "proj_1_blah",
                "id": 'ProJ_1_Blah',
                "surname": "LNU",
                "firstName": "FNU",
                "userCredentials": {
                    "username": "proj_1_blah",
                    "userRoles": [{
                        "name": user.userRole.name
                    }],
                    "password": "msfuser",
                },
                "organisationUnits": [{
                    "id": scope.orgUnit.id,
                    "name": scope.orgUnit.name
                }],
                "dataViewOrganisationUnits": [{
                    "id": scope.orgUnit.id,
                    "name": scope.orgUnit.name
                }]
            };

            var payload = {
                data: expectedUserPayload,
                type: "createUser",
                locale: "en",
                desc: "create user"
            };

            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });

            scope.save(user);
            scope.$apply();

            expect(userRepository.upsert).toHaveBeenCalledWith(expectedUserPayload);
            expect(hustle.publish).toHaveBeenCalledWith(payload, "dataValues");
            expect(scope.saveFailure).toEqual(false);
        });

        it("should take the user to the view page of the project on clicking cancel", function() {
            scope.orgUnit = {
                "id": "parent",
                "name": "parent"
            };

            scope.$parent = {
                "closeNewForm": function() {}
            };

            spyOn(scope.$parent, "closeNewForm").and.callFake(function(parentOrgUnit) {
                return;
            });

            scope.closeForm();

            expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(scope.orgUnit);
        });

        it('should set users for selected orgunit in view mode', function() {
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
            }];

            userRepository.getAllProjectUsers.and.returnValue(utils.getPromise(q, users));

            scope.$apply();

            expect(scope.orgUnitUsers).toEqual(expectedUsers);
        });

        it("should not toggle user's disabled state if confirmation cancelled", function() {
            spyOn(fakeModal, 'open').and.returnValue({
                result: utils.getRejectedPromise(q, {})
            });

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

            var user = {
                id: '123',
                name: "blah blah",
                userCredentials: {
                    disabled: false,
                    username: "blah blah"
                }
            };

            var expectedUser = {
                id: '123',
                name: "blah blah",
                userCredentials: {
                    disabled: true,
                    username: "blah blah"
                }
            };

            var expectedMessage = {
                data: user,
                type: 'updateUser',
                locale: 'en',
                desc: 'update user'
            };

            scope.toggleUserDisabledState(user);
            scope.$apply();

            expect(scope.userStateSuccessfullyToggled).toBe(true);
            expect(userRepository.upsert).toHaveBeenCalledWith(expectedUser);
            expect(hustle.publish).toHaveBeenCalledWith(expectedMessage, "dataValues");
        });
    });
});
