define(["downloadProgramConsumer", "programService", "utils", "angularMocks", "programRepository", "timecop"], function(DownloadProgramConsumer, ProgramService, utils, mocks, ProgramRepository, timecop) {
    describe("download program consumer", function() {
        var downloadProgramConsumer, changeLogRepository, q, scope, payload, programService, programRepository;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

            payload = {
                "programs": [{
                    "id": "a625b2495e7",
                    "created": "2015-01-01T09:28:16.467+0000",
                    "name": "ER - Presenting Line List",
                    "lastUpdated": "2015-01-18T11:42:09.312+0000",
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
                    }],
                    "attributeValues": [],
                    "userRoles": [{
                        "id": "8d32f0f1336",
                        "name": "Data entry user",
                        "created": "2015-01-19T09:26:48.781+0000",
                        "lastUpdated": "2015-01-19T09:26:48.781+0000"
                    }]
                }]
            };
            changeLogRepository = {
                "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, "2014-10-24T09:01:12.020+0000")),
                "upsert": jasmine.createSpy("upsert")
            };
            programService = new ProgramService();
            programRepository = new ProgramRepository();
            spyOn(programRepository, "upsert");
        }));

        it("should overwrite local program with dhis copy", function() {
            var localCopy = payload;
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadPrograms"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };

            programsFromDhis = [{
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
            spyOn(programService, 'getAll').and.returnValue(utils.getPromise(q, programsFromDhis));
            spyOn(programService, 'upsert');
            spyOn(programRepository, 'get').and.returnValue(utils.getPromise(q, localCopy));

            downloadProgramConsumer = new DownloadProgramConsumer(programService, programRepository, changeLogRepository, q);
            downloadProgramConsumer.run(message);
            scope.$apply();

            expect(programService.upsert).not.toHaveBeenCalled();
            expect(programRepository.upsert).toHaveBeenCalledWith(programsFromDhis[0]);
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

            downloadOrgunitConsumer = new DownloadProgramConsumer(programService, programRepository, changeLogRepository, q);
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(changeLogRepository.upsert).toHaveBeenCalledWith("programs", "2014-05-30T12:43:54.972Z");
        });
    });
});
