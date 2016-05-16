define(["pivotTableDirective", "angularMocks", "utils", "pivotTableController", "translationsService"], function(PivotTable, mocks, utils, PivotTableController, TranslationsService) {

    describe("Pivot Table Directive", function() {
        var pivotTableController, tableData, tableDefinition, translationsService;
        beforeEach(function() {
            var app = angular.module("cc", []);
            app.directive("pivotTable", PivotTable);
            app.controller("pivotTableController", ['$scope',  '$rootScope', 'translationsService', PivotTableController]);
            module("cc");
            module("templates/pivot-table/pivot.table.html");

            tableDefinition  = {
                "name": "[fieldApp] ABC",
                "columns": [{
                    "dimension": "pe",
                    "items": [{
                        "id": "LAST_12_MONTHS",
                        "name": "LAST_12_MONTHS"
                    }]
                }],
                "categoryDimensions": [{
                    "categoryOptions": [{
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
                }],
                "dataElements": [{
                    "id": "a0e7d3973e3",
                    "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                }, {
                    "id": "a67aa742313",
                    "name": "Follow-up Consultations - Consultations - Out Patient Department - Pediatric"
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
            translationsService = new TranslationsService();
            spyOn(translationsService, "translate").and.returnValue([]);
        });

        it("should transform the data to the correct form", mocks.inject(function($rootScope) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            rootScope.resourceBundle = {
                "January": "January",
                "February": "February",
                "March": "March",
                "April": "April",
                "May": "May",
                "June": "June",
                "July": "July",
                "August": "August",
                "September": "September",
                "October": "October",
                "November": "November",
                "December": "December"
            };
            scope.data = tableData;
            scope.definition = tableDefinition;
            translationsService.translate.and.returnValue(scope.definition.categoryDimensions[0].categoryOptions);

            pivotTableController = PivotTableController(scope, rootScope, translationsService);
            scope.$apply();

            expect(scope.dataMap).toEqual([{
                category: 'a0b89770007',
                dataElement: 'a0e7d3973e3',
                period: '201508',
                value: 249
            }, {
                category: 'a0b89770007',
                dataElement: 'a0e7d3973e3',
                period: '201507',
                value: 876854
            }, {
                category: 'afca0bdf0f1',
                dataElement: 'a0e7d3973e3',
                period: '201508',
                value: 52
            }, {
                category: 'afca0bdf0f1',
                dataElement: 'a0e7d3973e3',
                period: '201507',
                value: 1033
            }, {
                category: 'ab3a614eed1',
                dataElement: 'a0e7d3973e3',
                period: '201508',
                value: 215
            }, {
                category: 'abf819dca06',
                dataElement: 'a67aa742313',
                period: '201507',
                value: 6433
            }, {
                category: 'ab3a614eed1',
                dataElement: 'a67aa742313',
                period: '201507',
                value: 1772
            }, {
                category: 'abf819dca06',
                dataElement: 'a0e7d3973e3',
                period: '201508',
                value: 201
            }, {
                category: 'ab3a614eed1',
                dataElement: 'a0e7d3973e3',
                period: '201507',
                value: 1387
            }, {
                category: 'abf819dca06',
                dataElement: 'a0e7d3973e3',
                period: '201507',
                value: 264
            }, {
                category: 'afca0bdf0f1',
                dataElement: 'a67aa742313',
                period: '201507',
                value: 10386
            }, {
                category: 'a0b89770007',
                dataElement: 'a67aa742313',
                period: '201507',
                value: 1706
            }]);

            expect(scope.viewMap).toEqual([{
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementIndex: 1,
                sortKey_201410: 0,
                sortKey_201411: 0,
                sortKey_201412: 0,
                sortKey_201501: 0,
                sortKey_201502: 0,
                sortKey_201503: 0,
                sortKey_201504: 0,
                sortKey_201505: 0,
                sortKey_201506: 0,
                sortKey_201507: 879538,
                sortKey_201508: 717,
                sortKey_201509: 0
            }, {
                dataElement: 'a67aa742313',
                dataElementName: 'Follow-up Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementIndex: 2,
                sortKey_201410: 0,
                sortKey_201411: 0,
                sortKey_201412: 0,
                sortKey_201501: 0,
                sortKey_201502: 0,
                sortKey_201503: 0,
                sortKey_201504: 0,
                sortKey_201505: 0,
                sortKey_201506: 0,
                sortKey_201507: 20297,
                sortKey_201508: 0,
                sortKey_201509: 0
            }]);
        }));

        it("should get the correct value to be displayed", mocks.inject(function($rootScope) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            rootScope.resourceBundle = {
                "January": "January",
                "February": "February",
                "March": "March",
                "April": "April",
                "May": "May",
                "June": "June",
                "July": "July",
                "August": "August",
                "September": "September",
                "October": "October",
                "November": "November",
                "December": "December"
            };
            scope.data = tableData;
            scope.definition = tableDefinition;

            translationsService.translate.and.returnValue(scope.definition.categoryDimensions[0].categoryOptions);

            pivotTableController = PivotTableController(scope, rootScope, translationsService);
            scope.$apply();

            expect(scope.getValue('abf819dca06', 'a67aa742313', '201507')).toEqual(6433);
        }));
    });
});
