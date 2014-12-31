define(["uploadOrgUnitConsumer", "angularMocks", "orgUnitService", "orgUnitRepository", "utils"], function(UploadOrgUnitConsumer, mocks, OrgUnitService, OrgUnitRepository, utils) {
    describe("uploadOrgUnitConsumer", function() {
        var uploadOrgUnitConsumer, message, payload, orgUnitRepository, orgUnitService, orgUnit1FromIDB, orgUnit2FromIDB, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            orgUnit1FromIDB = {
                'id': 'a4acf9115a7',
                'name': 'Org1',
                "attributeValues": [{
                    "attribute": {
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "lastUpdated": "2014-10-20T09:01:12.020+0000",
                    "value": "val1"
                }]
            };

            orgUnit2FromIDB = {
                'id': 'a4acf9115a8',
                'name': 'Org2',
                "attributeValues": [{
                    "attribute": {
                        "name": "No of admission",
                        "id": "VKc787ogtcP"
                    },
                    "lastUpdated": "2014-10-20T09:01:12.020+0000",
                    "value": "val1"
                }]
            };

            orgUnitRepository = new OrgUnitRepository();
            orgUnitService = new OrgUnitService();

            spyOn(orgUnitRepository, "getOrgUnit").and.callFake(function(orgUnitId) {
                var idbData = {
                    "a4acf9115a7": orgUnit1FromIDB,
                    "a4acf9115a8": orgUnit2FromIDB
                };
                return idbData[orgUnitId];
            });
            spyOn(orgUnitService, "upsert");

            uploadOrgUnitConsumer = new UploadOrgUnitConsumer(orgUnitService, orgUnitRepository, q);
        }));

        it("should upload multiple org units to dhis", function() {
            payload = [{
                'id': 'a4acf9115a7',
                'name': 'Org1'
            }, {
                'id': 'a4acf9115a8',
                'name': 'Org2'
            }];

            message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                }
            };

            uploadOrgUnitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.upsert).toHaveBeenCalledWith([orgUnit1FromIDB, orgUnit2FromIDB]);
        });

        it("should upload single org unit to dhis", function() {
            payload = {
                'id': 'a4acf9115a7',
                'name': 'Org1'
            };

            message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                }
            };

            uploadOrgUnitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.upsert).toHaveBeenCalledWith([orgUnit1FromIDB]);
        });
    });
});
