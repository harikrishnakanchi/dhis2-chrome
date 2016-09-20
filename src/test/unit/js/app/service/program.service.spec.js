define(["programService", "angularMocks", "properties", "utils"], function(ProgramService, mocks, properties, utils) {
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

            programService.getAll(lastUpdatedTime).then(function(actualPrograms) {
                expect(actualPrograms).toEqual(programs);
            });

            var programs = [{
                "id": "a625b2495e7"
            }];

            var payload = {
                programs: programs
            };

            httpBackend.expectGET(properties.dhis.url + '/api/programs.json?fields=id,name,displayName,shortName,programType,organisationUnits,attributeValues[:identifiable,value,attribute[:identifiable]],programType,programStages[id,name,programStageSections[id,name,programStageDataElements[id,compulsory,dataElement[id,name]]]]&paging=false&filter=lastUpdated:gte:2014-12-30T09:13:41.092Z').respond(200, payload);
            httpBackend.flush();
        });

        it("should load pre-packaged programs data", function() {
            var programDataFromFile = {
                "programs": [{
                    "id": "prg1"
                }]
            };

            httpBackend.expectGET("/data/programs.json").respond(200, programDataFromFile);

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