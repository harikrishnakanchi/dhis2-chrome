define(["lineListOfflineApprovalController", "angularMocks", "utils"],
    function(LineListOfflineApprovalController, mocks, utils) {
        describe("lineListOfflineApprovalController", function() {
            var lineListOfflineApprovalController, scope;

            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();

                lineListOfflineApprovalController = new LineListOfflineApprovalController(scope);
            }));

            it("should initialize", function() {
                expect(scope.message).toEqual("hi there, welcome to state of the art offline approval system.");
            });
        });
    });
