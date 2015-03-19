define(["approvalDataRepository", "angularMocks", "utils", "timecop", "moment"], function(ApprovalDataRepository, mocks, utils, timecop, moment) {
    describe("approval data repo", function() {
        var approvalDataRepository, q, scope;

        beforeEach(mocks.inject(function($injector) {
            q = $injector.get('$q');
            scope = $injector.get("$rootScope");
            thisMoment = moment("2014-01-03T00:00:00.000+0000");

            var mockDB = utils.getMockDB(q);
            db = mockDB.db;
            mockStore = mockDB.objectStore;

            Timecop.install();
            Timecop.freeze(thisMoment.toDate());

            approvalDataRepository = new ApprovalDataRepository(db);
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should save complete datasets", function() {
            var completeDataSetRegistrationList = [{
                "orgUnit": "ou1",
                "period": "2014W1",
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
            expect(mockStore.upsert.calls.argsFor(0)[0][0].period).toEqual("2014W01");
            expect(mockStore.upsert.calls.argsFor(0)[0][1].period).toEqual("2014W02");
        });

        it("should delete complete registrations", function() {
            approvalDataRepository.deleteLevelOneApproval("2014W1", "ou1");

            expect(db.objectStore).toHaveBeenCalledWith("completedDataSets");
            expect(mockStore.delete).toHaveBeenCalledWith(["2014W01", "ou1"]);
        });

        it("should delete approval", function() {
            approvalDataRepository.deleteLevelTwoApproval("2014W1", "ou1");

            expect(db.objectStore).toHaveBeenCalledWith("approvedDataSets");
            expect(mockStore.delete).toHaveBeenCalledWith(["2014W01", "ou1"]);
        });

        it("should save approvals", function() {
            var approvedDataSets = [{
                "orgUnit": "ou1",
                "period": "2014W1",
                "dataSets": ["d1", "d2", "d3"]
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "dataSets": ["d1", "d2", "d3"]
            }];

            approvalDataRepository.saveLevelTwoApproval(approvedDataSets);

            expect(db.objectStore).toHaveBeenCalledWith("approvedDataSets");

            expect(mockStore.upsert).toHaveBeenCalledWith(approvedDataSets);
            expect(mockStore.upsert.calls.argsFor(0)[0][0].period).toEqual("2014W01");
            expect(mockStore.upsert.calls.argsFor(0)[0][1].period).toEqual("2014W02");
        });

        it("should get level two approval data", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W05'
            }));

            approvalDataRepository.getLevelTwoApprovalData('2014W5', 'orgUnitId');

            expect(db.objectStore).toHaveBeenCalledWith("approvedDataSets");
            expect(mockStore.find).toHaveBeenCalledWith(['2014W05', 'orgUnitId']);
        });

        it("should get the filtered approval data", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W15',
                status: 'DELETED'
            }));

            approvalDataRepository.getLevelOneApprovalData('period', 'orgUnitId', true).then(function(data) {
                expect(data).toBeUndefined();
            });

            scope.$apply();
        });

        it("should get the approval data", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W05'
            }));

            approvalDataRepository.getLevelOneApprovalData('2014W5', 'orgUnitId');

            expect(db.objectStore).toHaveBeenCalledWith("completedDataSets");
            expect(mockStore.find).toHaveBeenCalledWith(['2014W05', 'orgUnitId']);
        });

        it("should get the complete data values", function() {
            var approvalData = {
                period: '2014W05'
            };
            mockStore.find.and.returnValue(utils.getPromise(q, approvalData));

            var actualApprovalData;
            approvalDataRepository.getLevelOneApprovalData('2014W5', 'orgUnitId', true).then(function(data) {
                actualApprovalData = data;
            });
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(['2014W05', 'orgUnitId']);
            expect(actualApprovalData).toEqual(approvalData);
        });

        it("should get the complete data values and filter out deleted approvals", function() {
            var approvalData;
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W05',
                "status": "DELETED"
            }));

            approvalDataRepository.getLevelOneApprovalData('2014W5', 'orgUnitId', true).then(function(data) {
                approvalData = data;
            });
            scope.$apply();
            expect(approvalData).toBe(undefined);
        });

        it("should unapprove data at level two", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W05'
            }));

            approvalDataRepository.unapproveLevelTwoData("2014W05", "orgUnitId");
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(["2014W05", "orgUnitId"]);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                period: '2014W05',
                "status": "DELETED",
                isApproved: false
            });
        });

        it("should unapprove data at level one", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W05'
            }));

            approvalDataRepository.unapproveLevelOneData("2014W5", "orgUnitId");
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(["2014W05", "orgUnitId"]);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                period: '2014W05',
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

        it("should get level two approval data by periods and orgunits", function() {
            mockStore.each.and.returnValue(utils.getPromise(q, [{
                "orgUnit": "ou1",
                "period": "2014W01",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": true,
                "isApproved": true
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }, {
                "orgUnit": "ou2",
                "period": "2014W02",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }, {
                "orgUnit": "ou3",
                "period": "2014W01",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }]));

            var actualDataValues;
            approvalDataRepository.getLevelTwoApprovalDataForPeriodsOrgUnits("2014W01", "2014W02", ["ou1", "ou2"]).then(function(approvalData) {
                actualDataValues = approvalData;
            });

            scope.$apply();

            expect(actualDataValues).toEqual([{
                "orgUnit": "ou1",
                "period": "2014W01",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": true,
                "isApproved": true
            }, {
                "orgUnit": "ou1",
                "period": "2014W02",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }, {
                "orgUnit": "ou2",
                "period": "2014W02",
                "createdByUsername": "testproj_approver_l1",
                "createdDate": "2014-01-03T00:00:00.000+0000",
                "dataSets": ["d1", "d2", "d3"],
                "isAccepted": false,
                "isApproved": true
            }]);
        });

        it("should mark as complete", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W1",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W1",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W2",
                "orgUnit": "Mod1"
            }];

            approvalDataRepository.markAsComplete(periodsAndOrgUnits, "user");

            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "storedBy": "user",
                "date": "2014-01-03T00:00:00.000Z",
                "status": "NEW"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "storedBy": "user",
                "date": "2014-01-03T00:00:00.000Z",
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "storedBy": "user",
                "date": "2014-01-03T00:00:00.000Z",
                "status": "NEW"
            }];

            expect(db.objectStore).toHaveBeenCalledWith("completedDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should mark as approved", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W1",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W1",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W2",
                "orgUnit": "Mod1"
            }];

            approvalDataRepository.markAsApproved(periodsAndOrgUnits, "user");

            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": false,
                "isApproved": true,
                "status": "NEW"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": false,
                "isApproved": true,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": false,
                "isApproved": true,
                "status": "NEW"
            }];

            expect(db.objectStore).toHaveBeenCalledWith("approvedDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should mark as accepted", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W1",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W1",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W2",
                "orgUnit": "Mod1"
            }];

            approvalDataRepository.markAsAccepted(periodsAndOrgUnits, "user");

            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": true,
                "isApproved": true,
                "status": "NEW"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": true,
                "isApproved": true,
                "status": "NEW"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": true,
                "isApproved": true,
                "status": "NEW"
            }];

            expect(db.objectStore).toHaveBeenCalledWith("approvedDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });

        it("should mark as not complete", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W1",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W1",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W2",
                "orgUnit": "Mod1"
            }];

            approvalDataRepository.markAsNotComplete(periodsAndOrgUnits, "user");

            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "storedBy": "user",
                "date": "2014-01-03T00:00:00.000Z",
                "status": "DELETED"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "storedBy": "user",
                "date": "2014-01-03T00:00:00.000Z",
                "status": "DELETED"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "storedBy": "user",
                "date": "2014-01-03T00:00:00.000Z",
                "status": "DELETED"
            }];

            expect(db.objectStore).toHaveBeenCalledWith("completedDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);

        });

        it("should mark as not approved", function() {
            var periodsAndOrgUnits = [{
                "period": "2014W1",
                "orgUnit": "Mod1"
            }, {
                "period": "2014W1",
                "orgUnit": "Mod2"
            }, {
                "period": "2014W2",
                "orgUnit": "Mod1"
            }];

            approvalDataRepository.markAsNotApproved(periodsAndOrgUnits, "user");

            var expectedUpserts = [{
                "period": "2014W01",
                "orgUnit": "Mod1",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": false,
                "isApproved": false,
                "status": "DELETED"
            }, {
                "period": "2014W01",
                "orgUnit": "Mod2",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": false,
                "isApproved": false,
                "status": "DELETED"
            }, {
                "period": "2014W02",
                "orgUnit": "Mod1",
                "createdByUsername": "user",
                "createdDate": "2014-01-03T00:00:00.000Z",
                "isAccepted": false,
                "isApproved": false,
                "status": "DELETED"
            }];

            expect(db.objectStore).toHaveBeenCalledWith("approvedDataSets");
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpserts);
        });


    });
});