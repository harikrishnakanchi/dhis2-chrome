define(["indicatorController", "angularMocks", "utils"], function(IndicatorController, mocks, utils) {

    describe("indicator controller", function() {

        var scope, q, indicatorRepo;

        beforeEach(mocks.inject(function($rootScope, $q) {
            scope = $rootScope.$new();
            q = $q;

            indicatorRepo = utils.getMockRepo(q);
            indicatorController = new IndicatorController(scope, indicatorRepo);
        }));
        
        it("should get all indicators on init", function() {
            expect(indicatorRepo.getAll).toHaveBeenCalled();
        });

    });
});
