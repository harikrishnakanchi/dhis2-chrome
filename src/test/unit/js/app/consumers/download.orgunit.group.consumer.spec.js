define(["downloadOrgUnitGroupConsumer", "utils", "angularMocks", "orgUnitGroupService", "orgUnitGroupRepository", "timecop", "mergeBy"], function(DownloadOrgUnitGroupConsumer, utils, mocks, OrgUnitGroupService, OrgUnitGroupRepository, timecop, MergeBy) {
    describe("downloadOrgUnitGroupConsumer", function() {
        var downloadOrgUnitGroupConsumer, payload, orgUnitGroupService, orgUnitGroupRepository, q, scope, changeLogRepository, mergeBy;

        beforeEach(mocks.inject(function($q, $rootScope, $log) {
            q = $q;
            scope = $rootScope.$new();

            payload = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "a119bd25ace",
                    "name": "Out-patient General",
                    "localStatus": "NEW"
                }, {
                    "id": "a0c51512f88",
                    "name": "OBGYN",
                    "localStatus": "DELETED"
                }, {
                    "id": "a43bd484a05",
                    "name": "Laboratory"
                }, {
                    "id": "cccbd484a05",
                    "name": "NeoNat"
                }],
                "lastUpdated": "2014-10-23T09:01:12.020+0000",
                "shortName": "Most-at-risk Population"
            }];

            orgUnitGroupService = new OrgUnitGroupService();
            orgUnitGroupRepository = new OrgUnitGroupRepository();
            mergeBy = new MergeBy($log);

            spyOn(orgUnitGroupRepository, "upsertDhisDownloadedData");

            changeLogRepository = {
                "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, "2014-10-24T09:01:12.020+0000")),
                "upsert": jasmine.createSpy("upsert")
            };

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should merge orgunits from local and remote org unit groups for upsertOrgUnitGroups message", function() {
            var localCopy = payload;
            var message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnitGroups"
                }
            };

            var orgUnitGroupsFromDHIS = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "a0c51512f88",
                    "name": "OBGYN"
                }, {
                    "id": "a43bd484a05",
                    "name": "Laboratory"
                }],
                "lastUpdated": "2014-10-28T09:01:12.020+0000",
                "shortName": "Most-at-risk Populationdsadasd"
            }];

            var expectedOrgUnitGroups = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "a43bd484a05",
                    "name": "Laboratory"
                }, {
                    "id": "a119bd25ace",
                    "name": "Out-patient General",
                    "localStatus": "NEW"
                }, {
                    "id": "a0c51512f88",
                    "name": "OBGYN",
                    "localStatus": "DELETED"
                }],
                "lastUpdated": "2014-10-28T09:01:12.020+0000",
                "shortName": "Most-at-risk Populationdsadasd"
            }];

            spyOn(orgUnitGroupService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitGroupsFromDHIS));
            spyOn(orgUnitGroupRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy[0]]));

            downloadOrgUnitGroupConsumer = new DownloadOrgUnitGroupConsumer(orgUnitGroupService, orgUnitGroupRepository, changeLogRepository, q, mergeBy);

            downloadOrgUnitGroupConsumer.run(message);
            scope.$apply();

            expect(orgUnitGroupService.getAll).toHaveBeenCalledWith("2014-10-24T09:01:12.020+0000");
            expect(orgUnitGroupRepository.findAll).toHaveBeenCalledWith(["a35778ed565"]);
            expect(orgUnitGroupRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(expectedOrgUnitGroups);
        });

        it("should merge orgunits from local and remote org unit groups for downloadOrgUnitGroups message", function() {
            var localCopy = payload;
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnitGroups"
                }
            };

            var orgUnitGroupsFromDHIS = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "a0c51512f88",
                    "name": "OBGYN"
                }],
                "lastUpdated": "2014-10-28T09:01:12.020+0000",
                "shortName": "Most-at-risk Population"
            }];

            var expectedOrgUnitGroups = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "a119bd25ace",
                    "name": "Out-patient General",
                    "localStatus": "NEW"
                }, {
                    "id": "a0c51512f88",
                    "name": "OBGYN",
                    "localStatus": "DELETED"
                }],
                "lastUpdated": "2014-10-28T09:01:12.020+0000",
                "shortName": "Most-at-risk Population"
            }];

            spyOn(orgUnitGroupService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitGroupsFromDHIS));
            spyOn(orgUnitGroupRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy[0]]));

            downloadOrgUnitGroupConsumer = new DownloadOrgUnitGroupConsumer(orgUnitGroupService, orgUnitGroupRepository, changeLogRepository, q, mergeBy);

            downloadOrgUnitGroupConsumer.run(message);
            scope.$apply();

            expect(orgUnitGroupRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(expectedOrgUnitGroups);
        });

        it("should upsert lastUpdated time in change log", function() {
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnitGroups"
                }
            };

            var orgUnitGroupsFromDHIS = {
                "data": {
                    "organisationUnitGroups": []
                }
            };

            spyOn(orgUnitGroupService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitGroupsFromDHIS));
            spyOn(orgUnitGroupRepository, 'findAll').and.returnValue(utils.getPromise(q, []));

            downloadOrgUnitGroupConsumer = new DownloadOrgUnitGroupConsumer(orgUnitGroupService, orgUnitGroupRepository, changeLogRepository, q, mergeBy);
            downloadOrgUnitGroupConsumer.run(message);

            scope.$apply();

            expect(changeLogRepository.upsert).toHaveBeenCalledWith("orgUnitGroups", "2014-05-30T12:43:54.972Z");
        });

        it("should upsert new org unit groups from dhis to local db", function() {
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnitGroups"
                }
            };

            var orgUnitGroupsFromDHIS = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "a119bd25ace",
                    "name": "Out-patient General"
                }, {
                    "id": "a0c51512f88",
                    "name": "OBGYN"
                }, {
                    "id": "a43bd484a05",
                    "name": "Laboratory"
                }],
                "lastUpdated": "2014-10-28T09:01:12.020+0000",
                "shortName": "Most-at-risk Population"
            }];

            spyOn(orgUnitGroupService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitGroupsFromDHIS));
            spyOn(orgUnitGroupRepository, 'findAll').and.returnValue(utils.getPromise(q, []));

            downloadOrgUnitGroupConsumer = new DownloadOrgUnitGroupConsumer(orgUnitGroupService, orgUnitGroupRepository, changeLogRepository, q, mergeBy);

            downloadOrgUnitGroupConsumer.run(message);
            scope.$apply();

            expect(orgUnitGroupRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitGroupsFromDHIS);
        });
    });
});
