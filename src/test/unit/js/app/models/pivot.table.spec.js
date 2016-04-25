define(['pivotTable'], function(PivotTable) {
   describe('PivotTable', function() {
       var pivotTable, config;

       describe('constructor', function() {
           it('should create an instance with required properties', function() {
               config = {
                   id: 'someId',
                   name: 'someName'
               };
               pivotTable = new PivotTable(config);
               expect(pivotTable.id).toEqual(config.id);
               expect(pivotTable.name).toEqual(config.name);
           });
       });

       describe('sortable behaviour', function() {
           it('should be sortable and ascending if sortOrder is 1', function() {
               pivotTable = new PivotTable({ sortOrder: 1 });
               expect(pivotTable.sortable).toBeTruthy();
               expect(pivotTable.sortAscending).toBeTruthy();
           });

           it('should be sortable and descending if sortOrder is 2', function() {
               pivotTable = new PivotTable({ sortOrder: 2 });
               expect(pivotTable.sortable).toBeTruthy();
               expect(pivotTable.sortDescending).toBeTruthy();
           });

           it('should not be sortable if sortOrder is any other value', function() {
               pivotTable = new PivotTable({ sortOrder: 'otherValue' });
               expect(pivotTable.sortable).toBeFalsy();
               expect(pivotTable.sortAscending).toBeFalsy();
               expect(pivotTable.sortDescending).toBeFalsy();
           });
       });

       describe('dataSetCode', function() {
           it('should parse the dataSet code from the pivot table name', function() {
               pivotTable = new PivotTable({ name: '[FieldApp - someDataSetCode] # Name' });
               expect(pivotTable.dataSetCode).toEqual('someDataSetCode');
           });

           it('should leave the dataSet code as null if the pivot table name is malformed', function() {
               pivotTable = new PivotTable({ name: 'some malformed pivot table name' });
               expect(pivotTable.dataSetCode).toBeNull();
           });

       });
   });
});