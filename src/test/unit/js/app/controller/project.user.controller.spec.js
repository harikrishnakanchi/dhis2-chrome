define(["projectUserController", "angularMocks", "utils"], function(ProjectUserController, mocks, utils) {

    describe("projectUserControllerspec", function() {
        var scope, projectUserController, userService, q;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope;
            q = $q;
            userService = {
                'create': function() {},
                'getAllProjectUsers': function() {},
                'getAllUsernames': function() {}
            };

            spyOn(userService, "getAllUsernames").and.returnValue(utils.getPromise(q, []));
            projectUserController = new ProjectUserController(scope, userService);
        }));

        it("should create user", function() {
            var user = {
                username: "proj_1_username1",
                password: "P@ssw0rd",
                userRole: {
                    name: 'SomeRole',
                    id: 'someId'
                }
            };
            var expectedUserPayload = {
                "username": user.username,
                "surname": "LNU",
                "firstName": "FNU",
                "userCredentials": {
                    "username": user.username,
                    "userAuthorityGroups": [{
                        "name": user.userRole.name,
                        "id": user.userRole.id
                    }],
                    "password": user.password,
                }
            };
            spyOn(userService, "create").and.returnValue(utils.getPromise(q, {}));

            scope.save(user);
            scope.$apply();

            expect(userService.create).toHaveBeenCalledWith(expectedUserPayload);
            expect(scope.saveSuccess).toEqual(true);
            expect(scope.saveFailure).toEqual(false);
        });
    });
});