define(["lineListDataEntryController", "angularMocks", "utils", "programRepository"], function(LineListDataEntryController, mocks, utils, ProgramRepository) {
    describe("lineListDataEntryController ", function() {

        var scope, q, hustle, programRepository, mockDB, mockStore;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;

            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            programRepository = new ProgramRepository();
        }));

        it("should load programs into scope on init", function() {
            var programAndStageData = {
                'id': 'p1'
            };
            spyOn(programRepository, "getProgramAndStages").and.returnValue(utils.getPromise(q, programAndStageData));

            scope.programsInCurrentModule = ['p1'];
            var lineListDataEntryController = new LineListDataEntryController(scope, q, mockDB.db, programRepository);
            scope.$apply();

            expect(programRepository.getProgramAndStages).toHaveBeenCalledWith('p1');
            expect(scope.programs).toEqual([programAndStageData]);
        });

        it("should load all optionSets to scope on init", function() {
            var optionSets = [{
                'id': 'os1'
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, optionSets));

            var lineListDataEntryController = new LineListDataEntryController(scope, q, mockDB.db, programRepository);
            scope.$apply();

            expect(scope.optionSets).toBe(optionSets);
        });

        it("should find optionSets for id", function() {
            var optionSets = [{
                'id': 'os1',
                'options': [{
                    'id': 'os1o1'
                }]
            }, {
                'id': 'os2',
                'options': [{
                    'id': 'os2o1'
                }]
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, optionSets));

            var lineListDataEntryController = new LineListDataEntryController(scope, q, mockDB.db, programRepository);
            scope.$apply();

            expect(scope.getOptionsFor('os2')).toEqual([{
                'id': 'os2o1'
            }]);
        });

        it("should update dataValues with new program and stage if not present", function() {
            var dataValues = {};

            var lineListDataEntryController = new LineListDataEntryController(scope, q, mockDB.db, programRepository);
            scope.$apply();

            scope.getNgModelFor(dataValues, 'p1', 'ps1');

            expect(dataValues).toEqual({
                'p1': {
                    'ps1': {}
                }
            });
        });

        it("should change dataValues", function() {
            var dataValues = {
                'p1': {
                    'ps1': {}
                }
            };

            var lineListDataEntryController = new LineListDataEntryController(scope, q, mockDB.db, programRepository);
            scope.$apply();

            scope.getNgModelFor(dataValues, 'p1', 'ps2');

            expect(dataValues).toEqual({
                'p1': {
                    'ps1': {},
                    'ps2': {}
                }
            });
        });
    });
});