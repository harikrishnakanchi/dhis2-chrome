define(['historyHelper', 'angularMocks'], function (HistoryHelper, mocks) {
    describe('HistoryHelper', function() {
        var location, historyHelper, mockPath, mockSearch;
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
            historyHelper = new HistoryHelper(location);
        }));

        it('should store current path and search state', function() {
            historyHelper.pushState();
            expect(location.search).toHaveBeenCalled();
            expect(location.path).toHaveBeenCalled();
        });

        it('should go back to last url', function() {
            historyHelper.pushState();
            historyHelper.back();
            expect(location.search).toHaveBeenCalledWith(mockSearch);
            expect(location.path).toHaveBeenCalledWith(mockPath);
        });

        it('should not go back any page if there is no pushed state', function() {
            historyHelper.back();
            expect(location.search).not.toHaveBeenCalled();
            expect(location.path).not.toHaveBeenCalled();
        });

        it('should accept custom search state and merge the search state', function() {
            var searchParams = { a : 2};
            var expectedSearchState = _.assign({}, mockSearch, searchParams);
            historyHelper.pushState( searchParams );
            historyHelper.back();
            expect(location.search).toHaveBeenCalledWith(expectedSearchState);
        });
    });
});