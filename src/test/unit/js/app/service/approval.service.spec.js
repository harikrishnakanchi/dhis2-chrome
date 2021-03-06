define(["approvalService", "angularMocks", "utils", "moment", "lodash", "properties", "dhisUrl"], function(ApprovalService, mocks, utils, moment, _, properties, dhisUrl) {
    describe("approval service", function() {
        var http, httpBackend, db, q, mockStore, dataSets, orgUnits, approvalService;

        beforeEach(mocks.inject(function($injector) {
            http = $injector.get('$http');
            q = $injector.get('$q');

            httpBackend = $injector.get('$httpBackend');

            var mockDB = utils.getMockDB(q);
            db = mockDB.db;
            mockStore = mockDB.objectStore;
            dataSets = ["d1", "d2"];
            orgUnits = ["ou1", "ou2"];

            approvalService = new ApprovalService(http, db, q);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should mark data as complete in dhis", function() {
            var _Date = Date;
            spyOn(window, 'Date').and.returnValue(new _Date("2014-05-30T12:43:54.972Z"));

            var expectedPayload = [{
                "ds": "170b8cd5e53",
                "pe": "2014W01",
                "ou": "17yugc",
                "sb": "testproj_approver_l1",
                "cd": "2014-05-30T12:43:54.972Z",
                "multiOu": true
            }, {
                "ds": "wqeb8cd5e53",
                "pe": "2014W01",
                "ou": "17yugc",
                "sb": "testproj_approver_l1",
                "cd": "2014-05-30T12:43:54.972Z",
                "multiOu": true
            }, {
                "ds": "170b8cd5e53",
                "pe": "2014W02",
                "ou": "17yugc",
                "sb": "testproj_approver_l1",
                "cd": "2014-05-30T12:43:54.972Z",
                "multiOu": true
            }, {
                "ds": "wqeb8cd5e53",
                "pe": "2014W02",
                "ou": "17yugc",
                "sb": "testproj_approver_l1",
                "cd": "2014-05-30T12:43:54.972Z",
                "multiOu": true
            }];

            httpBackend.expectPOST(dhisUrl.approvalMultipleL1, expectedPayload).respond(200, "ok");

            var periodsAndOrgUnits = [{
                "period": "2014W01",
                "orgUnit": "17yugc"
            }, {
                "period": "2014W02",
                "orgUnit": "17yugc"
            }];

            approvalService.markAsComplete(["170b8cd5e53", "wqeb8cd5e53"], periodsAndOrgUnits, "testproj_approver_l1", moment().toISOString());
            httpBackend.flush();
        });

        it('should mark data as approved in dhis', function () {
            var orgUnitIdA = 'orgUnitA', orgUnitIdB = 'orgUnitB', periods = ['2016W31'];

            var expectedPayload = {
                pe: periods,
                ds: dataSets,
                approvals: [{
                    ou: orgUnitIdA
                }, {
                    ou: orgUnitIdB
                }
                ]
            };

            httpBackend.expectPOST(dhisUrl.approvalMultipleL2, expectedPayload).respond(200, 'ok');

            approvalService.markAsApproved(dataSets, periods, [orgUnitIdA, orgUnitIdB]);

            httpBackend.flush();
        });

        describe('getCompletionData', function () {
            var createMockDhisCompletionData = function(options) {
                return _.merge({
                    dataSet: {
                        id: 'someDataSetId'
                    },
                    period: {
                        id: '2016W23'
                    },
                    organisationUnit: {
                        id: 'ou1'
                    },
                    storedBy: "ss153_medref",
                    date: "2016-04-19T00:53:52.972+0000"
                }, options);
            };

            it('should download completion data for specified org units and data sets', function() {
                var expectedStartDate = moment().subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD"),
                    expectedEndDate = moment().format("YYYY-MM-DD"),
                    dataSetId = 'someDataSetId',
                    orgUnitId = 'someOrgUnitId',
                    originOrgUnits = [];

                httpBackend.expectGET(dhisUrl.approvalL1 +
                    "?children=" +  true +
                    "&dataSet=" + dataSetId +
                    "&endDate=" + expectedEndDate +
                    "&fields=period%5Bid%5D,organisationUnit%5Bid,name%5D,storedBy,dataSet%5Bid,name%5D,date" +
                    "&orgUnit=" + orgUnitId +
                    "&startDate=" + expectedStartDate
                ).respond(200, {});

                approvalService.getCompletionData([orgUnitId], originOrgUnits, [dataSetId]);
                httpBackend.flush();
            });

            it("should get completion data for specified period range", function() {
                var periodRange = ["2014W01", "2014W02", "2014W05"],
                    expectedStartDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                    expectedEndDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD'),
                    dataSetId = 'someDataSetId',
                    orgUnitId = 'someOrgUnitId',
                    originOrgUnits = [];

                httpBackend.expectGET(new RegExp('endDate=' + expectedEndDate + '.*startDate=' + expectedStartDate)).respond(200, {});

                approvalService.getCompletionData([orgUnitId], originOrgUnits, [dataSetId], periodRange);

                httpBackend.flush();
            });

            it('should return a completion object', function () {
                var mockDhisCompletion = createMockDhisCompletionData();

                httpBackend.expectGET(/.*/).respond(200, { completeDataSetRegistrations: [mockDhisCompletion] });

                approvalService.getCompletionData().then(function(serviceResponse) {
                    expect(_.first(serviceResponse)).toEqual({
                        period: mockDhisCompletion.period.id,
                        orgUnit: mockDhisCompletion.organisationUnit.id,
                        completedBy: mockDhisCompletion.storedBy,
                        completedOn: mockDhisCompletion.date,
                        isComplete: true
                    });
                });
                httpBackend.flush();
            });

            it('should get completion data for parent orgUnit when origin orgUnits is given', function() {
                var originOrgunits = [{
                    "id": "someOriginOrgUnitId",
                    "parent": {
                        "id": "someModuleId"
                    }
                }];

                var mockDhisCompletionA = createMockDhisCompletionData({ organisationUnit: { id: 'someOriginOrgUnitId' } }),
                    mockDhisCompletionB = createMockDhisCompletionData({ organisationUnit: { id: 'someModuleId' } }),
                    mockDhisCompletionC = createMockDhisCompletionData({ organisationUnit: { id: 'someOtherModuleId' } });

                httpBackend.expectGET(/.*/).respond(200, { completeDataSetRegistrations: [mockDhisCompletionA, mockDhisCompletionB, mockDhisCompletionC] });

                approvalService.getCompletionData([], originOrgunits).then(function(serviceResponse) {
                    expect(serviceResponse[0].orgUnit).toEqual('someModuleId');
                    expect(serviceResponse[1].orgUnit).toEqual('someOtherModuleId');
                });
                httpBackend.flush();
            });

            it('should format the period in the completion object', function() {
                var mockDhisCompletion = createMockDhisCompletionData({ period: { id: '2016W2' } });

                httpBackend.expectGET(/.*/).respond(200, { completeDataSetRegistrations: [mockDhisCompletion] });

                approvalService.getCompletionData().then(function(serviceResponse) {
                    expect(_.first(serviceResponse).period).toEqual('2016W02');
                });
                httpBackend.flush();
            });

            it('should return an empty array if there are no completeDataSetRegistrations', function () {
                var mockDhisCompletion = createMockDhisCompletionData();

                httpBackend.expectGET(/.*/).respond(200, {});

                approvalService.getCompletionData().then(function(serviceResponse) {
                    expect(serviceResponse).toEqual([]);
                });
                httpBackend.flush();
            });

            it("should return a failure http promise if download completion data fails", function() {
                httpBackend.expectGET().respond(500, {});

                var status;
                approvalService.getCompletionData().then(undefined, function(data) {
                    status = data.status;
                });

                httpBackend.flush();

                expect(status).toBe(500);
            });
        });

        describe('getApprovalData', function() {
            var createMockDhisApproval = function(options) {
                return _.merge({
                    dataSet: {
                        id: 'someDataSetId'
                    },
                    period: {
                        id: '2016W23'
                    },
                    organisationUnit: {
                        id: 'ou1'
                    },
                    state: 'APPROVED_HERE',
                    createdByUsername: 'msfadmin',
                    createdDate: '2014-07-21T12:08:05.311+0000'
                }, options);
            };

            it('should download approval data for specified org units and data sets', function() {
                var expectedStartDate = moment().subtract(properties.projectDataSync.numWeeksToSync, "week").format("YYYY-MM-DD"),
                    expectedEndDate = moment().format("YYYY-MM-DD"),
                    dataSetId = 'someDataSetId',
                    orgUnitId = 'someOrgUnitId';

                httpBackend.expectGET(dhisUrl.approvalStatus +
                    "?ds=" + dataSetId +
                    "&endDate=" + expectedEndDate +
                    "&fields=dataSet%5Bid,name%5D,period%5Bid%5D,organisationUnit%5Bid,name%5D,state,createdByUsername,createdDate" +
                    "&ou=" + orgUnitId +
                    "&pe=Weekly" +
                    "&startDate=" + expectedStartDate
                ).respond(200, {});

                approvalService.getApprovalData([orgUnitId], [dataSetId]);
                httpBackend.flush();
            });

            it("should get approval data for specified period range", function() {
                var periodRange = ["2014W01", "2014W02", "2014W05"],
                    expectedStartDate = moment(_.first(periodRange), 'GGGG[W]WW').startOf('isoWeek').format('YYYY-MM-DD'),
                    expectedEndDate = moment(_.last(periodRange), 'GGGG[W]WW').endOf('isoWeek').format('YYYY-MM-DD');

                httpBackend.expectGET(new RegExp('endDate=' + expectedEndDate + '.*startDate=' + expectedStartDate)).respond(200, {});

                approvalService.getApprovalData(orgUnits, dataSets, periodRange);

                httpBackend.flush();
            });

            it('should return an approval object', function () {
                var mockDhisApproval = createMockDhisApproval();

                httpBackend.expectGET(/.*/).respond(200, { dataApprovalStateResponses: [mockDhisApproval] });

                approvalService.getApprovalData(orgUnits, dataSets).then(function(serviceResponse) {
                    expect(_.first(serviceResponse)).toEqual({
                        period: mockDhisApproval.period.id,
                        orgUnit: mockDhisApproval.organisationUnit.id,
                        approvedBy: mockDhisApproval.createdByUsername,
                        approvedOn: mockDhisApproval.createdDate,
                        isApproved: true
                    });
                });
                httpBackend.flush();
            });

            it('should format the period in the approval object', function() {
                var mockDhisApproval = createMockDhisApproval({ period: { id: '2016W1' } });

                httpBackend.expectGET(/.*/).respond(200, { dataApprovalStateResponses: [mockDhisApproval] });

                approvalService.getApprovalData(orgUnits, dataSets).then(function(serviceResponse) {
                    expect(_.first(serviceResponse).period).toEqual('2016W01');
                });
                httpBackend.flush();
            });

            it('should return an approval object if state is ACCEPTED_HERE', function () {
                var mockDhisApproval = createMockDhisApproval({ state: 'ACCEPTED_HERE' });

                httpBackend.expectGET(/.*/).respond(200, { dataApprovalStateResponses: [mockDhisApproval] });

                approvalService.getApprovalData(orgUnits, dataSets).then(function(serviceResponse) {
                    expect(serviceResponse.length).toEqual(1);
                });
                httpBackend.flush();
            });

            it('should return an approval object if state is APPROVED_HERE', function () {
                var mockDhisApproval = createMockDhisApproval({ state: 'APPROVED_HERE' });

                httpBackend.expectGET(/.*/).respond(200, { dataApprovalStateResponses: [mockDhisApproval] });

                approvalService.getApprovalData(orgUnits, dataSets).then(function(serviceResponse) {
                    expect(serviceResponse.length).toEqual(1);
                });
                httpBackend.flush();
            });

            it('should return an approval object if state is APPROVED_ABOVE', function () {
                var mockDhisApproval = createMockDhisApproval({ state: 'APPROVED_ABOVE' });

                httpBackend.expectGET(/.*/).respond(200, { dataApprovalStateResponses: [mockDhisApproval] });

                approvalService.getApprovalData(orgUnits, dataSets).then(function(serviceResponse) {
                    expect(serviceResponse.length).toEqual(1);
                });
                httpBackend.flush();
            });

            it('should not return an approval object if state is any other value', function () {
                var mockDhisApproval = createMockDhisApproval({ state: 'SOME_OTHER_STATE' });

                httpBackend.expectGET(/.*/).respond(200, { dataApprovalStateResponses: [mockDhisApproval] });

                approvalService.getApprovalData(orgUnits, dataSets).then(function(serviceResponse) {
                    expect(serviceResponse).toEqual([]);
                });
                httpBackend.flush();
            });

            it("should not return an approval object if any of the approval states are not one of the required values", function() {
                httpBackend.expectGET(/.*/).respond(200, {
                    dataApprovalStateResponses: [
                        createMockDhisApproval({ state: 'APPROVED_HERE' }),
                        createMockDhisApproval({ state: 'SOME_OTHER_STATE' })
                    ]
                });

                approvalService.getApprovalData(orgUnits, dataSets).then(function(serviceResponse) {
                    expect(serviceResponse).toEqual([]);
                });
                httpBackend.flush();
            });

            it('should return an empty array if there are no dataApprovalStateResponses', function () {
                var mockDhisApproval = createMockDhisApproval({ state: 'SOME_OTHER_STATE' });

                httpBackend.expectGET(/.*/).respond(200, {});

                approvalService.getApprovalData(orgUnits, dataSets).then(function(serviceResponse) {
                    expect(serviceResponse).toEqual([]);
                });
                httpBackend.flush();
            });

            it("should return a failure http promise if download approval data fails", function() {
                httpBackend.expectGET().respond(500, {});

                var status;
                approvalService.getApprovalData(orgUnits, dataSets).then(undefined, function(data) {
                    status = data.status;
                });

                httpBackend.flush();

                expect(status).toBe(500);
            });
        });

        it("should mark data as incomplete in dhis", function() {
            httpBackend.expectDELETE(dhisUrl.approvalL1 + "?ds=170b8cd5e53&multiOu=true&ou=orgUnit1&pe=2014W01")
                .respond(200, "ok");
            httpBackend.expectDELETE(dhisUrl.approvalL1 + "?ds=170b8cd5e53&multiOu=true&ou=orgUnit2&pe=2014W02")
                .respond(200, "ok");

            approvalService.markAsIncomplete(["170b8cd5e53"], [{"period": "2014W01", "orgUnit": "orgUnit1"},{"period": "2014W02", "orgUnit": "orgUnit2"}]);

            httpBackend.flush();
        });

        describe('markAsUnapproved', function () {
            var approvalStatusForOrgUnitAForDataSetA, approvalStatusForOrgUnitAForDataSetB, approvalStatusForOrgUnitBForDataSetA, periodAndOrgUnitA, periodAndOrgUnitB;
            var mockDataApprovalStateResponse = function (mayUnApprove, dataSetId) {
                return {
                    "dataSet": {id: dataSetId},
                    "permissions": {
                        "mayUnapprove": mayUnApprove
                    }
                };
            };

            beforeEach(function () {
                approvalStatusForOrgUnitAForDataSetA = mockDataApprovalStateResponse(true, "dataSetIdA");
                periodAndOrgUnitA = {"period": "2014W01", "orgUnit": "orgUnitA"};
                periodAndOrgUnitB = {"period": "2014W02", "orgUnit": "orgUnitB"};
            });

            it("should mark data as unapproved in dhis if mayUnapprove permission exists", function() {
                approvalStatusForOrgUnitAForDataSetB = mockDataApprovalStateResponse(true, "dataSetIdB");
                var dataApprovalStateResponsesForOrgUnitA = {
                    dataApprovalStateResponses: [approvalStatusForOrgUnitAForDataSetA, approvalStatusForOrgUnitAForDataSetB]
                };

                var expectedPayloadForOrgUnitA = {
                    "ds": ['dataSetIdA', 'dataSetIdB'],
                    "pe": ['2014W01'],
                    "approvals": [{"ou": "orgUnitA"}]
                };

                var expectedPayloadForOrgUnitB = {
                    "ds": ['dataSetIdA'],
                    "pe": ['2014W02'],
                    "approvals": [{"ou": "orgUnitB"}]
                };

                approvalStatusForOrgUnitBForDataSetA = mockDataApprovalStateResponse(true, 'dataSetIdA');
                var dataApprovalStateResponsesForOrgUnitB = {
                    dataApprovalStateResponses: [approvalStatusForOrgUnitBForDataSetA]
                };

                httpBackend.expectGET(dhisUrl.approvalStatus + "?ds=dataSetIdA&ds=dataSetIdB&endDate=2014-01-05&ou=orgUnitA&pe=Weekly&startDate=2013-12-30")
                    .respond(200, dataApprovalStateResponsesForOrgUnitA);
                httpBackend.expectGET(dhisUrl.approvalStatus + "?ds=dataSetIdA&ds=dataSetIdB&endDate=2014-01-12&ou=orgUnitB&pe=Weekly&startDate=2014-01-06")
                    .respond(200, dataApprovalStateResponsesForOrgUnitB);
                httpBackend.expectPOST(dhisUrl.unApprovals, expectedPayloadForOrgUnitA).respond(200, "ok");
                httpBackend.expectPOST(dhisUrl.unApprovals, expectedPayloadForOrgUnitB).respond(200, "ok");

                approvalService.markAsUnapproved(["dataSetIdA", "dataSetIdB"], [periodAndOrgUnitA, periodAndOrgUnitB]);

                httpBackend.flush();
            });

            it('should not include datasetIds that are not approved at DHIS in payload', function () {
                approvalStatusForOrgUnitAForDataSetB = mockDataApprovalStateResponse(false, "dataSetIdB");
                var dataApprovalStateResponsesForOrgUnitA = {
                    dataApprovalStateResponses: [approvalStatusForOrgUnitAForDataSetA, approvalStatusForOrgUnitAForDataSetB]
                };

                var expectedPayloadForOrgUnitA = {
                    "ds": ['dataSetIdA'],
                    "pe": ['2014W01'],
                    "approvals": [{"ou": "orgUnitA"}]
                };

                httpBackend.expectGET(dhisUrl.approvalStatus + "?ds=dataSetIdA&ds=dataSetIdB&endDate=2014-01-05&ou=orgUnitA&pe=Weekly&startDate=2013-12-30")
                    .respond(200, dataApprovalStateResponsesForOrgUnitA);
                httpBackend.expectPOST(dhisUrl.unApprovals, expectedPayloadForOrgUnitA).respond(200, "ok");

                approvalService.markAsUnapproved(["dataSetIdA", "dataSetIdB"], [periodAndOrgUnitA]);

                httpBackend.flush();
            });

        });
    });
});
