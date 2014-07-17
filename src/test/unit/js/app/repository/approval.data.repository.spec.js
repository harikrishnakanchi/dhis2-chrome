define(["approvalDataRepository", "angularMocks", "utils", ], function(ApprovalDataRepository, mocks, utils) {
    describe("approval data repo", function() {
        var approvalDataRepository, q, scope;

        beforeEach(mocks.inject(function($injector) {
            q = $injector.get('$q');
            scope = $injector.get("$rootScope");

            var mockDB = utils.getMockDB(q);
            db = mockDB.db;
            mockStore = mockDB.objectStore;

            approvalDataRepository = new ApprovalDataRepository(db);
        }));

        it("should save complete datasets", function() {
            var completeDataSetRegistrationList = [{
                "orgUnit": "ou1",
                "period": "2014W01",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }];

            approvalDataRepository.saveLevelOneApproval(completeDataSetRegistrationList);

            expect(db.objectStore).toHaveBeenCalledWith("completedDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(completeDataSetRegistrationList);
        });


        it("should save approvals", function() {
            var approvedDataSets = [{
                "orgUnit": "ou1",
                "period": "2014W01",
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "dataSets": ["d1", "d2", "d3"]
            }];

            approvalDataRepository.saveLevelTwoApproval(approvedDataSets);

            expect(db.objectStore).toHaveBeenCalledWith("approvedDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(approvedDataSets);
        });

        it("should get level two approval data", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W15'
            }));

            approvalDataRepository.getLevelTwoApprovalData('period', 'orgUnitId');

            expect(db.objectStore).toHaveBeenCalledWith("approvedDataSets");
            expect(mockStore.find).toHaveBeenCalledWith(['period', 'orgUnitId']);
        });

        it("should get the approval data", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W15'
            }));

            approvalDataRepository.getLevelOneApprovalData('period', 'orgUnitId');

            expect(db.objectStore).toHaveBeenCalledWith("completedDataSets");
            expect(mockStore.find).toHaveBeenCalledWith(['period', 'orgUnitId']);
        });

        it("should get the complete data values", function() {
            var approvalData = {
                period: '2014W15'
            };
            mockStore.find.and.returnValue(utils.getPromise(q, approvalData));

            var actualApprovalData;
            approvalDataRepository.getCompleteDataValues('period', 'orgUnitId').then(function(data) {
                actualApprovalData = data;
            });
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(['period', 'orgUnitId']);
            expect(actualApprovalData).toEqual(approvalData);
        });

        it("should get the complete data values and filter out deleted approvals", function() {
            var approvalData;
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W15',
                "status": "DELETED"
            }));

            approvalDataRepository.getCompleteDataValues('period', 'orgUnitId').then(function(data) {
                approvalData = data;
            });
            scope.$apply();
            expect(approvalData).toBe(undefined);
        });

        it("should unapprove data at level one", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W15'
            }));

            approvalDataRepository.unapproveLevelOneData("period", "orgUnitId");
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(["period", "orgUnitId"]);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                period: '2014W15',
                "status": "DELETED"
            });
        });

        it("should not approve if data is not available for approval", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, undefined));

            approvalDataRepository.unapproveLevelOneData("period", "orgUnitId");
            scope.$apply();

            expect(mockStore.upsert).not.toHaveBeenCalled();
        });

        it("should get data values by periods and orgunits", function() {
            mockStore.each.and.returnValue(utils.getPromise(q, [{
                "orgUnit": "ou1",
                "period": "2014W01",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou3",
                "period": "2014W01",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }]));

            var actualDataValues;
            approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits("2014W01", "2014W02", ["ou1", "ou2"]).then(function(approvalData) {
                actualDataValues = approvalData;
            });

            scope.$apply();

            expect(actualDataValues).toEqual([{
                "orgUnit": "ou1",
                "period": "2014W01",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "storedBy": "testproj_approver_l1",
                "date": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"]
            }]);
        });

    });
});