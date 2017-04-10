define(["downloadOrgUnitConsumer", "orgUnitService", "utils", "lodash", "angularMocks", "orgUnitRepository", "timecop",
"mergeBy", "systemInfoService", "changeLogRepository", "systemSettingRepository"],
    function(DownloadOrgunitConsumer, OrgUnitService, utils, _, mocks, OrgUnitRepository, timecop, MergeBy,
             SystemInfoService, ChangeLogRepository, SystemSettingRepository) {
    describe("downloadOrgunitConsumer", function() {
        var downloadOrgunitConsumer, payload, orgUnitService, orgUnitRepository, systemInfoService, systemSettingRepository, q, scope, changeLogRepository, mergeBy, someTime;
        var mockOrgUnit = function (options) {
            return _.merge({
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "lastUpdated": "2014-10-20T09:01:12.020+0000",
                "parent": {
                    name: 'Name1',
                    id: 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "id": "VKc7bvogtcP"
                    },
                    "value": "val1"
                }]
            }, options);
        };

        beforeEach(mocks.inject(function($q, $rootScope, $log) {
            q = $q;
            scope = $rootScope.$new();
            someTime = '2014-10-24T09:01:12.020+0000';

            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));

            payload = mockOrgUnit();
            orgUnitService = new OrgUnitService();
            orgUnitRepository = new OrgUnitRepository();
            mergeBy = new MergeBy($log);
            systemInfoService = new SystemInfoService();

            spyOn(orgUnitRepository, "upsert");
            spyOn(orgUnitRepository, "upsertDhisDownloadedData");
            spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, 'someTime'));

            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, "get").and.returnValue(utils.getPromise(q, someTime));
            spyOn(changeLogRepository, "upsert");

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, 'getProductKeyLevel').and.returnValue('global');
            spyOn(systemSettingRepository, 'getAllowedOrgUnits').and.returnValue([]);

        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should over write local org unit data with dhis data if DHIS data is latest", function() {
            var localCopy = mockOrgUnit();
            var message = {
                "data": {
                    "data": payload,
                    "type": "upsertOrgUnit"
                },
                "created": "2014-10-24T09:01:12.020+0000"
            };

            var orgUnitFromDHIS = [mockOrgUnit({"lastUpdated": "2014-10-24T09:01:12.020+0000"})];

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy]));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, q, mergeBy, systemSettingRepository);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitService.get).toHaveBeenCalledWith(["a4acf9115a7"]);
            expect(orgUnitService.getAll).toHaveBeenCalledWith("2014-10-24T09:01:12.020+0000");
            expect(orgUnitRepository.findAll).toHaveBeenCalledWith(["a4acf9115a7"]);
            expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitFromDHIS);
        });

        it("should ignore dhis data if localdata is latest than DHIS data", function() {
            var localCopy = mockOrgUnit({"clientLastUpdated": "2014-09-24T10:01:12.020+0000"});
            var message = {
                "data": {
                    "data": mockOrgUnit(),
                    "type": "upsertOrgUnit"
                }
            };

            var orgUnitFromDHIS = [mockOrgUnit({"lastUpdated": "2014-09-24T09:01:12.020+0000"})];

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHIS));
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy]));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, q, mergeBy, systemSettingRepository);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith([localCopy]);
        });

        it("should update local data with dhis data if no orgunit is present in message data", function() {
            var localCopy = mockOrgUnit();
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnit"
                },
            };

            var orgUnitFromDHISSinceLastUpdatedTime = [mockOrgUnit()];

            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHISSinceLastUpdatedTime));
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy]));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, q, mergeBy, systemSettingRepository);
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(orgUnitFromDHISSinceLastUpdatedTime);
            expect(changeLogRepository.upsert).toHaveBeenCalledWith("organisationUnits", "someTime");
        });

        it("should ignore dhis data and retain local data if no orgunit is present in message data", function() {
            var localCopy = mockOrgUnit({"clientLastUpdated": "2014-09-24T10:01:12.020+0000"});
            var message = {
                "data": {
                    "data": [],
                    "type": "downloadOrgUnit"
                }
            };

            var orgUnitFromDHISSinceLastUpdatedTime = [mockOrgUnit({"lastUpdated": "2014-09-24T09:01:12.020+0000"})];

            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, orgUnitFromDHISSinceLastUpdatedTime));
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, [localCopy]));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, q, mergeBy, systemSettingRepository);
            downloadOrgunitConsumer.run(message);

            scope.$apply();

            expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith([localCopy]);
        });

        it('should get server date from system info', function () {
            var message = {
                "data": {
                    "data": [],
                    "type": "someMessageType"
                }
            };
            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, []));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, q, mergeBy, systemSettingRepository);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(systemInfoService.getServerDate).toHaveBeenCalled();
        });

        it('should upsert with the server date', function () {
            var message = {
                "data": {
                    "data": [],
                    "type": "someMessageType"
                }
            };

            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, []));
            spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, []));

            downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, q, mergeBy, systemSettingRepository);

            downloadOrgunitConsumer.run(message);
            scope.$apply();

            expect(changeLogRepository.upsert).toHaveBeenCalledWith('organisationUnits', 'someTime');
        });

        describe('download relevant orgUnits if product key level is not global', function () {
            var message, localCopy;
            beforeEach(function () {
                message = {
                    "data": {
                        "data": [],
                        "type": "upsertOrgUnit"
                    }
                };
                localCopy = mockOrgUnit();

                spyOn(orgUnitService, 'getAll').and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitService, 'getOrgUnitTree').and.returnValue(utils.getPromise(q, []));
                spyOn(orgUnitRepository, 'findAll').and.returnValue(utils.getPromise(q, []));
                systemSettingRepository.getProductKeyLevel.and.returnValue('project');
                systemSettingRepository.getAllowedOrgUnits.and.returnValue([{id: "IDA"}, {id: "IDB"}]);
                downloadOrgunitConsumer = new DownloadOrgunitConsumer(orgUnitService, systemInfoService, orgUnitRepository, changeLogRepository, q, mergeBy, systemSettingRepository);
            });

            it('should get Product key level and allowed orgUnits', function () {
                downloadOrgunitConsumer.run(message);
                scope.$apply();

                expect(systemSettingRepository.getProductKeyLevel).toHaveBeenCalled();
                expect(systemSettingRepository.getAllowedOrgUnits).toHaveBeenCalled();
            });

            it('should get changelog', function () {
                downloadOrgunitConsumer.run(message);
                scope.$apply();
                expect(changeLogRepository.get).toHaveBeenCalledWith("organisationUnits:" + "IDA");
                expect(changeLogRepository.get).toHaveBeenCalledWith("organisationUnits:" + "IDB");
            });

            it('should download only relevant orgUnits', function () {
                downloadOrgunitConsumer.run(message);
                scope.$apply();

                expect(orgUnitService.getOrgUnitTree).toHaveBeenCalledWith("IDA", someTime);
                expect(orgUnitService.getOrgUnitTree).toHaveBeenCalledWith("IDB", someTime);
            });

            it('should upsert updated orgunits', function () {
                var mockDHISOrgUnits = [{id: "IDA"}, {id: "IDB"}];
                orgUnitService.getOrgUnitTree.and.returnValues(utils.getPromise(q, [{id: "IDA"}]), utils.getPromise(q, [{id: "IDB"}]));
                downloadOrgunitConsumer.run(message);
                scope.$apply();

                expect(orgUnitRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(mockDHISOrgUnits);
            });
        });
    });
});
