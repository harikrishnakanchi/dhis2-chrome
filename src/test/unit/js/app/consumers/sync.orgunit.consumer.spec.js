define(['utils', 'angularMocks', 'syncOrgUnitConsumer', 'orgUnitService', 'orgUnitRepository'], function (utils, mocks, SyncOrgUnitConsumer, OrgUnitService, OrgUnitRepository) {
    var syncOrgUnitConsumer, orgUnitService, orgUnitRepository, q, mockOrgUnit, message, scope;
    fdescribe('syncOrgUnitConsumer', function () {

        var createSyncOrgUnitConsumer = function () {
            syncOrgUnitConsumer = new SyncOrgUnitConsumer(q, orgUnitService, orgUnitRepository);
            syncOrgUnitConsumer.run(message);
            scope.$apply();
        };

        beforeEach(mocks.inject(function ($q, $rootScope) {
            mockOrgUnit = {
                id: 'mockOrgUnitId',
                dataSets: []
            };
            q = $q;
            scope = $rootScope;
            orgUnitService = new OrgUnitService();
            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, 'upsert').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, 'assignDataSetToOrgUnit').and.returnValue(utils.getPromise(q, {}));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
            message = {
                data: {
                    data: mockOrgUnit,
                    type: 'syncOrgUnit'
                }
            };
        }));

        it('should download orgUnits from DHIS', function () {
            createSyncOrgUnitConsumer();
            expect(orgUnitService.get).toHaveBeenCalledWith(mockOrgUnit.id);
        });


        describe('when Praxis orgUnit is more recent', function () {
            it('should upsert to DHIS when praxis orgUnit is more recent', function () {
                var mockRemoteOrgUnit = {
                    id: 'mockOrgUnitId',
                    lastUpdated: '2016-08-23'
                };
                var mockLocalOrgUnit = {
                    id: 'mockOrgUnitId',
                    clientLastUpdated: '2016-08-24'
                };
                orgUnitService.get.and.returnValue(utils.getPromise(q, mockRemoteOrgUnit));
                orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

                createSyncOrgUnitConsumer();

                expect(orgUnitService.upsert).toHaveBeenCalledWith(mockLocalOrgUnit);
            });

            fit('should associate the dataSets to orgUnit', function () {
                var mockLocalOrgUnit = {
                    id: 'mockOrgUnitId',
                    dataSets: [{
                        id: 'someDataSetId'
                    }, {
                        id: 'someOtherDataSetId'
                    }]
                };
                orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));
                createSyncOrgUnitConsumer();

                expect(orgUnitService.assignDataSetToOrgUnit).toHaveBeenCalledWith(mockLocalOrgUnit.id, mockLocalOrgUnit.dataSets[0].id);
                expect(orgUnitService.assignDataSetToOrgUnit).toHaveBeenCalledWith(mockLocalOrgUnit.id, mockLocalOrgUnit.dataSets[1].id);
            });
        });

        it('should upsert to DHIS if it is a newly created org unit', function () {
            var mockLocalOrgUnit = {
                id: 'mockOrgUnitId',
                clientLastUpdated: '2016-08-24'
            };
            orgUnitService.get.and.returnValue(utils.getPromise(q, undefined));
            orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

            createSyncOrgUnitConsumer();

            expect(orgUnitService.upsert).toHaveBeenCalledWith(mockLocalOrgUnit);
        });

        describe('when DHIS orgUnit is more recent', function () {
            var mockRemoteOrgUnit, mockLocalOrgUnit;

            beforeEach(function () {
                mockRemoteOrgUnit = {
                    id: 'mockOrgUnitId',
                    lastUpdated: '2016-08-23'
                };
                mockLocalOrgUnit = {
                    id: 'mockOrgUnitId',
                    clientLastUpdated: '2016-08-22'
                };
                orgUnitService.get.and.returnValue(utils.getPromise(q, mockRemoteOrgUnit));
                orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

                createSyncOrgUnitConsumer();
            });
            it('should not upsert to DHIS ', function () {
                expect(orgUnitService.upsert).not.toHaveBeenCalled();
            });

            it('should replace locally modified orgUnit', function () {
                expect(orgUnitRepository.upsert).toHaveBeenCalledWith(mockRemoteOrgUnit);
            });
        });
    });
});