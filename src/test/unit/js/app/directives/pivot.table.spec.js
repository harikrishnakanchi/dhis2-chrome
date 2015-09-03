define(["pivotTable", "angularMocks", "utils", "pivotTableController"], function(PivotTable, mocks, utils, PivotTableController) {
    describe("Pivot Table Directive", function() {
        var $scope, tableDefinition, tableData;
        beforeEach(function() {
            var app = angular.module("cc", []);
            app.directive("pivotTable", PivotTable);
            app.controller("pivotTableController", ['$scope', PivotTableController]);
            module("cc");
            module("templates/pivot.table.html");
            tableDefinition = {
                "columns": [{
                    "dimension": "pe",
                    "items": [{
                        "id": "LAST_12_MONTHS",
                        "name": "LAST_12_MONTHS"
                    }]
                }],
                "rows": [{
                    "dimension": "a1948a9c6f4",
                    "items": [{
                        "id": "ab3a614eed1",
                        "name": "1-23 months"
                    }, {
                        "id": "abf819dca06",
                        "name": "24-59 months"
                    }, {
                        "id": "a0b89770007",
                        "name": "5-14 years"
                    }, {
                        "id": "afca0bdf0f1",
                        "name": "<1 month"
                    }]
                }, {
                    "dimension": "de",
                    "items": [{
                        "id": "a0e7d3973e3",
                        "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                    }, {
                        "id": "a67aa742313",
                        "name": "Follow-up Consultations - Consultations - Out Patient Department - Pediatric"
                    }]
                }],
                "filters": [{
                    "dimension": "ou",
                    "items": [{
                        "id": "a2cf79e8f13",
                        "name": "MSF"
                    }]
                }]
            };
            tableData = {
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
                    "pe": ["201410", "201411", "201412", "201501", "201502", "201503", "201504", "201505", "201506", "201507", "201508", "201509"],
                    "co": ["a5b4bc9fb13", "a356292c764", "a384d7501c2", "a44ec0d6da3", "a0a3ead9cab", "ad3a550cc4c", "a268522c516", "aa96411bdb6"],
                    "ou": ["a2cf79e8f13"],
                    "names": {
                        "a5b4bc9fb13": "(5-14 years, Male)",
                        "a0b89770007": "5-14 years",
                        "a1948a9c6f4": "Pediatric Age Group",
                        "dx": "Data",
                        "afca0bdf0f1": "<1 month",
                        "a2cf79e8f13": "MSF",
                        "201501": "January 2015",
                        "a0a3ead9cab": "(24-59 months, Female)",
                        "201503": "March 2015",
                        "201502": "February 2015",
                        "201505": "May 2015",
                        "201504": "April 2015",
                        "201507": "July 2015",
                        "201506": "June 2015",
                        "201509": "September 2015",
                        "201508": "August 2015",
                        "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                        "a67aa742313": "Follow-up Consultations - Consultations - Out Patient Department - Pediatric",
                        "201412": "December 2014",
                        "201410": "October 2014",
                        "201411": "November 2014",
                        "ou": "Organisation unit",
                        "abf819dca06": "24-59 months",
                        "pe": "Period",
                        "ab3a614eed1": "1-23 months",
                        "a356292c764": "(<1 month, Male)",
                        "a44ec0d6da3": "(1-23 months, Male)",
                        "a384d7501c2": "(<1 month, Female)",
                        "ad3a550cc4c": "(Female, 1-23 months)",
                        "a268522c516": "(24-59 months, Male)",
                        "aa96411bdb6": "(5-14 years, Female)"
                    }
                },
                "height": 12,
                "rows": [
                    ["a0b89770007", "a0e7d3973e3", "201508", "249.0"],
                    ["a0b89770007", "a0e7d3973e3", "201507", "876854.0"],
                    ["afca0bdf0f1", "a0e7d3973e3", "201508", "52.0"],
                    ["afca0bdf0f1", "a0e7d3973e3", "201507", "1033.0"],
                    ["ab3a614eed1", "a0e7d3973e3", "201508", "215.0"],
                    ["abf819dca06", "a67aa742313", "201507", "6433.0"],
                    ["ab3a614eed1", "a67aa742313", "201507", "1772.0"],
                    ["abf819dca06", "a0e7d3973e3", "201508", "201.0"],
                    ["ab3a614eed1", "a0e7d3973e3", "201507", "1387.0"],
                    ["abf819dca06", "a0e7d3973e3", "201507", "264.0"],
                    ["afca0bdf0f1", "a67aa742313", "201507", "10386.0"],
                    ["a0b89770007", "a67aa742313", "201507", "1706.0"]
                ],
                "width": 4
            };
        });
        it("should draw the correct html", mocks.inject(function($rootScope, $compile) {
            $scope = $rootScope.$new();
            var tableHtml =
                '<pivot-table data="data" definition="table"></pivot-table>';
            var htmlElement = angular.element(tableHtml);
            $compile(htmlElement)($scope);
            $scope.$digest();
            var tables = htmlElement.find("table");
            expect(tables.length).toBe(1);
        }));

        it("should get the correct columnHeaders", mocks.inject(function($rootScope, $controller) {
            $scope = $rootScope.$new();
            $scope.data = tableData;
            $scope.definition = tableDefinition;
            var controller = PivotTableController($scope);
            $scope.$apply();
            expect($scope.columnHeaders).toEqual([
                [{
                    text: 'October 2014',
                    value: '201410'
                }, {
                    text: 'November 2014',
                    value: '201411'
                }, {
                    text: 'December 2014',
                    value: '201412'
                }, {
                    text: 'January 2015',
                    value: '201501'
                }, {
                    text: 'February 2015',
                    value: '201502'
                }, {
                    text: 'March 2015',
                    value: '201503'
                }, {
                    text: 'April 2015',
                    value: '201504'
                }, {
                    text: 'May 2015',
                    value: '201505'
                }, {
                    text: 'June 2015',
                    value: '201506'
                }, {
                    text: 'July 2015',
                    value: '201507'
                }, {
                    text: 'August 2015',
                    value: '201508'
                }, {
                    text: 'September 2015',
                    value: '201509'
                }]
            ]);


        }));
    });
});
