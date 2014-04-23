define([], function() {
    var create_data_store = function(stores, db) {
        _.each(stores, function(type) {
            db.createObjectStore(type, {
                keyPath: "id"
            });
        });
    };

    var create_store_with_key = function(store, key, db) {
        db.createObjectStore(store, {
            keyPath: key
        });
    };

    var add_object_stores = function(db, tx) {
        const syncable_types = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "dataSets", "sections"];
        create_data_store(syncable_types, db);
    };

    var change_log_stores = function(db, tx) {
        create_store_with_key("changeLog", "type", db);
    };

    var create_datavalues_store = function(db, tx) {
        create_store_with_key("dataValues", "period", db);
    };

    var add_organisation_units_and_level_store = function(db, tx) {
        const syncable_types = ["organisationUnits", "organisationUnitLevels"];
        create_data_store(syncable_types, db);
    };

    var add_users_store = function(db, tx) {
        create_store_with_key("users", "username", db);
    };

    var add_admin_user = function(db, tx) {
        var userStore = tx.objectStore("users");
        userStore.add({
            'username': 'admin',
            'password': '161ebd7d45089b3446ee4e0d86dbcf92'
        });
    };

    return [add_object_stores, change_log_stores, add_organisation_units_and_level_store, create_datavalues_store, add_users_store, add_admin_user];
});