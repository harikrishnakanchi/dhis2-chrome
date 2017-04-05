define(["orgUnitService", "angularMocks", "properties", "utils", "metadataConf", "pagingUtils"], function(OrgUnitService, mocks, properties, utils, metadataConf, pagingUtils) {
    describe("org unit service", function() {
        var http, httpBackend, orgUnitService, db, mockOrgStore, q, orgUnitFields;

        beforeEach(mocks.inject(function($httpBackend, $http, $q) {
            http = $http;
            httpBackend = $httpBackend;
            q = $q;

            mockOrgStore = {
                upsert: function() {},
                getAll: function() {}
            };
            db = {
                objectStore: function() {}
            };

            orgUnitFields = metadataConf.fields.organisationUnits;
            metadataConf.fields.organisationUnits = 'orgUnitFields';

            spyOn(db, "objectStore").and.returnValue(mockOrgStore);
            spyOn(mockOrgStore, "upsert").and.returnValue(utils.getPromise(q, "someId"));

            orgUnitService = new OrgUnitService(http, q);
        }));

        afterEach(function() {
            metadataConf.fields.organisationUnits = orgUnitFields;
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should save organization units in dhis", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }, {
                "id": "org_1",
                "level": 1
            }];

            var expectedPayload = {
                organisationUnits: [{
                    id: 'org_0',
                    level: 1
                }, {
                    "id": "org_1",
                    "level": 1
                }]
            };

            orgUnitService.upsert(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

        it("should save organization unit in dhis", function() {
            var orgUnit = {
                "id": "org_0",
                "level": 1
            };

            var expectedPayload = {
                organisationUnits: [{
                    id: 'org_0',
                    level: 1
                }]
            };

            orgUnitService.upsert(orgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

        it("should send attributes along with metadata for project org units", function() {

            var payload = [{
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
                }, {
                    "attribute": {
                        "code": "prjCon",
                        "name": "Context",
                        "id": "Gy8V8WeGgYs"
                    },
                    "value": "val2"
                }, {
                    "attribute": {
                        "code": "prjLoc",
                        "name": "Location",
                        "id": "CaQPMk01JB8"
                    },
                    "value": "val3"
                }, {
                    "attribute": {
                        "code": "prjType",
                        "name": "Type of project",
                        "id": "bnbnSvRdFYo"
                    },
                    "value": "val4"
                }, {
                    "attribute": {
                        "code": "prjEndDate",
                        "name": "End date",
                        "id": "ZbUuOnEmVs5"
                    },
                    "value": "val5"
                }, {
                    "attribute": {
                        "code": "prjPopType",
                        "name": "Type of population",
                        "id": "Byx9QE6IvXB"
                    },
                    "value": "val6"
                }]
            }];


            var expectedPayload = {
                "organisationUnits": payload
            };

            orgUnitService.upsert(payload);

            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", expectedPayload).respond(200, "ok");
            httpBackend.flush();
        });

        it("should get org unit with a particular id", function () {
            var orgUnitId = "org1234";

            orgUnitService.get(orgUnitId);
            var url = properties.dhis.url + '/api/organisationUnits.json?fields=orgUnitFields&filter=id:eq:org1234&paging=false';

            httpBackend.expectGET(url).respond(200, "ok");
            httpBackend.flush();
        });

        it("should get multiple org units with given ids", function() {
            var orgUnitIds = ["id1", "id2"];

            orgUnitService.get(orgUnitIds);

            httpBackend.expectGET(properties.dhis.url +
                '/api/organisationUnits.json?fields=orgUnitFields&filter=id:eq:id1&filter=id:eq:id2&paging=false').respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org units since lastUpdated with pagination", function() {
            var lastUpdatedTime = "2014-12-30T09:13:41.092Z";
            spyOn(pagingUtils, 'paginateRequest').and.callThrough();

            orgUnitService.getAll(lastUpdatedTime);

            expect(pagingUtils.paginateRequest).toHaveBeenCalled();
            httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits.json?fields=orgUnitFields&filter=lastUpdated:gte:2014-12-30T09:13:41.092Z&page=1&pageSize=150&paging=true&totalPages=true').respond(200, "ok");
            httpBackend.flush();
        });

        it("should get all org units with pagination", function() {
            orgUnitService.getAll();

            httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits.json?fields=orgUnitFields&page=1&pageSize=150&paging=true&totalPages=true').respond(200, "ok");
            httpBackend.flush();
        });

        it('should assign dataSet to orgUnit', function() {
            var dataSetId = 'dataSetId';
            var orgUnitId = 'orgUnitId';

            orgUnitService.assignDataSetToOrgUnit(orgUnitId, dataSetId);

            httpBackend.expectPOST(properties.dhis.url + '/api/organisationUnits/' + orgUnitId + '/dataSets/' + dataSetId).respond(204);
            httpBackend.flush();
        });

        it('should remove dataSet from orgUnit', function() {
            var dataSetId = 'dataSetId';
            var orgUnitId = 'orgUnitId';

            orgUnitService.removeDataSetFromOrgUnit(orgUnitId, dataSetId);

            httpBackend.expectDELETE(properties.dhis.url + '/api/organisationUnits/' + orgUnitId + '/dataSets/' + dataSetId).respond(204);
            httpBackend.flush();
        });

        it('should save organization unit to DHIS using the orgUnit API', function () {
            var newMockOrgUnit = {
                id: 'mockOrgUnitId',
                dataSets: [{
                    id: 'someDataSetId'
                }, {
                    id: 'someOtherDataSetId'
                }]
            };

            orgUnitService.create(newMockOrgUnit);

            httpBackend.expectPOST(properties.dhis.url + "/api/organisationUnits", newMockOrgUnit).respond(200, 'ok');
            httpBackend.flush();
        });

        it('should update organization unit to DHIS using the orgUnit API', function () {
            var existingMockOrgUnit = {
                id: 'mockOrgUnitId',
                dataSets: [{
                    id: 'someDataSetId'
                }, {
                    id: 'someOtherDataSetId'
                }]
            };

            orgUnitService.update(existingMockOrgUnit);

            httpBackend.expectPUT(properties.dhis.url + "/api/organisationUnits/" + existingMockOrgUnit.id, existingMockOrgUnit).respond(200, 'ok');
            httpBackend.flush();
        });

        it("should load pre-packaged organisationUnits data", function() {
            var orgUnitsFromFile = {
                "organisationUnits": [{
                    "id": "someOrgUnit"
                }]
            };

            httpBackend.expectGET("data/organisationUnits.json").respond(200, orgUnitsFromFile);

            var actualResult;
            orgUnitService.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            var expectedOrgUnits = [{
                "id": "someOrgUnit"
            }];

            expect(actualResult).toEqual(expectedOrgUnits);
        });

        it("should return empty organisationUnits data if local file does not exist", function() {
            httpBackend.expectGET("data/organisationUnits.json").respond(404);

            var actualResult;
            orgUnitService.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expect(actualResult).toEqual([]);
        });

        describe('getOrgUnitAndDescendants', function () {
            var orgUnitId, expectedOrgUnitsWithIds, expectedOrgUnits, orgUnitIdHandler;
            beforeEach(function () {
                orgUnitId = "orgUnitID";
                expectedOrgUnitsWithIds = [{'id': "IDA"}, {'id': "IDB"}];
                expectedOrgUnits = [{'id': "IDA", 'name': 'someName'}, {'id': "IDB", 'name': 'someOtherName'}];
                orgUnitIdHandler = httpBackend.whenGET(/api\/organisationUnits\/(.+)\.json*/).respond(200, {organisationUnits: expectedOrgUnitsWithIds});
                httpBackend.whenGET(/api\/organisationUnits\.json*/).respond(200, {organisationUnits: expectedOrgUnits});
            });

            it('should get the all ids of descendants and ancestors of specified orgunit', function () {
                httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits/' + orgUnitId + '.json?fields=id&includeAncestors=true&includeDescendants=true').respond(200, {organisationUnits: expectedOrgUnitsWithIds});
                orgUnitService.getOrgUnitTree(orgUnitId);

                httpBackend.flush();
            });

            it('should get the orgunit details of descendants and ancestors of specified orgunit', function () {
                httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits.json?fields=' + metadataConf.fields.organisationUnits + encodeURI('&filter=id:in:[IDA,IDB]')).respond(200, {organisationUnits: expectedOrgUnits});

                orgUnitService.getOrgUnitTree(orgUnitId).then(function (actualOrgUnits) {
                    expect(actualOrgUnits).toEqual(expectedOrgUnits);
                });
                httpBackend.flush();
            });

            it('should paginate the orgunit details', function () {
                var mockId = [{id: 'IDA'}, {id: 'IDB'}, {id: 'IDC'}];
                expectedOrgUnits = [
                    {id: "IDA", name: "someName"},
                    {id: "IDB", name: "someOtherName"},
                    {id: "IDC", name: "someNameC"}
                ];
                orgUnitIdHandler.respond(200, {organisationUnits: mockId});

                httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits.json?fields=' + metadataConf.fields.organisationUnits + encodeURI('&filter=id:in:[IDA,IDB]')).respond(200, {organisationUnits: [expectedOrgUnits[0], expectedOrgUnits[1]]});
                httpBackend.expectGET(properties.dhis.url + '/api/organisationUnits.json?fields=' + metadataConf.fields.organisationUnits + encodeURI('&filter=id:in:[IDC]')).respond(200, {organisationUnits: [expectedOrgUnits[2]]});

                orgUnitService.getOrgUnitTree(orgUnitId, 2).then(function (actualOrgUnits) {
                    expect(actualOrgUnits).toEqual(expectedOrgUnits);
                });
                httpBackend.flush();
            });
        });
    });
});
