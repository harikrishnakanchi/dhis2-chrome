define(["opUnitController", "angularMocks"], function(OpUnitController, mocks) {
    describe("op unit controller", function() {

        var scope, opUnitController;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();
            opUnitController = new OpUnitController(scope);
        }));

        it('should add new op units', function() {
            scope.$apply();
            var orginalOpUnitLen = scope.opUnits.length;
            scope.addOpUnits();
            expect(scope.opUnits.length).toBe(orginalOpUnitLen + 1);
        });

        it('should save operation units successfully', function() {
            scope.$apply();

            scope.save();
        });

        it('should delete operation unit', function() {
            scope.opUnits = [{
                'name': 'opUnit1'
            }, {
                'name': 'opUnit2'
            }, {
                'name': 'opUnit1'
            }, {
                'name': 'opUnit4'
            }]
            scope.$apply();

            scope.delete(2);
            expect(scope.opUnits).toEqual([{
                'name': 'opUnit1'
            }, {
                'name': 'opUnit2'
            }, {
                'name': 'opUnit4'
            }]);

        })
    });
});