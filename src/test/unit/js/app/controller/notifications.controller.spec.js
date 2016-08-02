 define(["notificationsController", "angularMocks", "utils", "userPreferenceRepository", "chartRepository", "orgUnitRepository", "translationsService"], function(NotificationsController, mocks, utils, UserPreferenceRepository, ChartRepository, OrgUnitRepository, TranslationService) {

     describe("notifications controller", function() {

         var notificationsController, userPreferenceRepository, chartRepository, orgUnitRepository,
             userModules, charts, chartData, rootScope, expectedValues, translationService, dataElementId, dataElementName;

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

             rootScope.hasRoles = jasmine.createSpy("hasRoles").and.returnValue(false);

             userPreferenceRepository = new UserPreferenceRepository();
             spyOn(userPreferenceRepository, "getCurrentUsersModules").and.returnValue(utils.getPromise(q, userModules));

             orgUnitRepository = new OrgUnitRepository();
             spyOn(orgUnitRepository, "getAllModulesInOrgUnits").and.returnValue(utils.getPromise(q, userModules));

             chartRepository = new ChartRepository();
             spyOn(chartRepository, "getAllChartsForNotifications").and.returnValue(utils.getPromise(q, []));
             spyOn(chartRepository, "getDataForChart");

             chartRepository.getDataForChart.and.callFake(function(chartName, orgUnit) {
                 if (chartName === 'chart1')
                     return utils.getPromise(q, chartData);
             });

             translationService = new TranslationService();
             spyOn(translationService, 'getTranslationForProperty').and.callFake(function (objectId, property, defaultValue) {
                 return defaultValue;
             });
         }));

         var initiateNotificationController = function () {
             notificationsController = new NotificationsController(scope, q, rootScope, userPreferenceRepository, chartRepository, orgUnitRepository, translationService);
             scope.$apply();
         };

         var getChart = function (options) {
             return [_.merge({
               name: "chart1",
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
             charts = getChart();

             chartRepository.getAllChartsForNotifications.and.returnValue(utils.getPromise(q, charts));
             initiateNotificationController();
             expect(scope.weeks).toEqual(["2015W25"]);
             expect(scope.allDataElementValues).toEqual(expectedValues);
         });

         it("should assign description of data element if it is present in chart", function () {
             expectedValues = getExpectedValues({dataElementDescription: 'some description'});

             charts = getChart({columns: [ {
                 items: [ {
                     description: "some description"
                 }]
             }]});

             chartRepository.getAllChartsForNotifications.and.returnValue(utils.getPromise(q, charts));

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

             charts = getChart();

             chartRepository.getAllChartsForNotifications.and.returnValue(utils.getPromise(q, charts));
             translationService.getTranslationForProperty.and.returnValue(translatedDataElementName);
             initiateNotificationController();

             expect(scope.allDataElementValues).toEqual(expectedValues);
             expect(translationService.getTranslationForProperty).toHaveBeenCalledWith(dataElementId, 'name', dataElementName);
         });
     });
 });
