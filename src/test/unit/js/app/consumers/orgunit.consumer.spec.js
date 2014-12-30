define(["orgUnitConsumer", "orgUnitService", "utils", "angularMocks"], function(OrgunitConsumer, OrgUnitService, utils, mocks) {
    describe("orgunitConsumer", function() {
        var orgunitConsumer, payload, orgUnitService, orgUnitRepository, q, scope;

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
            };

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'upsert');

            orgunitConsumer = new OrgunitConsumer(orgUnitService, orgUnitRepository);

            orgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.upsert).not.toHaveBeenCalled();
            expect(orgUnitRepository.upsert).toHaveBeenCalledWith([orgUnitFromDHIS.data]);
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
            };

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'upsert');

            orgunitConsumer = new OrgunitConsumer(orgUnitService, orgUnitRepository);

            orgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.upsert).toHaveBeenCalledWith(message.data.data);
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

            orgunitConsumer = new OrgunitConsumer(orgUnitService, orgUnitRepository);

            orgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.upsert).toHaveBeenCalledWith(message.data.data);
            expect(orgUnitRepository.upsert).not.toHaveBeenCalled();
        });

    });
});
