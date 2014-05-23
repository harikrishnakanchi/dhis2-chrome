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

            var expectedUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "someone@example.com",
                }
            };

            spyOn(fakeUserStore, "upsert").and.returnValue(utils.getPromise(q, "someData"));

            userService.create(user).then(function(data) {
                expect(data).toEqual("someData");
                expect(fakeUserStore.upsert).toHaveBeenCalledWith(expectedUser);
            });

            httpBackend.expectPOST(properties.dhis.url + "/api/users", user).respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all project users", function() {
            var project1 = {
                'id': 'proj_1',
                'name': 'Project 1'
            };

            var projUser1 = {
                "userCredentials": {
                    "username": "proj_1_user1"
                },
                "organisationUnits": [{
                    'id': 'proj_1',
                    'name': 'Proj 1'
                }]
            };

            var projUser2 = {
                "userCredentials": {
                    "username": "proj_1_user2"
                },
                "organisationUnits": [{
                    'id': 'proj_1',
                    'name': 'Proj 1'
                }]
            };

            var users = [projUser1, projUser2, {
                "userCredentials": {
                    "username": "proj_2_user1"
                },
                "organisationUnits": [{
                    'id': 'proj_2',
                    'name': 'Proj 2'
                }]
            }, {
                "userCredentials": {
                    "username": "someone@example.com"
                },
                "organisationUnits": [{
                    'id': 'proj_3',
                    'name': 'Proj 3'
                }]
            }];

            spyOn(fakeUserStore, "getAll").and.returnValue(utils.getPromise(q, users));

            userService.getAllProjectUsers(project1).then(function(data) {
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

        it("should disable user", function() {
            var user = {
                "id": 1,
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "someone@example.com",
                    "password": "blah",
                    "disabled": true
                },
                "organisationUnits": []
            };
            var expectedUser = {
                "id": 1,
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "someone@example.com",
                    "password": "blah",
                    "disabled": false
                },
                "organisationUnits": []
            };
            var expectedPayload = {
                "userCredentials": expectedUser.userCredentials,
                "organisationUnits": expectedUser.organisationUnits,
            };

            spyOn(fakeUserStore, "find").and.returnValue(utils.getPromise(q, user));
            spyOn(fakeUserStore, "upsert").and.returnValue(utils.getPromise(q, "someData"));

            userService.toggleDisabledState(user, false).then(function(data) {
                expect(data).toEqual("someData");
                expect(fakeUserStore.upsert).toHaveBeenCalledWith(expectedUser);
            });

            httpBackend.expectPUT(properties.dhis.url + '/api/users/' + user.id, expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });
    });
});