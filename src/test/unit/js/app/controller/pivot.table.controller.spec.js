define(["angularMocks", "lodash", "moment", "pivotTableController", "timecop"], function(mocks, lodash, moment, PivotTableController, timecop) {
    describe("pivotTableControllerSpec", function() {

        var scope, pivotTableController;

        beforeEach(mocks.inject(function($rootScope) {
            scope = $rootScope.$new();

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
                    ["abf819dca06", "a67aa742313", "201507", "6433.0"],
                    ["ab3a614eed1", "a67aa742313", "201507", "1772.0"],
                    ["abf819dca06", "a0e7d3973e3", "201508", "201.0"],
                    ["ab3a614eed1", "a0e7d3973e3", "201507", "1387.0"],
                    ["abf819dca06", "a0e7d3973e3", "201507", "264.0"]
                ],
                "width": 4
            };

            scope.definition = {
                "name": "[FieldApp - NewConsultations] Consultations",
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

        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });


        describe("Export as csv", function() {

            it("should get csv file name in expected format", function() {
                pivotTableController = new PivotTableController(scope);
                scope.$apply();

                expect(scope.getCsvFileName()).toEqual("NewConsultations_Consultations_29-Oct-2015.csv");
            });

            it("should get headers if category is present", function() {
                pivotTableController = new PivotTableController(scope);
                scope.$apply();
                var expected = ['Data Element', 'Category', 'July 2015', 'August 2015'];

                expect(scope.getHeaders()).toEqual(expected);
            });

            it("should get headers if category not present", function() {
                pivotTableController = new PivotTableController(scope);
                scope.isCategoryPresent = false;
                scope.$apply();
                var expected = ['Data Element', 'July 2015', 'August 2015'];

                expect(scope.getHeaders()).toEqual(expected);
            });

            it("should get data for csv file", function() {
                pivotTableController = new PivotTableController(scope);
                scope.$apply();
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
        });

        it("should get data element name", function() {
            pivotTableController = new PivotTableController(scope);
            scope.$apply();
            var dataElementName = "FieldApp - test";
            var actualdataelementName = scope.getDataElementName(dataElementName);

            expect("FieldApp").toEqual(actualdataelementName);
        });

        it("should populate viewmap and other scope variables on load when categories are present", function() {
            pivotTableController = new PivotTableController(scope);
            scope.$apply();
            var expectedViewMap = [{
                category: 'ab3a614eed1',
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                sortOrder: 1.1
            }, {
                category: 'ab3a614eed1',
                dataElement: 'a67aa742313',
                dataElementName: 'Follow-up Consultations - Consultations - Out Patient Department - Pediatric',
                sortOrder: 2.1
            }, {
                category: 'abf819dca06',
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                sortOrder: 1.2
            }, {
                category: 'abf819dca06',
                dataElement: 'a67aa742313',
                dataElementName: 'Follow-up Consultations - Consultations - Out Patient Department - Pediatric',
                sortOrder: 2.2
            }];


            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(true);
            expect(scope.hasOnlyOneCategory).toEqual(false);
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
                    "pe": ["201410", "201411", "201412", "201501", "201502", "201503", "201504", "201505", "201506", "201507", "201508", "201509"],
                    "names": {
                        "dx": "Data",
                        "a2cf79e8f13": "MSF",
                        "201508": "August 2015",
                        "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                        "pe": "Period"
                    }
                },
                "rows": [
                    ["a0e7d3973e3", "201508", "215.0"]
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

            pivotTableController = new PivotTableController(scope);

            scope.$apply();

            var expectedViewMap = [{
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                sortOrder: 1
            }];

            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(false);
        });

        it("should populate viewmap and other scope variables on load when only one category is present", function() {
            scope.data = {
                "headers": [{
                    "name": "a1948a9c6f4",
                    "column": "Surveillance",
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
                    "pe": ["201410", "201411", "201412", "201501", "201502", "201503", "201504", "201505", "201506", "201507", "201508", "201509"],
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
                    ["ab3a614eed1", "a0e7d3973e3", "201508", "215.0"]
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

            pivotTableController = new PivotTableController(scope);

            scope.$apply();

            var expectedViewMap = [{
                category: 'ab3a614eed1',
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                sortOrder: 1.1
            }];

            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(true);
            expect(scope.hasOnlyOneCategory).toEqual(true);
        });

    });
});
