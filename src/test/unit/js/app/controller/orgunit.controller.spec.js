/*global Date:true*/
define(["orgUnitContoller", "angularMocks", "utils", "lodash", "orgUnitRepository"], function(OrgUnitController, mocks, utils, _, OrgUnitRepository) {
    describe("org unit controller", function() {
        var q, scope, orgUnitContoller, location, timeout, anchorScroll, orgUnitRepository, rootScope;

        beforeEach(mocks.inject(function($rootScope, $q, $location, $timeout, $anchorScroll) {
            q = $q;
            rootScope = $rootScope;

            rootScope.currentUser = {
                "userCredentials": {
                    "username": "superadmin"
                }
            };

            scope = rootScope.$new();
            location = $location;
            timeout = $timeout;


            var orgunits = [{
                "id": "1",
                "level": 1
            }, {
                "id": "2",
                "level": 2,
                "parent": {
                    "id": "1"
                }
            }];

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "getOrgUnitAndDescendants").and.returnValue(utils.getPromise(q, orgunits));

            anchorScroll = jasmine.createSpy();
        }));

        it("should fetch and display organisation units for superadmin", function() {
            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);

            spyOn(scope, "onOrgUnitSelect");
            scope.$apply();

            var expectedOrgUnitTree = [{
                "id": "1",
                "level": 1,
                "children": [{
                    "id": "2",
                    "level": 2,
                    "parent": {
                        "id": "1"
                    },
                    "children": [],
                    "selected": false,
                    "collapsed": true
                }],
                "selected": false,
                "collapsed": true
            }];
            expect(orgUnitRepository.getOrgUnitAndDescendants).toHaveBeenCalledWith(4);
            expect(scope.organisationUnits).toEqual(expectedOrgUnitTree);
            expect(scope.onOrgUnitSelect).not.toHaveBeenCalled();
            expect(scope.state).toEqual(undefined);
        });

        it("should fetch and display organisation units for msfadmin", function() {
            var orgunits = [{
                "id": "3",
                "level": 3,
                "parent": {
                    "id": "2"
                }
            }, {
                "id": "4",
                "level": 4,
                "parent": {
                    "id": "3"
                }
            }, {
                "id": "5",
                "level": 5,
                "parent": {
                    "id": "4"
                }
            }];
            orgUnitRepository.getOrgUnitAndDescendants.and.returnValue(utils.getPromise(q, orgunits));

            rootScope.currentUser = {
                "userCredentials": {
                    "username": "projectadmin"
                },
                "selectedProject": {
                    "id": "3"
                }
            };

            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);

            spyOn(scope, "onOrgUnitSelect");
            scope.$apply();

            var expectedOrgUnitTree = [{
                "id": "3",
                "level": 3,
                "parent": {
                    "id": "2"
                },
                "children": [{
                    "id": "4",
                    "level": 4,
                    "parent": {
                        "id": "3"
                    },
                    "children": [{
                        "id": "5",
                        "level": 5,
                        "parent": {
                            "id": "4"
                        },
                        "children": [],
                        "selected": false,
                        "collapsed": true
                    }],
                    "selected": false,
                    "collapsed": true
                }],
                "selected": false,
                "collapsed": true
            }];
            expect(orgUnitRepository.getOrgUnitAndDescendants).toHaveBeenCalledWith(6, "3");
            expect(scope.organisationUnits).toEqual(expectedOrgUnitTree);
            expect(scope.onOrgUnitSelect).not.toHaveBeenCalled();
            expect(scope.state).toEqual(undefined);
        });

        it("should fetch and select the newly created organization unit", function() {
            spyOn(location, 'hash').and.returnValue(["2", 1]);
            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);
            spyOn(scope, 'onOrgUnitSelect');

            scope.$apply();

            var expectedOrgUnitNode = {
                id: "2",
                level: 2,
                parent: {
                    id: "1"
                },
                children: [],
                selected: true,
                collapsed: false
            };
            expect(scope.onOrgUnitSelect).toHaveBeenCalledWith(expectedOrgUnitNode);
            expect(scope.state).toEqual({
                currentNode: expectedOrgUnitNode
            });
            expect(scope.saveSuccess).toEqual(true);
        });

        it("should display a timed message after creating a organization unit", function() {
            spyOn(location, 'hash').and.returnValue(["1", 2]);
            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);
            spyOn(scope, 'onOrgUnitSelect');

            scope.$apply();

            expect(scope.saveSuccess).toEqual(true);
            timeout.flush();
            expect(scope.saveSuccess).toEqual(false);
        });

        it("should close new form and select the newly created orgunit", function() {
            var successMessage = "saved successfully";
            var orgunits = [{
                "id": "1",
                "level": 1
            }, {
                "id": "2",
                "level": 2,
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "something"
                }],
                "parent": {
                    "id": "1"
                }
            }];
            orgUnitRepository.getOrgUnitAndDescendants.and.returnValue(utils.getPromise(q, orgunits));

            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);

            scope.closeNewForm({
                "id": "2"
            }, successMessage);

            scope.$apply();
            var expectedSelectedNode = {
                "id": "2",
                "level": 2,
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "something"
                }],
                "parent": {
                    "id": "1"
                },
                "children": [],
                "selected": true,
                "collapsed": false
            };
            expect(scope.message).toEqual(successMessage);
            expect(scope.showMessage).toBe(true);
            expect(scope.state.currentNode).toEqual(expectedSelectedNode);
        });

        it("should show the selected organisation unit details", function() {
            var orgUnit = {
                "id": "2",
                "level": 2,
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "parent": {
                    "id": "1"
                }
            };

            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);
            scope.$apply();

            scope.onOrgUnitSelect(orgUnit);

            expect(scope.orgUnit).toEqual(orgUnit);
        });

        it("should set the organization unit", function() {
            var orgUnit = {
                "id": "2",
                "level": 2,
                "attributeValues": [{
                    "attribute": {
                        "code": "Type"
                    },
                    "value": "Module"
                }],
                "parent": {
                    "id": "1"
                }
            };
            orgUnitRepository.getOrgUnitAndDescendants.and.returnValue(utils.getPromise(q, orgUnit));

            spyOn(location, 'hash').and.returnValue(["2", 1]);

            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);

            scope.$apply();

            scope.onOrgUnitSelect(orgUnit);

            expect(location.hash).toHaveBeenCalled();
            expect(scope.orgUnit).toEqual(orgUnit);
            expect(anchorScroll).toHaveBeenCalled();
        });

        it("should set the template url to be displayed for New mode", function() {
            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);

            scope.openInNewMode('Country');

            expect(scope.templateUrl.split('?')[0]).toEqual('templates/partials/country-form.html');
            expect(scope.isNewMode).toEqual(true);
        });

        it("should set the template url for view mode", function() {
            orgUnitContoller = new OrgUnitController(scope, q, location, timeout, anchorScroll, rootScope, orgUnitRepository);

            scope.openInViewMode('Module');

            expect(scope.templateUrl.split('?')[0]).toEqual('templates/partials/module-form.html');
            expect(scope.isNewMode).toEqual(false);
        });
    });
});
