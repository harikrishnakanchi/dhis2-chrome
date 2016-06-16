define(['translationsService'],function(translationsService){
    var init = function (app){
      app.service("translationsService", ['$q', '$indexedDB', '$rootScope', 'ngI18nResourceBundle', 'systemSettingRepository',translationsService]);
    };

    return {
        init: init
    };
});