define(["downloadOrgUnitConsumer", "orgUnitService", "utils", "angularMocks"], function(DownloadOrgunitConsumer, OrgUnitService, utils, mocks) {
    describe("downloadOrgunitConsumer", function() {
        var downloadOrgunitConsumer, payload, orgUnitService, orgUnitRepository, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            payload = [{
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
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
                    "value": "val1"
                }]
            }];
            orgUnitService = new OrgUnitService();
            orgUnitRepository = jasmine.createSpyObj({}, ['upsert']);
        }));

        it("should over write local org unit data with dhis data if it is stale", function() {
            var message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };

            var orgUnitFromDHIS = {
                "data": {
                    "organisationUnits": {
                        "id": "orgUnit1",
                        "name": "Afghanistan",
                        "lastUpdated": "2014-09-24T09:01:12.020+0000",
                        "attributeValues": [{
                            "value": "population",
                            "lastUpdated": "2014-12-24T09:01:12.020+0000",
                            "attribute": {
                                "id": "abcd1234",
                                "name": "Type of population",
                                "code": "prjPopType"
                            }
                        }]
                    }
                }
            };

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'upsert');

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, q);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.get).toHaveBeenCalledWith("a4acf9115a7");
            expect(orgUnitService.upsert).not.toHaveBeenCalled();
            expect(orgUnitRepository.upsert).toHaveBeenCalledWith([orgUnitFromDHIS.data.organisationUnits]);
        });

        it("should sync local org unit data to dhis if it is not stale", function() {
            var message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                },
                "created": "2014-14-24T09:01:12.020+0000"
            };

            var orgUnitFromDHIS = {
                "data": {
                    "organisationUnits": {
                        "id": "orgUnit1",
                        "name": "Afghanistan",
                        "lastUpdated": "2014-09-24T09:01:12.020+0000",
                        "attributeValues": [{
                            "value": "population",
                            "lastUpdated": "2014-12-24T09:01:12.020+0000",
                            "attribute": {
                                "id": "abcd1234",
                                "name": "Type of population",
                                "code": "prjPopType"
                            }
                        }]
                    }
                }
            };

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'upsert');

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, q);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.get).toHaveBeenCalledWith("a4acf9115a7");
            expect(orgUnitService.upsert).toHaveBeenCalledWith(message.data.data[0]);
            expect(orgUnitRepository.upsert).not.toHaveBeenCalled();
        });

        it("should sync locally created org units", function() {
            var message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                },
                "created": "2014-14-24T09:01:12.020+0000"
            };

            spyOn(orgUnitService, 'get').and.returnValue(utils.getRejectedPromise(q, {
                "status": 404
            }));
            spyOn(orgUnitService, 'upsert');

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, q);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.get).toHaveBeenCalledWith("a4acf9115a7");
            expect(orgUnitService.upsert).toHaveBeenCalledWith(message.data.data[0]);
            expect(orgUnitRepository.upsert).not.toHaveBeenCalled();
        });

        it("should create multiple orgunits", function() {
            payload = [{
                "id": "213046e2707",
                "name": "OpUnit1",
                "lastUpdated": "2014-12-30T05:47:16.732+0000",
                "attributeValues": [{
                    "created": "2014-12-30T05:47:20.631+0000",
                    "value": "X",
                    "lastUpdated": "2014-12-30T05:47:20.631+0000",
                    "attribute": {
                        "id": "huc",
                        "name": "Hospital Code"
                    }
                }]
            }, {
                "id": "213046e2708",
                "name": "OpUnit2",
                "lastUpdated": "2014-12-30T05:47:16.732+0000",
                "attributeValues": [{
                    "created": "2014-12-30T05:47:20.631+0000",
                    "value": "Y",
                    "lastUpdated": "2014-12-30T05:47:20.631+0000",
                    "attribute": {
                        "id": "huc",
                        "name": "Hospital Code"
                    }
                }]
            }];
            var message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                },
                "created": "2014-14-24T09:01:12.020+0000"
            };

            spyOn(orgUnitService, 'get').and.returnValue(utils.getRejectedPromise(q, {
                "status": 404
            }));
            spyOn(orgUnitService, 'upsert');

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, orgUnitRepository, q);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.get.calls.argsFor(0)).toEqual(["213046e2707"]);
            expect(orgUnitService.upsert.calls.argsFor(0)).toEqual([message.data.data[0]]);

            expect(orgUnitService.get.calls.argsFor(1)).toEqual(["213046e2708"]);
            expect(orgUnitService.upsert.calls.argsFor(1)).toEqual([message.data.data[1]]);

            expect(orgUnitRepository.upsert).not.toHaveBeenCalled();
        });
    });
});
