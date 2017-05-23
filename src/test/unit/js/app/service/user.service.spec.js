define(["userService", "angularMocks", "properties", "utils", "dhisUrl"], function(UserService, mocks, properties, utils, dhisUrl) {
    describe("user service", function() {
        var http, httpBackend, userService, db, fakeUserStore, fakeUserCredentialsStore, q, rootScope;

        beforeEach(mocks.inject(function($httpBackend, $http, $q, $rootScope) {
            http = $http;
            httpBackend = $httpBackend;
            q = $q;
            rootScope = $rootScope;

            fakeUserStore = {
                upsert: function() {},
                getAll: function() {},
                find: function() {}
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

            userService.create(user);

            var expectedPayload = {
                "users": [{
                    "firstName": "test1",
                    "lastName": "test1last",
                    "userCredentials": {
                        "username": "someone@example.com"
                    }
                }]
            };

            httpBackend.expectPOST(dhisUrl.metadata, expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

        it("should update user", function() {
            var user = {
                "id": 1,
                "firstName": "test1",
                "surname": "test1last",
                "userCredentials": {
                    "username": "someone@example.com",
                    "password": "blah",
                    "disabled": true
                },
                "organisationUnits": []
            };

            var expectedPayload = {
                "firstName": "test1",
                "surname": "test1last",
                "userCredentials": {
                    "username": "someone@example.com",
                    "disabled": true
                },
                "organisationUnits": user.organisationUnits,
            };

            userService.update(user);

            httpBackend.expectPUT(dhisUrl.users + '/' + user.id, expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });
    });
});
