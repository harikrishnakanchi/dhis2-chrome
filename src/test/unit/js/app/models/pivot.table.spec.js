define(['pivotTable'], function(PivotTable) {
   describe('PivotTable', function() {
       var pivotTable, config;

       describe('create()', function() {
           it('should return an instance with required properties', function() {
               config = {
                   id: 'someId',
                   name: 'someName',
                   columns: 'columnInfo',
                   rows: 'rowInfo',
                   filters: 'filterInfo',
                   categoryDimensions: 'categoryDimensionInfo',
                   dataDimensionItems: 'dataDimensionItemInfo'
               };
               pivotTable = PivotTable.create(config);
               expect(pivotTable.id).toEqual(config.id);
               expect(pivotTable.name).toEqual(config.name);
               expect(pivotTable.columns).toEqual(config.columns);
               expect(pivotTable.rows).toEqual(config.rows);
               expect(pivotTable.filters).toEqual(config.filters);

               expect(pivotTable.categoryDimensions).toEqual(config.categoryDimensions);
               expect(pivotTable.dataDimensionItems).toEqual(config.dataDimensionItems);
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

       describe('serviceCode', function() {
           it('should parse the dataSet code from the pivot table name', function() {
               pivotTable = PivotTable.create({ name: '[FieldApp - someServiceCode] # Name' });
               expect(pivotTable.serviceCode).toEqual('someServiceCode');
           });

           it('should leave the dataSet code as null if the pivot table name is malformed', function() {
               pivotTable = PivotTable.create({ name: 'some malformed pivot table name' });
               expect(pivotTable.serviceCode).toBeNull();
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

       describe('opunitReport', function() {
           it('should return true if pivot table name contains OpunitReport', function() {
               pivotTable = PivotTable.create({ name: '[Praxis - OpunitReport] # Name' });
               expect(pivotTable.opUnitReport).toBeTruthy();
           });

           it('should return false if pivot table name does not contain OpunitReport', function() {
               pivotTable = PivotTable.create({ name: 'some malformed pivot table name' });
               expect(pivotTable.opUnitReport).toBeFalsy();
           });
       });

       describe('geographicOriginReport', function() {
           it('should return true if pivot table name contains GeographicOrigin', function() {
               pivotTable = PivotTable.create({ name: '[FieldApp - GeographicOrigin] # Name' });
               expect(pivotTable.geographicOriginReport).toBeTruthy();
           });

           it('should return false if pivot table name does not contain GeographicOrigin', function() {
               pivotTable = PivotTable.create({ name: 'some malformed pivot table name' });
               expect(pivotTable.geographicOriginReport).toBeFalsy();
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

       describe('weeklyReport', function() {
           it('should return true if relativePeriods does not contain Months', function () {
               pivotTable = PivotTable.create({ relativePeriods: { anotherTimePeriod: true } });
               expect(pivotTable.weeklyReport).toBeTruthy();
           });

           it('should return false if relativePeriods contains Months', function () {
               pivotTable = PivotTable.create({ relativePeriods: { last12Months: true } });
               expect(pivotTable.weeklyReport).toBeFalsy();
           });
       });

       describe('title', function() {
           it('should parse the title from the pivot table name', function() {
               pivotTable = PivotTable.create({ name: '[FieldApp - someServiceCode] 1 SomePivotTableTitle' });
               expect(pivotTable.title).toEqual('SomePivotTableTitle');
           });

           it('should parse the title from the pivot table name with special characters', function() {
               pivotTable = PivotTable.create({ name: '[FieldApp - someServiceCode] 1 Some\'Pi/vo>t< & Tab=le%Title' });
               expect(pivotTable.title).toEqual('Some\'Pi/vo>t< & Tab=le%Title');
           });

           it('should return an empty string if the pivot table name is malformed', function() {
               pivotTable = PivotTable.create({ name: 'some malformed pivot table name' });
               expect(pivotTable.title).toEqual('');
           });
       });

       describe('displayPosition', function() {
           it('should parse the display position from the pivot table name', function() {
               pivotTable = PivotTable.create({ name: '[FieldApp - someServiceCode] 88 SomePivotTableTitle' });
               expect(pivotTable.displayPosition).toEqual(88);
           });

           it('should return false if the pivot table name is malformed', function() {
               pivotTable = PivotTable.create({ name: 'some malformed pivot table name' });
               expect(pivotTable.displayPosition).toBeNull();
           });
       });
   });
});
