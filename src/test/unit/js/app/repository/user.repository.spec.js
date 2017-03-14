define(["userRepository", "angularMocks", "utils", "properties", "platformUtils"], function(UserRepository, mocks, utils, properties, platformUtils) {
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

        it('should get specified userRoles by role name', function () {
            var roles = ['someRole'];
            var userRolesFromDb = [{
                id: 'someId',
                name: 'someRole'
            },{
                id: 'someOtherId',
                name: 'someOtherRole'
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, userRolesFromDb));

            repo.getUserRoles(roles).then(function (roles) {
                expect(roles).toEqual([userRolesFromDb[0]]);
            });
            rootScope.$apply();
        });

        describe('userCredentials', function () {
            var userRepository;

            beforeEach(function () {
                platformUtils.platform = 'pwa';
                userRepository = new UserRepository();
            });

            it("should get user credentials for superadmin", function() {
                var expectedCredentials = {
                    username: 'superadmin',
                    password: properties.organisationSettings.userCredentials.pwa.superadmin
                };

                expect(userRepository.getUserCredentials('superadmin')).toEqual(expectedCredentials);
            });

            it("should get user credentials for projectadmin", function() {
                var expectedCredentials = {
                    username: 'projectadmin',
                    password: properties.organisationSettings.userCredentials.pwa.projectadmin
                };

                expect(userRepository.getUserCredentials('projectadmin')).toEqual(expectedCredentials);
            });

            it("should get user credentials for project user", function() {
                var expectedCredentials = {
                    username: 'some_user',
                    password: properties.organisationSettings.userCredentials.pwa.project_user
                };

                expect(userRepository.getUserCredentials('some_user')).toEqual(expectedCredentials);
            });
        });
    });
});