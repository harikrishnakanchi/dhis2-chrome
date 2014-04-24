/*global Date:true*/
define(["opUnitController", "angularMocks", "utils"], function(OpUnitController, mocks, utils) {
    describe("op unit controller", function() {

        var scope, opUnitController, projectsService, mockOrgStore, db, q, location, _Date;

        beforeEach(mocks.inject(function($rootScope, $q, $location) {
            scope = $rootScope.$new();
            q = $q;
            location = $location;

            projectsService = {
                "create": function() {}
            };
            mockOrgStore = {
                upsert: function() {}
            };
            db = {
                objectStore: function(store) {
                    return mockOrgStore;
                }
            };

            _Date = Date;
            todayStr = "2014-04-01";
            today = new Date(todayStr);
            Date = function() {
                return today;
            };

            opUnitController = new OpUnitController(scope, projectsService, db, location);
        }));

        afterEach(function() {
            Date = _Date;
        });

        it('should add new op units', function() {
            scope.$apply();
            var orginalOpUnitLen = scope.opUnits.length;
            scope.addOpUnits();
            expect(scope.opUnits.length).toBe(orginalOpUnitLen + 1);
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
            }];
            scope.$apply();

            scope.delete(2);
            expect(scope.opUnits).toEqual([{
                'name': 'opUnit1'
            }, {
                'name': 'opUnit2'
            }, {
                'name': 'opUnit4'
            }]);

        });

        it('should save operation units', function() {
            var opUnit1Id = '70c075414b8';
            var opUnit2Id = '62dbceaaf89';
            var opUnit1 = {
                'name': 'OpUnit1',
                'type': 'Hospital',
                'openingDate': today
            };
            var opUnit2 = {
                'name': 'OpUnit2',
                'type': 'Community',
                'openingDate': today
            };
            var opUnits = [opUnit1, opUnit2];

            scope.orgUnit = {
                'level': 4,
                'name': 'Parent',
                'id': 'ParentId'
            };

            spyOn(mockOrgStore, 'upsert').and.returnValue(utils.getPromise(q, [opUnit1Id, opUnit2Id]));
            spyOn(location, 'hash');

            spyOn(projectsService, 'create').and.returnValue(utils.getPromise(q, {}));

            scope.save(opUnits);
            scope.$apply();

            var expectedOpUnits = [{
                id: opUnit1Id,
                name: opUnit1.name,
                shortName: opUnit1.name,
                openingDate: today,
                level: 5,
                parent: {
                    id: scope.orgUnit.id,
                    name: scope.orgUnit.name
                },
                attributeValues: [{
                    attribute: {
                        name: "Type",
                        id: "TypeAttr"
                    },
                    value: opUnit1.type
                }]
            }, {
                id: opUnit2Id,
                name: opUnit2.name,
                shortName: opUnit2.name,
                openingDate: today,
                level: 5,
                parent: {
                    id: scope.orgUnit.id,
                    name: scope.orgUnit.name
                },
                attributeValues: [{
                    attribute: {
                        name: "Type",
                        id: "TypeAttr"
                    },
                    value: opUnit2.type
                }]
            }];

            expect(projectsService.create).toHaveBeenCalledWith(expectedOpUnits);
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(expectedOpUnits);
            expect(location.hash).toHaveBeenCalledWith([opUnit1Id, opUnit2Id]);
        });

        it('operation units save should fail if service gives some error', function() {
            var opUnit1Id = '70c075414b8';

            var opUnit1 = {
                'name': 'OpUnit1',
                'type': 'Hospital',
                'openingDate': today
            };

            var opUnits = [opUnit1];

            scope.orgUnit = {
                'level': 4,
                'name': 'Parent',
                'id': 'ParentId'
            };

            spyOn(projectsService, 'create').and.returnValue(utils.getRejectedPromise(q, {}));

            scope.save(opUnits);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });

        it('operation units save should fail if save to db fails', function() {
            var opUnit1Id = '70c075414b8';
            var opUnit1 = {
                'name': 'OpUnit1',
                'type': 'Hospital',
                'openingDate': today
            };
            var opUnits = [opUnit1];

            scope.orgUnit = {
                'level': 4,
                'name': 'Parent',
                'id': 'ParentId'
            };

            spyOn(mockOrgStore, 'upsert').and.returnValue(utils.getRejectedPromise(q, {}));

            spyOn(projectsService, 'create').and.returnValue(utils.getPromise(q, {}));

            scope.save(opUnits);
            scope.$apply();

            expect(scope.saveFailure).toEqual(true);
        });
    });
});