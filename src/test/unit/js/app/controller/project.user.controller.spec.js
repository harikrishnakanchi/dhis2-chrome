define(["projectUserController", "angularMocks", "utils"], function(ProjectUserController, mocks, utils) {

    describe("projectUserControllerspec", function() {
        var scope, projectUserController, userService, q;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;
            userService = {
                'create': function() {},
                'getAllProjectUsers': function() {},
                'getAllUsernames': function() {}
            };

            scope.orgUnit = {
                "name": "Proj 1",
                "id": "someId",
                "attributeValues": [{
                    "attribute": {
                        "code": "projCode",
                        "name": "Project Code",
                        "id": "fa5e00d5cd2"
                    },
                    "value": "PRJ"
                }]
            };

            spyOn(userService, "getAllUsernames").and.returnValue(utils.getPromise(q, []));
            projectUserController = new ProjectUserController(scope, userService);
        }));

        it("should create user", function() {
            var user = {
                username: "ProJ_1_Blah",
                password: "P@ssw0rd",
                userRole: {
                    name: 'SomeRole',
                    id: 'someId'
                }
            };
            var expectedUserPayload = {
                "username": "proj_1_blah",
                "surname": "LNU",
                "firstName": "FNU",
                "userCredentials": {
                    "username": "proj_1_blah",
                    "userAuthorityGroups": [{
                        "name": user.userRole.name,
                        "id": user.userRole.id
                    }],
                    "password": "msfuser",
                },
                "organisationUnits": [{
                    "id": scope.orgUnit.id,
                    "name": scope.orgUnit.name
                }]
            };
            spyOn(userService, "create").and.returnValue(utils.getPromise(q, {}));

            scope.save(user);
            scope.$apply();

            expect(userService.create).toHaveBeenCalledWith(expectedUserPayload);
            expect(scope.saveFailure).toEqual(false);
        });

        it("should determine username prefix and return validate username", function() {
            var specifiedUserName = "prj_afdssd";

            projectUserController = new ProjectUserController(scope, userService);

            expect(scope.userNamePrefix).toEqual("prj_");
            expect(scope.userNameMatchExpr.test(specifiedUserName)).toEqual(true);
        });

        it("should reset form", function() {
            scope.projectUser = {
                "name": "blah",
                "id": "blah",
                "lastname": "blah",
            }

            scope.reset();

            expect(scope.projectUser).toEqual({});
        });
    });
});