define(["angularMocks", "lodash", "moment", "pivotTableController", "timecop"], function(mocks, lodash, moment, PivotTableController, timecop) {
    describe("pivotTableControllerSpec", function() {

        var scope, rootScope, pivotTableController;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();
            rootScope = $rootScope;

            Timecop.install();
            Timecop.freeze(new Date("2015-10-29T12:43:54.972Z"));

            scope.data = {
                "headers": [{
                    "name": "a1948a9c6f4",
                    "column": "Pediatric Age Group",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "dx",
                    "column": "Data",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "pe",
                    "column": "Period",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "value",
                    "column": "Value",
                    "type": "java.lang.Double",
                    "hidden": false,
                    "meta": false
                }],
                "metaData": {
                    "pe": ["201507", "201508"],
                    "names": {
                        "dx": "Data",
                        "a2cf79e8f13": "MSF",
                        "201507": "July 2015",
                        "201508": "August 2015",
                        "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                        "a67aa742313": "Follow-up Consultations - Consultations - Out Patient Department - Pediatric",
                        "ou": "Organisation unit",
                        "abf819dca06": "24-59 months",
                        "pe": "Period",
                        "ab3a614eed1": "1-23 months"

                    }
                },
                "rows": [
                    ["ab3a614eed1", "a0e7d3973e3", "201508", "215.0"],
                    ["abf819dca06", "a0e7d3973e3", "201508", "201.0"],
                    ["ab3a614eed1", "a67aa742313", "201507", "1772.0"],
                    ["abf819dca06", "a67aa742313", "201507", "6433.0"],
                    ["ab3a614eed1", "a0e7d3973e3", "201507", "1387.0"],
                    ["abf819dca06", "a0e7d3973e3", "201507", "264.0"]
                ],
                "width": 4
            };

            scope.definition = {
                "name": "[FieldApp - NewConsultations] Consultations",
                "sortOrder": 0,
                "sortAscending": false,
                "sortDescending": false,
                "sortable": false,
                "categoryDimensions": [{
                    "categoryOptions": [{
                        "id": "ab3a614eed1",
                        "name": "1-23 months"
                    }, {
                        "id": "abf819dca06",
                        "name": "24-59 months"
                    }]
                }],
                "dataElements": [{
                    "id": "a0e7d3973e3",
                    "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                }, {
                    "id": "a67aa742313",
                    "name": "Follow-up Consultations - Consultations - Out Patient Department - Pediatric"
                }]
            };

            pivotTableController = new PivotTableController(scope, rootScope);
            scope.$apply();
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });


        describe("Export as csv", function() {
            it("should get csv file name in expected format", function() {
                expect(scope.getCsvFileName()).toEqual("NewConsultations_Consultations_29-Oct-2015.csv");
            });

            it("should get headers if category is present", function() {
                var expected = ['Data Element', 'Category', 'July 2015', 'August 2015'];
                expect(scope.getHeaders()).toEqual(expected);
            });

            it("should get headers if category not present", function() {
                scope.isCategoryPresent = false;
                scope.$apply();
                var expected = ['Data Element', 'July 2015', 'August 2015'];

                expect(scope.getHeaders()).toEqual(expected);
            });

            it("should get data for csv file when categories are present", function() {
                var expectedDataValues = [{
                    "Data Element": 'New Consultations',
                    "Category": '1-23 months',
                    "July 2015": 1387,
                    "August 2015": 215
                }, {
                    "Data Element": 'New Consultations',
                    "Category": '24-59 months',
                    "July 2015": 264,
                    "August 2015": 201
                }, {
                    "Data Element": 'Follow-up Consultations',
                    "Category": '1-23 months',
                    "July 2015": 1772,
                    "August 2015": 0
                }, {
                    "Data Element": 'Follow-up Consultations',
                    "Category": '24-59 months',
                    "July 2015": 6433,
                    "August 2015": 0
                }];

                expect(scope.getData()).toEqual(expectedDataValues);
            });

            it("should get data for csv file when categories are not present", function() {
                scope.data = {
                    "headers": [{
                        "name": "dx",
                        "column": "Data",
                        "type": "java.lang.String",
                        "hidden": false,
                        "meta": true
                    }, {
                        "name": "pe",
                        "column": "Period",
                        "type": "java.lang.String",
                        "hidden": false,
                        "meta": true
                    }, {
                        "name": "value",
                        "column": "Value",
                        "type": "java.lang.Double",
                        "hidden": false,
                        "meta": false
                    }],
                    "metaData": {
                        "pe": ["201508", "201509"],
                        "names": {
                            "dx": "Data",
                            "a2cf79e8f13": "MSF",
                            "201508": "August 2015",
                            "201509": "September 2015",
                            "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                            "pe": "Period"
                        }
                    },
                    "rows": [
                        ["a0e7d3973e3", "201508", "215.0"],
                        ["a0e7d3973e3", "201509", "45.0"]
                    ],
                    "width": 3
                };

                scope.definition = {
                    "name": "[FieldApp - NewConsultations] Consultations",
                    "dataElements": [{
                        "id": "a0e7d3973e3",
                        "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                    }]
                };
                pivotTableController = new PivotTableController(scope, rootScope);
                scope.$apply();
                var expectedDataValues = [{
                    "Data Element": 'New Consultations',
                    "August 2015": 215,
                    "September 2015": 45
                }];

                expect(scope.getData()).toEqual(expectedDataValues);
            });
        });

        it("should get data element name", function() {
            var dataElementName = "FieldApp - test";
            var actualdataelementName = scope.getDataElementName(dataElementName);

            expect("FieldApp").toEqual(actualdataelementName);
        });

        it("should populate viewmap and other scope variables on load when categories are present", function() {
            var expectedViewMap = [{
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementIndex: 1,
                sortKey_201507: 1651,
                sortKey_201508: 416
            }, {
                dataElement: 'a67aa742313',
                dataElementName: 'Follow-up Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementIndex: 2,
                sortKey_201507: 8205,
                sortKey_201508: 0
            }];

            var expectedHeaders = [{
                showHeader: true,
                headers: [{
                    period: '201507',
                    name: 'July 2015',
                    sortKey: 'sortKey_201507'
                }, {
                    period: '201508',
                    name: 'August 2015',
                    sortKey: 'sortKey_201508'
                }]
            }, {
                showHeader: true,
                headers: [{
                    period: '201507',
                    name: '1-23 months',
                    category: 'ab3a614eed1',
                    sortKey: 'sortKey_201507'
                }, {
                    period: '201507',
                    name: '24-59 months',
                    category: 'abf819dca06',
                    sortKey: 'sortKey_201507'
                }, {
                    period: '201508',
                    name: '1-23 months',
                    category: 'ab3a614eed1',
                    sortKey: 'sortKey_201508'
                }, {
                    period: '201508',
                    name: '24-59 months',
                    category: 'abf819dca06',
                    sortKey: 'sortKey_201508'
                }]
            }];

            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(true);
            expect(scope.hasOnlyOneCategory).toEqual(false);
            expect(scope.headersForTable).toEqual(expectedHeaders);
        });

        it("should populate viewmap and other scope variables on load when categories are not present", function() {
            scope.data = {
                "headers": [{
                    "name": "dx",
                    "column": "Data",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "pe",
                    "column": "Period",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "value",
                    "column": "Value",
                    "type": "java.lang.Double",
                    "hidden": false,
                    "meta": false
                }],
                "metaData": {
                    "pe": ["201508", "201509"],
                    "names": {
                        "dx": "Data",
                        "a2cf79e8f13": "MSF",
                        "201508": "August 2015",
                        "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                        "pe": "Period"
                    }
                },
                "rows": [
                    ["a0e7d3973e3", "201508", "215.0"],
                    ["a0e7d3973e3", "201509", "45.0"]
                ],
                "width": 3
            };

            scope.definition = {
                "name": "[FieldApp - NewConsultations] Consultations",
                "dataElements": [{
                    "id": "a0e7d3973e3",
                    "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                }]
            };

            pivotTableController = new PivotTableController(scope, rootScope);
            scope.$apply();

            var expectedViewMap = [{
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementIndex: 1,
                sortKey_201508: 215,
                sortKey_201509: 45
            }];

            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(false);
        });

        it("should populate viewmap and other scope variables on load when only one category is present", function() {
            scope.data = {
                "headers": [{
                    "name": "dx",
                    "column": "Data",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "pe",
                    "column": "Period",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "a1948a9c6f4",
                    "column": "Surveillance",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "value",
                    "column": "Value",
                    "type": "java.lang.Double",
                    "hidden": false,
                    "meta": false
                }],
                "metaData": {
                    "pe": ["201410", "201411", "201412"],
                    "names": {
                        "dx": "Data",
                        "a2cf79e8f13": "MSF",
                        "201508": "August 2015",
                        "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                        "ou": "Organisation unit",
                        "pe": "Period",
                        "ab3a614eed1": "Cases"

                    }
                },
                "rows": [
                    ["a0e7d3973e3", "201410", "ab3a614eed1", "215.0"],
                    ["a0e7d3973e3", "201411", "ab3a614eed1", "22.0"],
                    ["a0e7d3973e3", "201412", "ab3a614eed1", "25.0"]
                ],
                "width": 4
            };

            scope.definition = {
                "name": "[FieldApp - NewConsultations] Consultations",
                "categoryDimensions": [{
                    "categoryOptions": [{
                        "id": "ab3a614eed1",
                        "name": "Cases"
                    }]
                }],
                "dataElements": [{
                    "id": "a0e7d3973e3",
                    "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                }]
            };

            pivotTableController = new PivotTableController(scope, rootScope);
            scope.$apply();

            var expectedViewMap = [{
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementIndex: 1,
                sortKey_201410: 215,
                sortKey_201411: 22,
                sortKey_201412: 25
            }];

            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(true);
            expect(scope.hasOnlyOneCategory).toEqual(true);
        });

        it("should set selectedSortKey", function () {
            scope.definition.sortAscending = false;
            scope.definition.sortDescending = true;
            scope.definition.sortable = true;

            pivotTableController = new PivotTableController(scope, rootScope);

            scope.sortByColumn({sortKey: 'sortKey_2015W02'});
            expect(scope.selectedSortKey).toEqual('sortKey_2015W02');

            scope.sortByColumn({sortKey: 'sortKey_2015W03'});
            expect(scope.selectedSortKey).toEqual('sortKey_2015W03');

            scope.sortByColumn({sortKey: 'dataElementIndex'});
            expect(scope.selectedSortKey).toEqual('dataElementIndex');

            scope.sortByColumn({sortKey: 'sortKey_2015W04'});
            expect(scope.selectedSortKey).toEqual('sortKey_2015W04');

            scope.sortByColumn();
            expect(scope.selectedSortKey).toEqual('dataElementIndex');
        });

    });
});
