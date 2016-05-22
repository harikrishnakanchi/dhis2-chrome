define(["userRepository", "angularMocks", "utils"], function(UserRepository, mocks, utils) {
    describe("user repository", function() {
        var repo, mockStore, mockDB, rootScope, users, projUser1, projUser2, project1, q, userRepo;


        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
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

            mockDB = utils.getMockDB(q, projUser1, users);
            mockStore = mockDB.objectStore;
            repo = new UserRepository(mockDB.db);
            rootScope = $rootScope;


            var superadmin = {
                "username": "superadmin",
                "password": "7536ad6ce98b48f23a1bf8f74f53da83",
                "userRoles": [{
                    "name": "Superadmin"
                }]
            };

            var otherUser = {
                "username": "project_user",
                "password": "caa63a86bbc63b2ae67ef0a069db7fb9",
                "userRoles": [{
                    "name": "Coordination Level Approver"
                }]
            };

            var projectadmin = {
                "username": "projectadmin",
                "password": "5f4dcc3b5aa765d61d8327deb882cf99",
                "userRoles": [{
                    "name": "Projectadmin"
                }]
            };

            var localUserCredentials = [superadmin, projectadmin, otherUser];
            mockDB = utils.getMockDB(q, superadmin, localUserCredentials);
            userRepo = new UserRepository(mockDB.db);

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


        it("should get user from users store", function() {
            var expected = {
                "userCredentials": {
                    "username": "proj_1_user1"
                },
                "organisationUnits": [{
                    'id': 'proj_1',
                    'name': 'Proj 1'
                }]
            };
           repo.getUser("proj_1_user1").then(function(user) {
               expect(user).toEqual(expected);
           });
            rootScope.$apply();
        });

        it("should get user credentials for superadmin from local user credentials store", function() {
            var expected = {
                "username": "superadmin",
                "password": "7536ad6ce98b48f23a1bf8f74f53da83",
                "userRoles": [{
                    "name": "Superadmin"
                }]
            };

            userRepo.getUserCredentials("superadmin").then(function(userCredentials){
               expect(userCredentials).toEqual(expected);
            });
        });
    });
});