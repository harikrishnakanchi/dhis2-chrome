define(["programService", "angularMocks", "properties", "metadataConf", "pagingUtils"], function(ProgramService, mocks, properties, metadataConf, pagingUtils) {
    describe("programService", function() {
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

            spyOn(pagingUtils, 'paginateRequest').and.callThrough();
            programService.getAll(lastUpdatedTime).then(function(actualPrograms) {
                expect(actualPrograms).toEqual(programs);
            });

            var programs = [{
                "id": "a625b2495e7"
            }];

            var payload = {
                programs: programs
            };

            var url = properties.dhis.url + '/api/programs.json?fields=' + metadataConf.fields.programs + '&filter=lastUpdated:gte:2014-12-30T09:13:41.092Z&page=1&paging=true&totalPages=true';

            httpBackend.expectGET(encodeURI(url)).respond(200, payload);
            httpBackend.flush();
            expect(pagingUtils.paginateRequest).toHaveBeenCalled();
        });

        it("should load pre-packaged programs data", function() {
            var programDataFromFile = {
                "programs": [{
                    "id": "prg1"
                }]
            };

            httpBackend.expectGET("data/programs.json").respond(200, programDataFromFile);

            var actualResult;
            programService.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expectedProgramData = [{
                "id": "prg1"
            }];

            expect(actualResult).toEqual(expectedProgramData);
        });

        it("should load empty programs data if local file does not exist", function() {
            httpBackend.expectGET("data/programs.json").respond(404);

            var actualResult;
            programService.loadFromFile().then(function(result) {
                actualResult = result;
            });
            httpBackend.flush();

            expect(actualResult).toEqual([]);
        });

        describe('assignOrgUnitToProgram', function () {
            it('should assign the org unit to the program', function () {
                var programId = 'someProgramId',
                    orgUnitId = 'someOrgUnitId';

                programService.assignOrgUnitToProgram(programId, orgUnitId);

                httpBackend.expectPOST(properties.dhis.url + '/api/programs/' + programId + '/organisationUnits/' + orgUnitId).respond(204);
                httpBackend.flush();
            });
        });
    });
});