 define(["notificationsController", "angularMocks", "utils", "userPreferenceRepository", "chartRepository", "orgUnitRepository", "translationsService", "pivotTableRepository", "systemSettingRepository"], function(NotificationsController, mocks, utils, UserPreferenceRepository, ChartRepository, OrgUnitRepository, TranslationService, PivotTableRepository, SystemSettingRepository) {

     describe("notifications controller", function() {

         var notificationsController, userPreferenceRepository, chartRepository, orgUnitRepository,
             userModules, notificationReports, chartData, pivotTableData, rootScope, expectedValues, translationService, pivotTableRepository, systemSettingRepository, dataElementId, dataElementName, q, scope, dataElementDescription, translatedDataElementName, translatedDataElementDescription;

         beforeEach(mocks.inject(function($rootScope, $q) {
             rootScope = $rootScope;
             scope = $rootScope.$new();
             q = $q;

             userModules = [{
                 "name": "mod1",
                 "id": "mod1",
                 "parent": {
                     "name": 'op1'
                 }
             }];
             dataElementId = 'dataElementId';
             dataElementName = 'dataElementName';
             translatedDataElementName = "translatedDataElementName";
             dataElementDescription = 'description';
             translatedDataElementDescription = 'translated description';

             chartData = {
                 "metaData": {
                     "pe": ["2015W25", "2015W26"],
                     "ou": ["a2cf79e8f13"],
                     "names": {
                         dataElementId: dataElementName,
                         "ou": "Organisation unit"
                     }
                 },
                 "rows": [
                     [dataElementId, "2015W26", "24.0"]
                 ]
             };

             pivotTableData = {
                 rows: [
                     {periodDimension: true, name: 'weekA'},
                     {periodDimension: true, name: 'weekB'}
                 ],

                 columns: [
                     [{dataDimension: true, name: 'someDataElementA', id: dataElementId, description: dataElementDescription}]
                 ],
                 getDataValue: jasmine.createSpy('getDataValue').and.returnValue("24.0"),
                 getDisplayName: jasmine.createSpy('getDisplayName').and.returnValue(dataElementName)
             };

             rootScope.startLoading = jasmine.createSpy('startLoading');
             rootScope.stopLoading = jasmine.createSpy('stopLoading');

             rootScope.hasRoles = jasmine.createSpy("hasRoles").and.returnValue(false);

             userPreferenceRepository = new UserPreferenceRepository();
             spyOn(userPreferenceRepository, "getCurrentUsersModules").and.returnValue(utils.getPromise(q, userModules));

             orgUnitRepository = new OrgUnitRepository();
             spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, userModules));
             spyOn(orgUnitRepository, "enrichWithParent").and.callFake(function (orgUnit) { return orgUnit; });

             chartRepository = new ChartRepository();
             spyOn(chartRepository, "getAllChartsForNotifications").and.returnValue(utils.getPromise(q, []));

             spyOn(chartRepository, "getDataForChart").and.returnValue(utils.getPromise(q, chartData));

             translationService = new TranslationService();
             spyOn(translationService, 'getTranslationForProperty').and.callFake(function (objectId, property, defaultValue) {
                 if (property === 'description') {
                     return translatedDataElementDescription;
                 }
                 else if (property === 'name') {
                     return translatedDataElementName;
                 }
                 return defaultValue;
             });

             pivotTableRepository = new PivotTableRepository();
             spyOn(pivotTableRepository, 'getPivotTablesForNotifications').and.returnValue(utils.getPromise(q, []));
             spyOn(pivotTableRepository, 'getPivotTableData').and.returnValue(utils.getPromise(q, pivotTableData));

             systemSettingRepository = new SystemSettingRepository();
             spyOn(systemSettingRepository, 'getStandardDeviationValue').and.returnValue(utils.getPromise(q, 1.25));
         }));

         var initiateNotificationController = function () {
             notificationsController = new NotificationsController(scope, q, rootScope, userPreferenceRepository, chartRepository, orgUnitRepository, translationService, pivotTableRepository, systemSettingRepository);
             scope.$apply();
         };

         var getReport = function (options) {
             return [_.merge({
               name: "ReportName",
               title: "Title1",
               dataset: "ds1",
               columns: [{
                   items: [{
                       id: dataElementId,
                       name: dataElementName,
                       description: ''
                   }]
               }]
             }, options)];
         };

         var getExpectedValues = function (options) {
             return [_.merge({
                 "moduleName": 'op1 - mod1',
                 "dataElementId": dataElementId,
                 "dataElementName": translatedDataElementName,
                 "dataElementDescription": translatedDataElementDescription,
                 "weeklyData": {
                     "weekA": {
                         "value": 24,
                         "standardDeviation": 0,
                         "mean": 24,
                         "max": 24
                     }
                 },
                 "showInNotifications": false
             }, options)];
         };

         it("should get all charts and generate notifications", function() {
             expectedValues = getExpectedValues();
             notificationReports = getReport();

             chartRepository.getAllChartsForNotifications.and.returnValue(utils.getPromise(q, notificationReports));
             initiateNotificationController();
             expect(scope.weeks[0].name).toEqual("weekA");
             expect(scope.allDataElementValues).toEqual(expectedValues);
         });
         
         it('should get all pivotTables', function () {
             notificationReports = getReport();
             pivotTableRepository.getPivotTablesForNotifications.and.returnValue(utils.getPromise(q, notificationReports));
             initiateNotificationController();
             expect(pivotTableRepository.getPivotTablesForNotifications).toHaveBeenCalled();
             expect(chartRepository.getAllChartsForNotifications).not.toHaveBeenCalled();
         });

         it('should translate data element names and descriptions', function () {
             translatedDataElementName = "translatedDataElementName";
             var dataElementId = "dataElementId";
             expectedValues = getExpectedValues({
                 dataElementName: translatedDataElementName,
                 dataElementId: dataElementId,
                 dataElementDescription: translatedDataElementDescription
             });

             notificationReports = getReport();

             chartRepository.getAllChartsForNotifications.and.returnValue(utils.getPromise(q, notificationReports));
             pivotTableRepository.getPivotTableData.and.returnValue(utils.getPromise(q, pivotTableData));
             initiateNotificationController();

             expect(scope.allDataElementValues).toEqual(expectedValues);
             expect(translationService.getTranslationForProperty).toHaveBeenCalledWith(dataElementId, 'name', dataElementName);
             expect(translationService.getTranslationForProperty).toHaveBeenCalledWith(dataElementId, 'description', dataElementDescription);
         });
     });
 });
