/*global Date:true*/
define(["orgUnitContoller", "angularMocks", "utils", "lodash"], function(OrgUnitController, mocks, utils, _) {
    xdescribe("projects controller", function() {
        var q, db, scope, mockOrgStore, mockOrgUnitLevelStore, allOrgUnits,
            orgUnitContoller, parent, location, today, _Date, todayStr, timeout, anchorScroll;
        var getOrgUnit = function(id, name, level, parent) {
            return {
                'id': id,
                'name': name,
                'level': level,
                'parent': parent
            };
        };

        var orgUnitLevels = [{
            'level': 1,
            'name': 'Company'
        }, {
            'level': 2,
            'name': 'Operational Center'
        }, {
            'level': 3,
            'name': 'Country'
        }, {
            'level': 4,
            'name': 'Project'
        }, {
            'level': 5,
            'name': 'Operation Unit / Module'
        }, {
            'level': 6,
            'name': 'Module / Dataset'
        }, {
            'level': 7,
            'name': 'Dataset'
        }];

        var child = {
            'id': 2,
            'name': 'ocp',
            'level': 2,
            'parent': {
                id: 1
            },
            'children': [],
            'collapsed': 'true'
        };

        var expectedOrgUnitTree = [{
            'id': 1,
            'name': 'msf',
            'level': 1,
            'parent': null,
            'children': [child],
            'collapsed': 'true'
        }];

        beforeEach(mocks.inject(function($rootScope, $q, $location, $timeout, $anchorScroll) {
            q = $q;
            allOrgUnits = [getOrgUnit(1, 'msf', 1, null), getOrgUnit(2, 'ocp', 2, {
                id: 1
            })];
            scope = $rootScope.$new();
            location = $location;
            timeout = $timeout;
            mockOrgStore = {
                getAll: function() {},
                upsert: function() {}
            };
            mockOrgUnitLevelStore = {
                getAll: function() {}
            };
            var stores = {
                "organisationUnits": mockOrgStore,
                "organisationUnitLevels": mockOrgUnitLevelStore
            };
            db = {
                objectStore: function(store) {
                    return stores[store];
                }
            };

            spyOn(mockOrgStore, 'getAll').and.returnValue(utils.getPromise(q, allOrgUnits));
            spyOn(mockOrgUnitLevelStore, 'getAll').and.returnValue(utils.getPromise(q, orgUnitLevels));
            _Date = Date;
            todayStr = "2014-04-01";
            today = new Date(todayStr);
            Date = function() {
                return today;
            };

            parent = {
                'level': 1,
                'name': 'Name1',
                'id': 'Id1'
            };
            anchorScroll = jasmine.createSpy();
            orgUnitContoller = new OrgUnitController(scope, db, q, location, timeout, anchorScroll);
        }));

        afterEach(function() {
            Date = _Date;
        });

        it("should fetch and display all organisation units", function() {
            spyOn(scope, 'onOrgUnitSelect');

            scope.$apply();

            expect(mockOrgStore.getAll).toHaveBeenCalled();
            expect(scope.organisationUnits).toEqual(expectedOrgUnitTree);
            expect(scope.onOrgUnitSelect).not.toHaveBeenCalled();
            expect(scope.state).toEqual(undefined);
        });

        it("should fetch and select the newly created organization unit", function() {
            spyOn(location, 'hash').and.returnValue([2, 1]);
            orgUnitContoller = new OrgUnitController(scope, db, q, location, timeout, anchorScroll);
            spyOn(scope, 'onOrgUnitSelect');
            var child = {
                id: 2,
                name: 'ocp',
                level: 2,
                parent: {
                    id: 1
                },
                children: [],
                selected: true
            };

            scope.$apply();

            child.selected = true;
            expect(scope.onOrgUnitSelect).toHaveBeenCalledWith(child);
            expect(scope.state).toEqual({
                currentNode: child
            });
            expect(scope.saveSuccess).toEqual(true);
        });

        it("should display a timed message after creating a organization unit", function() {
            spyOn(location, 'hash').and.returnValue([1, 2]);
            orgUnitContoller = new OrgUnitController(scope, db, q, location, timeout, anchorScroll);
            spyOn(scope, 'onOrgUnitSelect');

            scope.$apply();

            expect(scope.saveSuccess).toEqual(true);
            timeout.flush();
            expect(scope.saveSuccess).toEqual(false);
        });

        it("should get organization unit level mapping", function() {
            scope.$apply();

            expect(mockOrgUnitLevelStore.getAll).toHaveBeenCalled();
            expect(scope.orgUnitLevelsMap).toEqual({
                1: 'Company',
                2: 'Operational Center',
                3: 'Country',
                4: 'Project',
                5: 'Operation Unit / Module',
                6: 'Module / Dataset',
                7: 'Dataset'
            });
        });

        it("should show the selected organisation unit details", function() {
            var orgUnit = {
                'id': 1,
                'level': 1
            };
            scope.$apply();
            scope.onOrgUnitSelect(orgUnit);

            expect(scope.orgUnit).toEqual(orgUnit);
        });

        it("should set the organization unit", function() {
            var orgUnit = {
                'id': 1,
                'level': 1
            };
            spyOn(location, 'hash');
            scope.$apply();
            scope.onOrgUnitSelect(orgUnit);

            expect(location.hash).toHaveBeenCalled();
            expect(scope.orgUnit).toEqual(orgUnit);
            expect(anchorScroll).toHaveBeenCalled();
        });


        it("should set template url for module", function() {
            var orgUnit = {
                'id': 'something',
                'level': 4
            };

            scope.$apply();
            scope.setTemplateUrl(orgUnit, true, 2);
            expect(scope.templateUrl).toContain('templates/partials/module-form.html');
            expect(scope.isEditMode).toEqual(true);
        });

    });
});