 define(["notificationsController", "angularMocks", "utils", "userPreferenceRepository", "chartRepository", "orgUnitRepository"], function(NotificationsController, mocks, utils, UserPreferenceRepository, ChartRepository, OrgUnitRepository) {

     describe("notifications controller", function() {

         var notificationsController, userPreferenceRepository, chartRepository, orgUnitRepository,
             userModules, charts, chartData, rootScope, expectedValues;

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

             chartData = {
                 "metaData": {
                     "pe": ["2015W25", "2015W26"],
                     "ou": ["a2cf79e8f13"],
                     "names": {
                         "a3267f05ab8": "New Admission - Emergency Department - Admission - Pediatric IPD Ward",
                         "ou": "Organisation unit"
                     }
                 },
                 "rows": [
                     ["a3267f05ab8", "2015W26", "24.0"]
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
         }));

         var initiateNotificationController = function () {
             notificationsController = new NotificationsController(scope, q, rootScope, userPreferenceRepository, chartRepository, orgUnitRepository);
             scope.$apply();
         };

         var getChart = function (options) {
             return [_.merge({
               name: "chart1",
               title: "Title1",
               dataset: "ds1",
               columns: [{
                   items: [{
                       id: "a3267f05ab8",
                       name: "New Admission - Emergency Department - Admission - Pediatric IPD Ward",
                       description: ''
                   }]
               }]
             }, options)];
         };

         var getExpectedValues = function (options) {
             return [_.merge({
                 "moduleName": 'op1 - mod1',
                 "dataElementId": 'a3267f05ab8',
                 "dataElementName": 'New Admission - Emergency Department - Admission - Pediatric IPD Ward',
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
     });
 });
