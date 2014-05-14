define(["userService", "angularMocks", "properties", "utils"], function(UserService, mocks, properties, utils) {
    describe("user service", function() {
        var http, httpBackend, userService, db, fakeUserStore, fakeUserCredentialsStore, q, rootScope;

        beforeEach(mocks.inject(function($httpBackend, $http, $q, $rootScope) {
            http = $http;
            httpBackend = $httpBackend;
            q = $q;
            rootScope = $rootScope;

            fakeUserStore = {
                upsert: function() {},
                getAll: function() {}
            };

            db = {
                objectStore: function() {}
            };

            spyOn(db, "objectStore").and.returnValue(fakeUserStore);

            userService = new UserService(http, db);
        }));

        it("should create user", function() {
            var user = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "someone@example.com",
                    "password": "blah"
                }
            };

            var expectedUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "someone@example.com",
                }
            }

            spyOn(fakeUserStore, "upsert").and.returnValue(utils.getPromise(q, "someData"));

            userService.create(user).then(function(data) {
                expect(data).toEqual("someData");
                expect(fakeUserStore.upsert).toHaveBeenCalledWith(expectedUser);
            });

            httpBackend.expectPOST(properties.dhis.url + "/api/users", user).respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all project users", function() {
            var projUser1 = {
                "userCredentials": {
                    "username": "proj_1_user1"
                }
            };

            var projUser2 = {
                "userCredentials": {
                    "username": "proj_1_user2"
                }
            };

            var users = [projUser1, projUser2, {
                "userCredentials": {
                    "username": "proj_2_user1"
                }
            }, {
                "userCredentials": {
                    "username": "someone@example.com"
                }
            }]

            spyOn(fakeUserStore, "getAll").and.returnValue(utils.getPromise(q, users));

            userService.getAllProjectUsers("Proj 1").then(function(data) {
                expect(data.length).toEqual(2);
                expect(data[0]).toEqual(projUser1);
                expect(data[1]).toEqual(projUser2);
            });
            rootScope.$apply();
        });

        it("should get all usernames", function() {
            var users = [{
                "userCredentials": {
                    "username": "proj_2_user1"
                }
            }, {
                "userCredentials": {
                    "username": "someone@example.com"
                }
            }];
            spyOn(fakeUserStore, "getAll").and.returnValue(utils.getPromise(q, users));

            userService.getAllUsernames().then(function(usernames) {
                expect(usernames).toEqual(["proj_2_user1", "someone@example.com"]);
            });
            rootScope.$apply();
        });
    });
});