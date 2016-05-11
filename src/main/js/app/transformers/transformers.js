define(['translationsService'],function(translationsService){
    var init = function (app){
      app.service("translationsService", ['$q', '$indexedDB', translationsService]);
    };

    return {
        init: init
    };
});