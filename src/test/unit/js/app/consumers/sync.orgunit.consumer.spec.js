define(['utils', 'angularMocks', 'lodash', 'syncOrgUnitConsumer', 'orgUnitService', 'orgUnitRepository'], function (utils, mocks, _, SyncOrgUnitConsumer, OrgUnitService, OrgUnitRepository) {
    var syncOrgUnitConsumer, orgUnitService, orgUnitRepository, q, message, scope, mockOrgUnitId;
    describe('syncOrgUnitConsumer', function () {

        var createSyncOrgUnitConsumer = function () {
            syncOrgUnitConsumer = new SyncOrgUnitConsumer(q, orgUnitService, orgUnitRepository);
            syncOrgUnitConsumer.run(message);
            scope.$apply();
        };

        var createMockOrgUnit = function (options) {
          return _.merge({
              id: mockOrgUnitId
          }, options);
        };


        beforeEach(mocks.inject(function ($q, $rootScope) {
            mockOrgUnitId = 'mockOrgUnitId';
            q = $q;
            scope = $rootScope;
            orgUnitService = new OrgUnitService();
            spyOn(orgUnitService, 'get').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, 'create').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, 'update').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, 'assignDataSetToOrgUnit').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitService, 'removeDataSetFromOrgUnit').and.returnValue(utils.getPromise(q, {}));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));
            message = {
                data: {
                    data: {
                        orgUnitId: mockOrgUnitId
                    },
                    type: 'syncOrgUnit'
                }
            };
        }));

        it('should download orgUnit from DHIS', function () {
            var mockOrgUnit = createMockOrgUnit();
            createSyncOrgUnitConsumer();
            expect(orgUnitService.get).toHaveBeenCalledWith(mockOrgUnit.id);
        });

        describe('when Praxis orgUnit is more recent', function () {
            var mockRemoteOrgUnit, mockLocalOrgUnit;

            beforeEach(function () {
                mockRemoteOrgUnit = createMockOrgUnit({ lastUpdated: '2016-08-23' });
            });

            it('should update orgUnit when it is already existing', function () {
                mockLocalOrgUnit = createMockOrgUnit({ clientLastUpdated: '2016-08-24' });

                orgUnitService.get.and.returnValue(utils.getPromise(q, mockRemoteOrgUnit));
                orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

                createSyncOrgUnitConsumer();

                expect(orgUnitService.update).toHaveBeenCalledWith(mockLocalOrgUnit.id, mockLocalOrgUnit);
            });

            it('should associate only newly added dataSets to orgUnit', function () {
                var mockLocalDataSets = [{
                    id: 'someDataSetId'
                }, {
                    id: 'SomeDataSetToBeAssociated'
                }, {
                    id: 'someOtherDataSetToBeAssociated'
                }];

                var mockRemoteDataSets = [{
                    id: 'someDataSetId'
                }];
                mockRemoteOrgUnit = createMockOrgUnit({ lastUpdated: '2016-08-23' , dataSets: mockRemoteDataSets });
                mockLocalOrgUnit = createMockOrgUnit({ clientLastUpdated: '2016-08-24', dataSets: mockLocalDataSets});

                orgUnitService.get.and.returnValue(utils.getPromise(q, mockRemoteOrgUnit));
                orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

                createSyncOrgUnitConsumer();

                expect(orgUnitService.assignDataSetToOrgUnit).not.toHaveBeenCalledWith(mockLocalOrgUnit.id, mockLocalOrgUnit.dataSets[0].id);
                expect(orgUnitService.assignDataSetToOrgUnit).toHaveBeenCalledWith(mockLocalOrgUnit.id, mockLocalOrgUnit.dataSets[1].id);
                expect(orgUnitService.assignDataSetToOrgUnit).toHaveBeenCalledWith(mockLocalOrgUnit.id, mockLocalOrgUnit.dataSets[2].id);
            });

            it('should unassociate the dataSets which are removed', function () {
                var mockLocalDataSets = [{
                    id: 'someDataSetId'
                }];

                var mockRemoteDataSets = [{
                    id: 'someDataSetId'
                }, {
                    id: 'dataSetToBeUnassociated'
                }, {
                    id: 'someOtherDataSetToBeUnassociated'
                }];

                mockRemoteOrgUnit = createMockOrgUnit({ lastUpdated: '2016-08-23' , dataSets: mockRemoteDataSets });
                mockLocalOrgUnit = createMockOrgUnit({ clientLastUpdated: '2016-08-24', dataSets: mockLocalDataSets});

                orgUnitService.get.and.returnValue(utils.getPromise(q, mockRemoteOrgUnit));
                orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

                createSyncOrgUnitConsumer();

                expect(orgUnitService.removeDataSetFromOrgUnit).toHaveBeenCalledWith(mockLocalOrgUnit.id, mockRemoteDataSets[1].id);
                expect(orgUnitService.removeDataSetFromOrgUnit).toHaveBeenCalledWith(mockLocalOrgUnit.id, mockRemoteDataSets[2].id);
            });
        });

        it('should create orgUnit when it is newly created', function () {
            var mockLocalOrgUnit = createMockOrgUnit({ clientLastUpdated: '2016-08-24' });

            orgUnitService.get.and.returnValue(utils.getPromise(q, undefined));
            orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

            createSyncOrgUnitConsumer();

            expect(orgUnitService.create).toHaveBeenCalledWith(mockLocalOrgUnit);
        });

        describe('when DHIS orgUnit is more recent', function () {
            var mockRemoteOrgUnit, mockLocalOrgUnit;

            beforeEach(function () {
                mockRemoteOrgUnit = createMockOrgUnit({ lastUpdated: '2016-08-23' });
                mockLocalOrgUnit = createMockOrgUnit({ clientLastUpdated: '2016-08-22'});
                orgUnitService.get.and.returnValue(utils.getPromise(q, mockRemoteOrgUnit));
                orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

                createSyncOrgUnitConsumer();
            });
            it('should not upsert to DHIS', function () {
                expect(orgUnitService.update).not.toHaveBeenCalled();
            });

            it('should replace locally modified orgUnit', function () {
                expect(orgUnitRepository.upsert).toHaveBeenCalledWith(mockRemoteOrgUnit);
            });

            it('should not associate the dataSets to orgUnit', function () {
                var dataSets = [{
                    id: 'someDataSetId'
                }, {
                    id: 'someOtherDataSetId'
                }];

                var mockLocalOrgUnit = createMockOrgUnit({ clientLastUpdated: '2016-08-22', dataSets: dataSets});
                orgUnitRepository.get.and.returnValue(utils.getPromise(q, mockLocalOrgUnit));

                createSyncOrgUnitConsumer();

                expect(orgUnitService.assignDataSetToOrgUnit).not.toHaveBeenCalled();
            });
        });
    });
});