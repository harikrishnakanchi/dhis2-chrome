define(['pivotTable'], function(PivotTable) {
   describe('PivotTable', function() {
       var pivotTable, config;

       describe('constructor', function() {
           it('should create an instance with required properties', function() {
               config = {
                   id: 'someId',
                   name: 'someName',
                   columns: 'columnInfo',
                   rows: 'rowInfo',
                   filters: 'filterInfo'
               };
               pivotTable = PivotTable.create(config);
               expect(pivotTable.id).toEqual(config.id);
               expect(pivotTable.name).toEqual(config.name);
               expect(pivotTable.columns).toEqual(config.columns);
               expect(pivotTable.rows).toEqual(config.rows);
               expect(pivotTable.filters).toEqual(config.filters);
           });
       });

       describe('sortable behaviour', function() {
           it('should be sortable and ascending if sortOrder is 1', function() {
               pivotTable = PivotTable.create({ sortOrder: 1 });
               expect(pivotTable.sortable).toBeTruthy();
               expect(pivotTable.sortAscending).toBeTruthy();
           });

           it('should be sortable and descending if sortOrder is 2', function() {
               pivotTable = PivotTable.create({ sortOrder: 2 });
               expect(pivotTable.sortable).toBeTruthy();
               expect(pivotTable.sortDescending).toBeTruthy();
           });

           it('should not be sortable if sortOrder is any other value', function() {
               pivotTable = PivotTable.create({ sortOrder: 'otherValue' });
               expect(pivotTable.sortable).toBeFalsy();
               expect(pivotTable.sortAscending).toBeFalsy();
               expect(pivotTable.sortDescending).toBeFalsy();
           });
       });

       describe('dataSetCode', function() {
           it('should parse the dataSet code from the pivot table name', function() {
               pivotTable = PivotTable.create({ name: '[FieldApp - someDataSetCode] # Name' });
               expect(pivotTable.dataSetCode).toEqual('someDataSetCode');
           });

           it('should leave the dataSet code as null if the pivot table name is malformed', function() {
               pivotTable = PivotTable.create({ name: 'some malformed pivot table name' });
               expect(pivotTable.dataSetCode).toBeNull();
           });
       });

       describe('projectReport', function() {
           it('should return true if pivot table name contains ProjectReport', function() {
               pivotTable = PivotTable.create({ name: '[FieldApp - ProjectReport] # Name' });
               expect(pivotTable.projectReport).toBeTruthy();
           });

           it('should return false if pivot table name does not contain ProjectReport', function() {
               pivotTable = PivotTable.create({ name: 'some malformed pivot table name' });
               expect(pivotTable.projectReport).toBeFalsy();
           });
       });

       describe('monthlyReport', function() {
           it('should return true if relativePeriods contains Months', function () {
               pivotTable = PivotTable.create({ relativePeriods: { last12Months: true } });
               expect(pivotTable.monthlyReport).toBeTruthy();
           });

           it('should return false if relativePeriods does not contain Months', function () {
               pivotTable = PivotTable.create({ relativePeriods: { anotherTimePeriod: true, last12Months: false } });
               expect(pivotTable.monthlyReport).toBeFalsy();
           });
       });

       describe('title', function() {
           it('should parse the title from the pivot table name', function() {
               pivotTable = PivotTable.create({ name: '[FieldApp - someDataSetCode] 1 SomePivotTableTitle' });
               expect(pivotTable.title).toEqual('SomePivotTableTitle');
           });

           it('should return an empty string if the pivot table name is malformed', function() {
               pivotTable = PivotTable.create({ name: 'some malformed pivot table name' });
               expect(pivotTable.title).toEqual('');
           });
       });
   });
});