 define(["notificationsController", "angularMocks", "utils", "userPreferenceRepository", "chartRepository", "orgUnitRepository", "translationsService", "pivotTableRepository", "systemSettingRepository"], function(NotificationsController, mocks, utils, UserPreferenceRepository, ChartRepository, OrgUnitRepository, TranslationService, PivotTableRepository, SystemSettingRepository) {

     describe("notifications controller", function() {

         var notificationsController, userPreferenceRepository, chartRepository, orgUnitRepository,
             userModules, notificationReports, chartData, rootScope, expectedValues, translationService, pivotTableRepository, systemSettingRepository, dataElementId, dataElementName, q;

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
                 return defaultValue;
             });

             pivotTableRepository = new PivotTableRepository();
             spyOn(pivotTableRepository, 'getPivotTablesForNotifications').and.returnValue(utils.getPromise(q, []));

             systemSettingRepository = new SystemSettingRepository();
             spyOn(systemSettingRepository, 'getStandardDeviationValue').and.returnValue(utils.getPromise(q, undefined));
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
                 "dataElementName": dataElementName,
                 "dataElementDescription": '',
                 "weeklyData": {
                     "2015W25": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "max": undefined
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
             expect(scope.weeks).toEqual(["2015W25"]);
             expect(scope.allDataElementValues).toEqual(expectedValues);
         });
         
         it('should get all pivotTables', function () {
             notificationReports = getReport();
             pivotTableRepository.getPivotTablesForNotifications.and.returnValue(utils.getPromise(q, notificationReports));
             initiateNotificationController();
             expect(pivotTableRepository.getPivotTablesForNotifications).toHaveBeenCalled();
             expect(chartRepository.getAllChartsForNotifications).not.toHaveBeenCalled();
         });

         it("should assign description of data element if it is present in chart", function () {
             expectedValues = getExpectedValues({dataElementDescription: 'some description'});

             notificationReports = getReport({columns: [ {
                 items: [ {
                     description: "some description"
                 }]
             }]});

             chartRepository.getAllChartsForNotifications.and.returnValue(utils.getPromise(q, notificationReports));

             initiateNotificationController();

             expect(scope.weeks).toEqual(["2015W25"]);
             expect(scope.allDataElementValues).toEqual(expectedValues);
         });

         it('should translate data element names', function () {
             var translatedDataElementName = "translatedDataElementName";
             var dataElementId = "dataElementId";
             expectedValues = getExpectedValues({
                 dataElementName: translatedDataElementName,
                 dataElementId: dataElementId
             });

             notificationReports = getReport();

             chartRepository.getAllChartsForNotifications.and.returnValue(utils.getPromise(q, notificationReports));
             translationService.getTranslationForProperty.and.returnValue(translatedDataElementName);
             initiateNotificationController();

             expect(scope.allDataElementValues).toEqual(expectedValues);
             expect(translationService.getTranslationForProperty).toHaveBeenCalledWith(dataElementId, 'name', dataElementName);
         });
     });
 });
