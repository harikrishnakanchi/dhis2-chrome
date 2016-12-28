define(['angularMocks', 'utils', 'pagingUtils'], function (mocks, utils, pagingUtils) {
    describe('httpBackendUtils', function () {
        var q;

        beforeEach(mocks.inject(function($injector, $q) {
            q = $q;
        }));

        it('should callback for each page in response', function() {
            var mockCallBack = jasmine.createSpy('mockCallBack').and.returnValue(utils.getPromise(q, {pager: {pageCount: 3}, data:['someData']}));
            var mockParams = {}, maxPageRequests = 5, responses = [];

            pagingUtils.paginateRequest(mockCallBack, mockParams, maxPageRequests, responses).then(function () {
                expect(mockCallBack).toHaveBeenCalledTimes(3);
            });
        });

        it('should not make more than the configured number of recursive requests', function() {
            var mockCallBack = jasmine.createSpy('mockCallBack').and.returnValue(utils.getPromise(q, {pager: {pageCount: 99}, data:['someData']}));

            var mockParams = {}, maxPageRequests = 70, responses = [];

            pagingUtils.paginateRequest(mockCallBack, mockParams, maxPageRequests, responses).then(function () {
                expect(mockCallBack).toHaveBeenCalledTimes(70);
            });
        });

        it('should not make any further requests if events response is empty', function() {
            var mockCallBack = jasmine.createSpy('mockCallBack').and.returnValue(utils.getPromise(q, {pager: {pageCount: 99}, data:[]}));

            var mockParams = {}, maxPageRequests = 5, responses = [];

            pagingUtils.paginateRequest(mockCallBack, mockParams, maxPageRequests, responses).then(function () {
                expect(mockCallBack).toHaveBeenCalledTimes(1);
            });
        });
    });
});
