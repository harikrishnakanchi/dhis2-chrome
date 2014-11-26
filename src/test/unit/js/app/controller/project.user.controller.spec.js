define(["projectUserController", "angularMocks", "utils"], function(ProjectUserController, mocks, utils) {

    describe("projectUserControllerspec", function() {
        var scope, projectUserController, q, userRepository, hustle;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;

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
            userRepository = utils.getMockRepo(q);
            userRepository.getAllUsernames = function() {};

            spyOn(userRepository, "getAllUsernames").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));
            projectUserController = new ProjectUserController(scope, hustle, userRepository);
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
                "id": 'a8521092d46',
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
                type: "createUser"
            };

            scope.save(user);
            scope.$apply();

            expect(userRepository.upsert).toHaveBeenCalledWith(expectedUserPayload);
            expect(hustle.publish).toHaveBeenCalledWith(payload, "dataValues");
            expect(scope.saveFailure).toEqual(false);
        });

        it("should determine username prefix and return validate username", function() {
            var specifiedUserName = "prj_afdssd";

            expect(scope.userNamePrefix).toEqual("prj_");
            expect(scope.userNameMatchExpr.test(specifiedUserName)).toEqual(true);
        });

        it("should reset form", function() {
            scope.projectUser = {
                "name": "blah",
                "id": "blah",
                "lastname": "blah",
            };

            scope.reset();

            expect(scope.projectUser).toEqual({});
        });
    });
});