 define(["notificationsController", "angularMocks", "utils", "userPreferenceRepository", "chartRepository"], function(NotificationsController, mocks, utils, UserPreferenceRepository, ChartRepository) {

     describe("notifications controller", function() {

         var notificationsController, userPreferenceRepository, chartRepository;

         beforeEach(mocks.inject(function($rootScope, $q) {
             scope = $rootScope.$new();
             q = $q;

             var userModules = [{
                 "name": "mod1",
                 "id": "mod1",
                 "parent": {
                     "name": 'op1'
                 }
             }];

             var charts = [{
                 "name": "chart1",
                 "title": "Title1",
                 "dataset": "ds1",
             }];

             var chartData1 = {
                 "metaData": {
                     "pe": ["2015W25", "2015W26", "2015W27", "2015W28", "2015W29"],
                     "ou": ["a2cf79e8f13"],
                     "names": {
                         "a3267f05ab8": "New Admission - Emergency Department - Admission - Pediatric IPD Ward",
                         "a9aa44b4f72": "New Admission - Other Facilities - Admission - Pediatric IPD Ward",
                         "a7fe8834446": "Referred-in Admission - Intensive Care Unit - Admission - Pediatric IPD Ward",
                         "a355d74e43f": "Referred-in Admission - Other Wards - Admission - Pediatric IPD Ward",
                         "ou": "Organisation unit"
                     }
                 },
                 "rows": [
                     ["a3267f05ab8", "2015W26", "48.0"],
                     ["a3267f05ab8", "2015W27", "40.0"],
                     ["a9aa44b4f72", "2015W26", "36.0"],
                     ["a7fe8834446", "2015W26", "12.0"],
                     ["a355d74e43f", "2015W26", "24.0"]
                 ]
             };

             userPreferenceRepository = new UserPreferenceRepository();
             spyOn(userPreferenceRepository, "getUserModules").and.returnValue(utils.getPromise(q, userModules));

             chartRepository = new ChartRepository();
             spyOn(chartRepository, "getAllChartsForNotifications").and.returnValue(utils.getPromise(q, charts));
             spyOn(chartRepository, "getDataForChart");
             chartRepository.getDataForChart.and.callFake(function(chartName, orgUnit) {
                 if (chartName === 'chart1')
                     return utils.getPromise(q, chartData1);
             });

             notificationsController = new NotificationsController(scope, q, userPreferenceRepository, chartRepository);
         }));

         it("should get all charts and generate notifications", function() {
             var expectedValues = [{
                 "moduleName": 'op1 - mod1',
                 "dataElementId": 'a3267f05ab8',
                 "dataElementName": 'New Admission - Emergency Department - Admission - Pediatric IPD Ward',
                 "weeklyData": {
                     "2015W25": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     },
                     "2015W26": {
                         "value": 48,
                         "standardDeviation": 0,
                         "mean": 48,
                         "min": 48,
                         "max": 48
                     },
                     "2015W27": {
                         "value": 40,
                         "standardDeviation": 5,
                         "mean": 44,
                         "min": 39,
                         "max": 49
                     },
                     "2015W28": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     }
                 },
                 "showInNotifications": false
             }, {
                 "moduleName": 'op1 - mod1',
                 "dataElementId": 'a9aa44b4f72',
                 "dataElementName": 'New Admission - Other Facilities - Admission - Pediatric IPD Ward',
                 "weeklyData": {
                     "2015W25": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     },
                     "2015W26": {
                         "value": 36,
                         "standardDeviation": 0,
                         "mean": 36,
                         "min": 36,
                         "max": 36
                     },
                     "2015W27": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     },
                     "2015W28": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     }
                 },
                 "showInNotifications": false
             }, {
                 "moduleName": 'op1 - mod1',
                 "dataElementId": 'a7fe8834446',
                 "dataElementName": 'Referred-in Admission - Intensive Care Unit - Admission - Pediatric IPD Ward',
                 "weeklyData": {
                     "2015W25": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     },
                     "2015W26": {
                         "value": 12,
                         "standardDeviation": 0,
                         "mean": 12,
                         "min": 12,
                         "max": 12
                     },
                     "2015W27": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     },
                     "2015W28": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     }
                 },
                 "showInNotifications": false
             }, {
                 "moduleName": 'op1 - mod1',
                 "dataElementId": 'a355d74e43f',
                 "dataElementName": 'Referred-in Admission - Other Wards - Admission - Pediatric IPD Ward',
                 "weeklyData": {
                     "2015W25": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     },
                     "2015W26": {
                         "value": 24,
                         "standardDeviation": 0,
                         "mean": 24,
                         "min": 24,
                         "max": 24
                     },
                     "2015W27": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     },
                     "2015W28": {
                         "value": '-',
                         "standardDeviation": undefined,
                         "mean": undefined,
                         "min": undefined,
                         "max": undefined
                     }
                 },
                 "showInNotifications": false
             }];

             scope.$apply();
             expect(scope.weeks).toEqual(["2015W25", "2015W26", "2015W27", "2015W28"]);
             expect(scope.allDataElementValues).toEqual(expectedValues);

         });

     });
 });
