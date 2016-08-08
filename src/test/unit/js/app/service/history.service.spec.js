define(['historyService', 'angularMocks'], function (HistoryService, mocks) {
    describe('HistoryService', function() {
        var location, historyService, mockPath, mockSearch;
        beforeEach(mocks.inject(function($location) {
            mockPath = '/path';
            mockSearch = { a: 1, b: 2};

            location = $location;
            spyOn(location, 'path').and.callFake(function (path) {
                return path ? location : mockPath;
            });
            spyOn(location, 'search').and.callFake(function (search) {
                return search ? location : mockSearch;
            });
            historyService = new HistoryService(location);
        }));

        it('should store current path and search state', function() {
            historyService.pushState();
            expect(location.search).toHaveBeenCalled();
            expect(location.path).toHaveBeenCalled();
        });

        it('should go back to last url', function() {
            historyService.pushState();
            historyService.back();
            expect(location.search).toHaveBeenCalledWith(mockSearch);
            expect(location.path).toHaveBeenCalledWith(mockPath);
        });

        it('should merge the search params to last url', function() {
            var searchParams = { c : 3};
            var expectedSearchParams = _.assign({}, mockSearch, searchParams);
            historyService.pushState();
            historyService.back( searchParams );
            expect(location.search).toHaveBeenCalledWith(expectedSearchParams);
        });

        it('should not go back any page if there is no pushed state', function() {
            historyService.back();
            expect(location.search).not.toHaveBeenCalled();
            expect(location.path).not.toHaveBeenCalled();
        });

        it('should accept custom search state and merge the search state', function() {
            var searchParams = { a : 2};
            var expectedSearchState = _.assign({}, mockSearch, searchParams);
            historyService.pushState( searchParams );
            historyService.back();
            expect(location.search).toHaveBeenCalledWith(expectedSearchState);
        });
    });
});