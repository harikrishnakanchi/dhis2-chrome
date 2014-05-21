define(["hustle"], function(h) {
    var init = function() {
        var hustle = new Hustle({
            db_name: 'hustle',
            db_version: 1,
            tubes: ['dataValues']
        });

        hustle.open({
            success: function() {
                console.debug('Hustle initiated.');

            },
            error: function(e) {
                console.debug('Hustle initiation failed!', e);
            }
        });
    };

    return {
        "init": init
    };
});