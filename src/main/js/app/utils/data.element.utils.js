define([], function () {

    var getDisplayName = function (dataElement) {
        return dataElement.formName || dataElement.name;
    };

    return {
        getDisplayName: getDisplayName
    };
});