define(["userRepository", "angularMocks", "utils"], function(UserRepository, mocks, utils) {
    describe("user repository", function() {
        var repo, mockStore, mockDB, rootScope, users, projUser1, projUser2, project1;

        beforeEach(mocks.inject(function($q, $rootScope) {
            project1 = {
                'id': 'proj_1',
                'name': 'Project 1'
            };

            projUser1 = {
                "userCredentials": {
                    "username": "proj_1_user1"
                },
                "organisationUnits": [{
                    'id': 'proj_1',
                    'name': 'Proj 1'
                }]
            };

            projUser2 = {
                "userCredentials": {
                    "username": "proj_1_user2"
                },
                "organisationUnits": [{
                    'id': 'proj_1',
                    'name': 'Proj 1'
                }]
            };

            users = [projUser1, projUser2, {
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

            mockDB = utils.getMockDB($q, projUser1, users);
            mockStore = mockDB.objectStore;
            repo = new UserRepository(mockDB.db);
            rootScope = $rootScope;
        }));

        it("should upsert new users", function() {
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

            repo.upsert(user);
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUser);
        });

        it("should get all project users", function() {
            repo.getAllProjectUsers(project1).then(function(data) {
                expect(data.length).toEqual(2);
                expect(data[0]).toEqual(projUser1);
                expect(data[1]).toEqual(projUser2);
            });

            rootScope.$apply();
        });

        it("should get all usernames", function() {
            repo.getAllUsernames().then(function(usernames) {
                expect(usernames).toEqual(['proj_1_user1', 'proj_1_user2', 'proj_2_user1', 'someone@example.com']);
            });
            rootScope.$apply();
        });


    });
});