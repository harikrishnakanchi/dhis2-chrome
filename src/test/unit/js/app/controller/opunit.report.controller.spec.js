define(['moment', 'timecop', 'angularMocks', 'utils', 'orgUnitRepository', 'changeLogRepository', 'opunitReportController'],
    function (moment, timecop, mocks, utils, OrgUnitRepository, ChangeLogRepository, OpunitReportController) {
    var scope, q, routeParams, rootScope, mockOpUnit, lastUpdatedTime, currentTime,
        orgUnitRepository, changeLogRepository, opunitReportController;
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

            currentTime = moment('2015-10-29T12:43:54.972Z');
            Timecop.install();
            Timecop.freeze(currentTime);
            lastUpdatedTime = '2015-10-28T12:43:54.972Z';

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'get').and.returnValue(utils.getPromise(q, mockOpUnit));
            
            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, lastUpdatedTime));
            
            opunitReportController = new OpunitReportController(rootScope, q, scope, routeParams, orgUnitRepository, changeLogRepository);
        }));
        
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

    });
});