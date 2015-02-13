define(["downloadProgramConsumer", "programService", "utils", "angularMocks", "programRepository", "timecop"], function(DownloadProgramConsumer, ProgramService, utils, mocks, ProgramRepository, timecop) {
    describe("download program consumer", function() {
        var downloadProgramConsumer, changeLogRepository, q, scope, programService, programRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
            changeLogRepository = {
                "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, "2014-10-24T09:01:12.020+0000")),
                "upsert": jasmine.createSpy("upsert")
            };

            programService = new ProgramService();
            programRepository = new ProgramRepository();
            spyOn(programRepository, "upsert");
            spyOn(programRepository, "upsertDhisDownloadedData");
        }));

        it("should overwrite local program with dhis copy if org units have been added in DHIS", function() {
            var programsFromDb = [{
                "id": "a625b2495e7",
                "name": "ER - Presenting Line List",
                "lastUpdated": "2015-01-18T11:42:09.312+0000",
                "organisationUnits": [{
                    "id": "adebf794823",
                    "name": "foomod",
                }]
            }];

            var programsFromDhis = [{
                "id": "a625b2495e7",
                "name": "ER - Presenting Line List",
                "lastUpdated": "2015-01-21T11:42:09.312+0000",
                "organisationUnits": [{
                    "id": "adebf794823",
                    "name": "foomod"
                }, {
                    "id": "adebf794824",
                    "name": "barmod"
                }]
            }];
            spyOn(programService, 'getAll').and.returnValue(utils.getPromise(q, programsFromDhis));
            spyOn(programRepository, 'findAll').and.returnValue(utils.getPromise(q, programsFromDb));
            spyOn(programService, 'upsert');

            var message = {
                "data": {
                    "data": [],
                    "type": "downloadPrograms"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };
            downloadProgramConsumer = new DownloadProgramConsumer(programService, programRepository, changeLogRepository, q);
            downloadProgramConsumer.run(message);
            scope.$apply();

            expect(programService.upsert).not.toHaveBeenCalled();
            expect(programRepository.upsertDhisDownloadedData.calls.argsFor(0)).toEqual([programsFromDhis]);
            expect(programRepository.upsertDhisDownloadedData.calls.argsFor(1)).toEqual([programsFromDhis]);
        });

        it("should overwrite local program with dhis copy if local data is stale", function() {

            var programsFromDb = [{
                "id": "a625b2495e7",
                "name": "ER - Presenting Line List",
                "lastUpdated": "2014-01-01T09:28:16.467+0000",
                "organisationUnits": [{
                    "id": "adebf794823",
                    "name": "foomod",
                }]
            }];

            var programsFromDhis = [{
                "id": "a625b2495e7",
                "name": "New Name",
                "lastUpdated": "2015-01-21T11:42:09.312+0000",
                "organisationUnits": [{
                    "id": "adebf794823",
                    "name": "foomod"
                }]
            }];

            spyOn(programService, 'getAll').and.returnValue(utils.getPromise(q, programsFromDhis));
            spyOn(programRepository, 'findAll').and.returnValue(utils.getPromise(q, programsFromDb));
            spyOn(programService, 'upsert');

            var message = {
                "data": {
                    "data": [],
                    "type": "downloadPrograms"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };
            downloadProgramConsumer = new DownloadProgramConsumer(programService, programRepository, changeLogRepository, q);
            downloadProgramConsumer.run(message);
            scope.$apply();

            expect(programService.upsert).not.toHaveBeenCalled();
            expect(programRepository.upsertDhisDownloadedData.calls.argsFor(0)).toEqual([programsFromDb]);
            expect(programRepository.upsertDhisDownloadedData.calls.argsFor(1)).toEqual([programsFromDhis]);
        });

        it("should upsert lastUpdated time in change log", function() {
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadPrograms"
                }
            };

            spyOn(programService, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(programService, 'upsert');
            spyOn(programRepository, 'findAll').and.returnValue(utils.getPromise(q, []));

            downloadOrgunitConsumer = new DownloadProgramConsumer(programService, programRepository, changeLogRepository, q);
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(changeLogRepository.upsert).toHaveBeenCalledWith("programs", "2014-05-30T12:43:54.972Z");
        });
    });
});
