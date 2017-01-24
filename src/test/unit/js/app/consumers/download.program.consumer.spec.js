define(["downloadProgramConsumer", "programService", "systemInfoService", "utils", "angularMocks", "programRepository", "timecop", "mergeBy"],
    function(DownloadProgramConsumer, ProgramService, SystemInfoService, utils, mocks, ProgramRepository, timecop, MergeBy) {
    describe("download program consumer", function() {
        var downloadProgramConsumer, changeLogRepository, q, scope, programService, systemInfoService, programRepository, mergeBy, message;

        var createDownloadProgramConsumer = function () {
            return new DownloadProgramConsumer(programService, systemInfoService, programRepository, changeLogRepository, q, mergeBy);
        };

        beforeEach(mocks.inject(function($q, $rootScope, $log) {
            q = $q;
            scope = $rootScope.$new();

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
            changeLogRepository = {
                "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, "2014-10-24T09:01:12.020+0000")),
                "upsert": jasmine.createSpy("upsert")
            };

            programService = new ProgramService();
            systemInfoService = new SystemInfoService();
            programRepository = new ProgramRepository();
            mergeBy = new MergeBy($log);
            message = {};

            spyOn(programRepository, "upsert");
            spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, ''));
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

            downloadProgramConsumer = createDownloadProgramConsumer();
            downloadProgramConsumer.run(message);
            scope.$apply();

            expect(programService.upsert).not.toHaveBeenCalled();
            expect(programRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(programsFromDhis);
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

            downloadProgramConsumer = createDownloadProgramConsumer();
            downloadProgramConsumer.run(message);
            scope.$apply();

            expect(programService.upsert).not.toHaveBeenCalled();
            expect(programRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(programsFromDhis);
        });

        it("should upsert lastUpdated time in change log", function() {
            systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, 'someTime'));
            spyOn(programService, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(programService, 'upsert');
            spyOn(programRepository, 'findAll').and.returnValue(utils.getPromise(q, []));

            var downloadOrgunitConsumer = createDownloadProgramConsumer();
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(changeLogRepository.upsert).toHaveBeenCalledWith("programs", 'someTime');
        });
    });
});
