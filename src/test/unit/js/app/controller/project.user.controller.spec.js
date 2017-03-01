define(["projectUserController", "angularMocks", "utils", "dhisId", "customAttributes", "userRepository"],
    function(ProjectUserController, mocks, utils, dhisId, customAttributes, UserRepository) {
    describe("projectUserControllerspec", function() {
        var scope, projectUserController, q, userRepository, hustle, fakeModal, timeout, userRoles;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle, $timeout) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;
            timeout = $timeout;

            scope.orgUnit = {
                "name": "Proj 1",
                "id": "someId",
                "attributeValues": []
            };

            scope.locale = "en";

            scope.resourceBundle = {
                "createUserDesc": "create user",
                "updateUserDesc": "update user",
                "usernamePrefixValidation": "Username should begin with",
                "emailValidation": "Should be an email address.",
                "defaultValidation": "Enter a value between 2 and 140 characters long."
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

            userRoles = [
                {
                    "name": 'Data entry user',
                    "id": 'Role1Id'
                }, {
                    "name": 'Project Level Approver',
                    "id": 'Role2Id'
                }, {
                    "name": 'Observer',
                    "id": 'Role3Id'
                }
            ];

            userRepository = new UserRepository();

            spyOn(userRepository, "getAllUsernames").and.returnValue(utils.getPromise(q, {}));
            spyOn(userRepository, "getAllProjectUsers").and.returnValue(utils.getPromise(q, {}));
            spyOn(userRepository, "getUserRoles").and.returnValue(utils.getPromise(q, userRoles));
            spyOn(userRepository, "upsert").and.callFake(function (data) {
                return utils.getPromise(q, data);
            });
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            spyOn(customAttributes, "getAttributeValue").and.callFake(function (attributeValues, code) {
                var fakeAttributeValues = {
                    Type: 'Project',
                    projCode: 'PRJ'
                };
                return fakeAttributeValues[code];
            });
            projectUserController = new ProjectUserController(scope, hustle, timeout, fakeModal, userRepository);
        }));

        it("should create user", function() {
            var user = {
                username: "ProJ_1_Blah",
                password: "P@ssw0rd",
                userRole: {
                    name: 'SomeRole',
                    id: 'roleId'
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
                        "name": user.userRole.name,
                        "id": "roleId"
                    }],
                    userInfo: {
                       id: 'ProJ_1_Blah'
                    },
                    "password": "msfuser"
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

        it('should get user roles with id and set it to scope', function () {
            scope.$apply();
            expect(userRepository.getUserRoles).toHaveBeenCalled();
            expect(_.map(scope.userRoles, 'id')).toEqual(["Role1Id", "Role2Id", "Role3Id"]);
        });

        describe('NameValidations', function () {
            it('should not validate the name if project user is not selected', function () {
                scope.projectUser = {};

                scope.setNameValidations();

                expect(scope.userNameMatchExpr).toEqual(new RegExp('', 'i'));
                expect(scope.patternValidationMessage).toEqual('');
                expect(scope.userNamePlaceHolder).toEqual('');
            });

            it('should validate the name only if it is starts with project code', function () {
                scope.projectUser.userRole = {
                    validationType: 'PROJECT_CODE_PREFIX'
                };

                scope.setNameValidations();

                expect(scope.userNameMatchExpr).toEqual(new RegExp('prj_.+', 'i'));
                expect(scope.patternValidationMessage).toEqual(scope.resourceBundle.usernamePrefixValidation);
                expect(scope.userNamePlaceHolder).toEqual(scope.resourceBundle.usernamePrefixValidation);
            });

            it('should validate the name only if it is an email', function () {
                scope.projectUser.userRole = {
                    validationType: 'EMAIL'
                };

                scope.setNameValidations();

                expect(scope.userNameMatchExpr).toEqual(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}$/i);
                expect(scope.patternValidationMessage).toEqual(scope.resourceBundle.emailValidation);
                expect(scope.userNamePlaceHolder).toEqual(scope.resourceBundle.emailValidation);
            });

            it('should validate the name with DHIS defaults if validation is not specified', function () {
                scope.projectUser.userRole = {
                    validationType: 'someThingElse'
                };

                scope.setNameValidations();

                expect(scope.userNameMatchExpr).toEqual(/^.{2,140}$/i);
                expect(scope.patternValidationMessage).toEqual(scope.resourceBundle.defaultValidation);
                expect(scope.userNamePlaceHolder).toEqual(scope.resourceBundle.defaultValidation);
            });
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
                        "name": 'Data entry user',
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
                        "name": 'Coordination Level Approver',
                        "id": 'Role3Id'
                    }]
                }
            }];

            var expectedUsers = [{
                'roles': 'Data entry user, Project Level Approver',
                'userCredentials': {
                    'username': 'foobar',
                    'userRoles': [{
                        "name": 'Data entry user',
                        "id": 'Role1Id'
                    }, {
                        "name": 'Project Level Approver',
                        "id": 'Role2Id'
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
