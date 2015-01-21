define(["programService", "angularMocks", "properties", "utils"], function(ProgramService, mocks, properties, utils) {
    describe("program service", function() {
        var http, httpBackend, programService;

        beforeEach(mocks.inject(function($httpBackend, $http) {
            http = $http;
            httpBackend = $httpBackend;
            programService = new ProgramService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should upload program to dhis", function() {
            var programs = [{
                "id": "id123",
                "name": "program1",
                "kind": "SINGLE_EVENT_WITHOUT_REGISTRATION",
                "organisationUnits": [{
                    "id": "org1",
                    "name": "org unit 1"
                }]
            }];

            programService.upsert(programs);
            httpBackend.expectPOST(properties.dhis.url + "/api/metadata", {
                "programs": programs
            }).respond(200, "ok");
            httpBackend.flush();
        });

        it("should download programs modified since lastUpdated", function() {
            var lastUpdatedTime = "2014-12-30T09:13:41.092Z";

            programService.getAll(lastUpdatedTime).then(function(actualPrograms) {
                expect(actualPrograms).toEqual(programs);
            });

            var programs = [{
                "id": "a625b2495e7",
                "created": "2015-01-01T09:28:16.467+0000",
                "name": "ER - Presenting Line List",
                "lastUpdated": "2015-01-21T11:42:09.312+0000",
                "type": 3,
                "user": {
                    "id": "iWhpLAC0f1H",
                    "name": "admin admin",
                    "created": "2015-01-19T09:26:05.394+0000",
                    "lastUpdated": "2015-01-19T09:26:05.394+0000"
                },
                "validationCriterias": [],
                "programStages": [{
                    "id": "ab17f8e7729",
                    "name": "ER - Presenting Line List Stage",
                    "created": "2015-01-19T09:28:16.639+0000",
                    "lastUpdated": "2015-01-19T09:28:16.639+0000"
                }],
                "organisationUnits": [{
                    "id": "adebf794823",
                    "name": "foomod",
                    "created": "2015-01-20T10:41:59.529+0000",
                    "lastUpdated": "2015-01-20T10:41:59.243+0000"
                }, {
                    "id": "adebf794824",
                    "name": "barmod",
                    "created": "2015-01-20T10:41:59.529+0000",
                    "lastUpdated": "2015-01-20T10:41:59.243+0000"
                }],
                "attributeValues": [],
                "userRoles": [{
                    "id": "8d32f0f1336",
                    "name": "Data entry user",
                    "created": "2015-01-19T09:26:48.781+0000",
                    "lastUpdated": "2015-01-19T09:26:48.781+0000"
                }]
            }];

            var payload = {
                programs: programs
            };

            httpBackend.expectGET(properties.dhis.url + '/api/programs.json?fields=:all&paging=false&filter=lastUpdated:gte:2014-12-30T09:13:41.092Z').respond(200, payload);
            httpBackend.flush();
        });
    });
});
