define(["downloadOrgUnitConsumer", "orgUnitService", "utils", "angularMocks", "orgUnitRepository", "timecop"], function(DownloadOrgunitConsumer, OrgUnitService, utils, mocks, OrgUnitRepository, timecop) {
    describe("downloadOrgunitConsumer", function() {
        var downloadOrgunitConsumer, payload, orgUnitService, orgUnitRepository, q, scope, changeLogRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

            payload = {
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "lastUpdated": "2014-10-20T09:01:12.020+0000",
                "parent": {
                    name: 'Name1',
                    id: 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "lastUpdated": "2014-10-20T09:01:12.020+0000",
                    "value": "val1"
                }]
            };
            orgUnitService = new OrgUnitService();
            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "upsert");
            spyOn(orgUnitRepository, "upsertDhisDownloadedData");

            changeLogRepository = {
                "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, "2014-10-24T09:01:12.020+0000")),
                "upsert": jasmine.createSpy("upsert")
            };

        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should over write local org unit data with dhis data for upsertOrgUnit message", function() {
            var localCopy = payload;
            var message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };

            var orgUnitFromDHIS = [{
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "lastUpdated": "2014-10-24T09:01:12.020+0000",
                "parent": {
                    "name": 'Name1',
                    "id": 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "lastUpdated": "2014-10-20T09:01:12.020+0000",
                    "value": "val1"
                }]
            }];

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'upsert');
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy]));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, changeLogRepository, q);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.get).toHaveBeenCalledWith(["a4acf9115a7"]);
            expect(orgUnitService.getAll).toHaveBeenCalledWith("2014-10-24T09:01:12.020+0000");
            expect(orgUnitRepository.findAll).toHaveBeenCalledWith(["a4acf9115a7"]);
            expect(orgUnitService.upsert).not.toHaveBeenCalled();
            expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitFromDHIS);
        });

        it("should ignore dhis data for upsertOrgUnit message", function() {
            var localCopy = payload;
            payload.clientLastUpdated = "2014-09-24T10:01:12.020+0000";
            var message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };

            var orgUnitFromDHIS = [{
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "lastUpdated": "2014-09-24T09:01:12.020+0000",
                "parent": {
                    "name": 'Name1',
                    "id": 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "lastUpdated": "2014-09-20T09:01:12.020+0000",
                    "value": "val1"
                }]
            }];

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'upsert');
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy]));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, changeLogRepository, q);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.get).toHaveBeenCalledWith(["a4acf9115a7"]);
            expect(orgUnitService.getAll).toHaveBeenCalledWith("2014-10-24T09:01:12.020+0000");
            expect(orgUnitRepository.findAll).toHaveBeenCalledWith(["a4acf9115a7"]);
            expect(orgUnitService.upsert).not.toHaveBeenCalled();
            expect(orgUnitRepository.upsert).not.toHaveBeenCalled();
        });

        it("should overwrite local data with dhis data for downloadOrgUnit message", function() {
            var localCopy = payload;
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnit"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };

            var orgUnitFromDHISSinceLastUpdatedTime = [{
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "lastUpdated": "2014-10-24T09:01:12.020+0000",
                "parent": {
                    "name": 'Name1',
                    "id": 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "lastUpdated": "2014-10-20T09:01:12.020+0000",
                    "value": "val1"
                }]
            }];

            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHISSinceLastUpdatedTime));
            spyOn(orgUnitService, 'upsert');
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy]));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, changeLogRepository, q);
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(orgUnitService.upsert).not.toHaveBeenCalled();
            expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitFromDHISSinceLastUpdatedTime);
        });

        it("should ignore dhis data for downloadOrgUnit message", function() {
            var localCopy = payload;
            payload.clientLastUpdated = "2014-09-24T10:01:12.020+0000";
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnit"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };

            var orgUnitFromDHISSinceLastUpdatedTime = {
                "data": {
                    "organisationUnits": [{
                        'id': 'a4acf9115a8',
                        'name': 'Org2',
                        'shortName': 'Org2',
                        'level': 4,
                        'openingDate': "YYYY-MM-DD",
                        "lastUpdated": "2014-09-24T09:01:12.020+0000",
                        "parent": {
                            "name": 'Name1',
                            "id": 'Id1'
                        },
                        "attributeValues": [{
                            "attribute": {
                                "code": "prjConDays",
                                "name": "No of Consultation days per week",
                                "id": "VKc7bvogtcP"
                            },
                            "lastUpdated": "2014-09-20T09:01:12.020+0000",
                            "value": "val1"
                        }]
                    }]
                }
            };

            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHISSinceLastUpdatedTime));
            spyOn(orgUnitService, 'upsert');
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy]));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, changeLogRepository, q);
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(orgUnitService.upsert).not.toHaveBeenCalled();
            expect(orgUnitRepository.upsert).not.toHaveBeenCalled();
        });

        it("should upsert lastUpdated time in change log", function() {
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnit"
                }
            };

            var orgUnitFromDHISSinceLastUpdatedTime = {
                "data": {
                    "organisationUnits": []
                }
            };

            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHISSinceLastUpdatedTime));
            spyOn(orgUnitService, 'upsert');

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, changeLogRepository, q);
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(changeLogRepository.upsert).toHaveBeenCalledWith("orgUnits", "2014-05-30T12:43:54.972Z");
        });

        it("should upsert new org units from dhis to local db", function() {
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnit"
                }
            };

            var orgUnitFromDHISSinceLastUpdatedTime = [{
                'id': 'a4acf9115a8',
                'name': 'Org2',
                'shortName': 'Org2',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "lastUpdated": "2014-09-24T09:01:12.020+0000",
                "parent": {
                    "name": 'Name1',
                    "id": 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "lastUpdated": "2014-09-20T09:01:12.020+0000",
                    "value": "val1"
                }]
            }];

            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHISSinceLastUpdatedTime));
            spyOn(orgUnitService, 'upsert');
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, []));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, changeLogRepository, q);
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(orgUnitService.upsert).not.toHaveBeenCalled();
            expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitFromDHISSinceLastUpdatedTime);
        });
    });
});
