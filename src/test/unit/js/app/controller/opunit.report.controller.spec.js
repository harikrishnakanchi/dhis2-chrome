define(['moment', 'timecop', 'angularMocks', 'utils', 'orgUnitRepository', 'changeLogRepository', 'opunitReportController', 'pivotTableRepository'],
    function (moment, timecop, mocks, utils, OrgUnitRepository, ChangeLogRepository, OpunitReportController, PivotTableRepository) {
    var scope, q, routeParams, rootScope, mockOpUnit, lastUpdatedTime, currentTime, mockPivotTables, mockPivotTableData,
        orgUnitRepository, changeLogRepository, pivotTableRepository, opunitReportController;
    describe('opunitReportController', function () {
        beforeEach(mocks.inject(function ($rootScope, $q) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            q = $q;
            
            routeParams = {
                opUnit: 'opUnitId'
            };

            mockOpUnit = {
                id: 'opUnitId',
                name: 'opUnitName'
            };

            rootScope.currentUser = {
                selectedProject: {
                    id: "someProjectId"
                }
            };

            mockPivotTables = [{
                id: 'somePivotTableId',
                opUnitReport: true
            }, {
                id: 'someOtherPivotTableId',
                opUnitReport: false
            }];

            mockPivotTableData = {
                some: 'data',
                isDataAvailable: true
            };

            currentTime = moment('2015-10-29T12:43:54.972Z');
            Timecop.install();
            Timecop.freeze(currentTime);
            lastUpdatedTime = '2015-10-28T12:43:54.972Z';

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, mockOpUnit));
            
            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdatedTime));

            pivotTableRepository = new PivotTableRepository();
            spyOn(pivotTableRepository, 'getAll').and.returnValue(utils.getPromise(q, mockPivotTables));
            spyOn(pivotTableRepository, 'getPivotTableData').and.returnValue(utils.getPromise(q, mockPivotTableData));

            opunitReportController = new OpunitReportController(rootScope, q, scope, routeParams, orgUnitRepository, changeLogRepository, pivotTableRepository);
        }));

        afterEach(function () {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });
        
        it('should get the opunit name and set it to scope', function () {
            scope.$apply();
            expect(orgUnitRepository.get).toHaveBeenCalledWith(routeParams.opUnit);
            expect(scope.opUnitName).toEqual(mockOpUnit.name);
        });

        it('should get the lastUpdated', function () {
            var projectId = rootScope.currentUser.selectedProject.id,
                REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";

            scope.$apply();
            expect(changeLogRepository.get).toHaveBeenCalledWith('monthlyPivotTableData:' + projectId);
            expect(scope.lastUpdatedTimeForOpUnitReport).toEqual(moment(lastUpdatedTime).format(REPORTS_LAST_UPDATED_TIME_FORMAT));
        });

        it('should filter out opunit pivot tables from all pivot tables to get data', function() {
            var opUnitReportPivotTable = {
                id: 'somePivotTableId',
                opUnitReport: true
            };
            scope.$apply();
            expect(pivotTableRepository.getPivotTableData).toHaveBeenCalledWith(opUnitReportPivotTable, routeParams.opUnit);
            expect(scope.pivotTables).toEqual([mockPivotTableData]);
        });

        it('should filter out opunit pivot tables without data', function() {
            mockPivotTableData.isDataAvailable = false;
            scope.$apply();

            expect(scope.pivotTables).toEqual([]);
        });
    });
});