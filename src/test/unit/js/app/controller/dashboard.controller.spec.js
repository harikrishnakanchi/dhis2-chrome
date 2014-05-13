define(["dashboardController", "angularMocks", "utils"], function(DashboardController, mocks, utils) {
    describe("dashboard controller", function() {
        var q, db, dataService, dashboardController, rootScope;

        beforeEach(mocks.inject(function($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();
            rootScope = $rootScope;

            dataService = {
                "get": function(orgUnit, dataset) {},
                "saveToDb": function() {}
            };

            dashboardController = new DashboardController(scope, q, dataService, rootScope);
        }));


        it("should fetch and display all organisation units", function() {
            spyOn(dataService, "saveToDb");
            spyOn(dataService, "get").and.callFake(function() {
                return utils.getPromise(q, {
                    "dataValues": [{
                        "dataElement": "DE_Oedema",
                        "period": "2014W15",
                        "orgUnit": "company_0",
                        "categoryOptionCombo": "32",
                        "value": "8",
                        "storedBy": "admin",
                        "lastUpdated": "2014-04-17T15:30:56.172+05:30",
                        "followUp": false
                    }]
                });
            });

            scope.syncNow();
            expect(scope.isSyncRunning).toEqual(true);
            expect(scope.isSyncDone).toEqual(undefined);

            scope.$apply();

            expect(scope.isSyncRunning).toEqual(false);
            expect(scope.isSyncDone).toEqual(true);
            expect(dataService.get).toHaveBeenCalled();
            expect(dataService.saveToDb).toHaveBeenCalled();
        });



        it("should show appropriate links for superuser", function() {

            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userAuthorityGroups": [{
                        "id": "hxNB8lleCsl",
                        "name": 'Superuser'
                    }, {
                        "id": "hxNB8lleCsl",
                        "name": 'blah'
                    }]
                }
            };

            rootScope.$apply();

            expect(scope.canEnterData()).toEqual(false);
            expect(scope.canViewOrManageProjects()).toEqual(true);
            expect(scope.canTriggerDataSync()).toEqual(true);
        });

        it("should show appropriate links for Data entry user", function() {

            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userAuthorityGroups": [{
                        "id": "hxNB8lleCsl",
                        "name": 'Data entry user'
                    }, {
                        "id": "hxNB8lleCsl",
                        "name": 'blah'
                    }]
                }
            };

            rootScope.$apply();

            expect(scope.canEnterData()).toEqual(true);
            expect(scope.canViewOrManageProjects()).toEqual(false);
            expect(scope.canTriggerDataSync()).toEqual(true);
        });

        it("should show appropriate links for level 1 Approver", function() {

            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userAuthorityGroups": [{
                        "id": "hxNB8lleCsl",
                        "name": 'Approver - Level 1'
                    }, {
                        "id": "hxNB8lleCsl",
                        "name": 'blah'
                    }]
                }
            };

            rootScope.$apply();

            expect(scope.canEnterData()).toEqual(false);
            expect(scope.canViewOrManageProjects()).toEqual(false);
            expect(scope.canTriggerDataSync()).toEqual(true);
        });

        it("should show appropriate links for level 2 Approver", function() {

            rootScope.currentUser = {
                "firstName": "test1",
                "lastName": "test1last",
                "userCredentials": {
                    "username": "dataentryuser",
                    "userAuthorityGroups": [{
                        "id": "hxNB8lleCsl",
                        "name": 'Approver - Level 2'
                    }, {
                        "id": "hxNB8lleCsl",
                        "name": 'blah'
                    }]
                }
            };

            rootScope.$apply();

            expect(scope.canEnterData()).toEqual(false);
            expect(scope.canViewOrManageProjects()).toEqual(false);
            expect(scope.canTriggerDataSync()).toEqual(true);
        });
    });
});