define([], function() {
    var create_data_store = function(stores, db) {
        _.each(stores, function(type) {
            db.createObjectStore(type, {
                keyPath: "id"
            });
        });
    };

    var create_store_with_key = function(storeName, key, db) {
        return db.createObjectStore(storeName, {
            keyPath: key
        });
    };

    var get_data_store = function(storeName, transaction) {
        return transaction.objectStore(storeName);
    };

    var create_index = function(store, indexName, key, isUnique, multiEntry) {
        store.createIndex(indexName, key, {
            "unique": isUnique,
            "multiEntry": multiEntry || false
        });
    };

    var add_object_stores = function(db, tx) {
        syncable_types = ["categories", "categoryCombos", "categoryOptionCombos", "categoryOptions", "dataElements", "sections", "programStages", "optionSets", "organisationUnitLevels"];
        create_data_store(syncable_types, db);
    };

    var add_system_settings_store = function(db, tx) {
        create_store_with_key("systemSettings", "key", db);
    };

    var add_patient_origin_store = function(db, tx) {
        create_store_with_key("patientOrigin", "orgUnit", db);
    };

    var add_excluded_dataelements_store = function(db, tx) {
        create_store_with_key("excludedDataElements", "orgUnit", db);
    };

    var change_log_stores = function(db, tx) {
        create_store_with_key("changeLog", "type", db);
    };

    var create_datavalues_store = function(db, tx) {
        var dataValueStore = create_store_with_key("dataValues", ["period", "orgUnit"], db);
        create_index(dataValueStore, "by_period", "period", false);
        create_index(dataValueStore, "by_organisationUnit", "orgUnit", false);
    };

    var add_user_store_for_dhis_users = function(db, tx) {
        create_store_with_key("users", "userCredentials.username", db);
    };

    var add_local_user_credentials_store = function(db, tx) {
        create_store_with_key("localUserCredentials", "username", db);
    };

    var add_super_admin_user_to_local_cred_store = function(db, tx) {
        var credStore = tx.objectStore("localUserCredentials");
        credStore.add({
            "username": "superadmin",
            "password": "ab68c10cba3dc84c263912bf350d4cb4"
        });
        var userStore = tx.objectStore("users");
        userStore.add({
            "userCredentials": {
                "username": "superadmin",
                "userRoles": [{
                    "name": "Superadmin"
                }],
                "disabled": false
            }
        });
    };
    var add_admin_user_to_local_cred_store = function(db, tx) {
        var credStore = tx.objectStore("localUserCredentials");
        credStore.add({
            "username": "msfadmin",
            "password": "f6b30a5547c4062f915aafd3e4e6453a"
        });
        var userStore = tx.objectStore("users");
        userStore.add({
            "userCredentials": {
                "username": "msfadmin",
                "userRoles": [{
                    "name": "Superuser"
                }],
                "disabled": false
            }
        });
    };

    var change_msfadmin_to_projectadmin = function(db, tx) {
        var credStore = tx.objectStore("localUserCredentials");
        credStore.delete("msfadmin");
        credStore.add({
            "username": "projectadmin",
            "password": "f6b30a5547c4062f915aafd3e4e6453a"
        });
        var userStore = tx.objectStore("users");
        userStore.delete("projectadmin");
        userStore.add({
            "userCredentials": {
                "username": "projectadmin",
                "userRoles": [{
                    "name": "Superuser"
                }],
                "disabled": false
            }
        });
    };

    var add_project_user_to_local_cred_store = function(db, tx) {
        var userStore = tx.objectStore("localUserCredentials");
        userStore.add({
            "username": "project_user",
            "password": "caa63a86bbc63b2ae67ef0a069db7fb9"
        });
    };

    var add_user_preference_store = function(db, tx) {
        var userPrefenreceStore = create_store_with_key("userPreferences", "username", db);
    };

    var add_translation_store = function(db, tx) {
        var translationsStore = create_store_with_key("translations", ["objectUid", "locale"], db);
        create_index(translationsStore, "by_locale", "locale", false);
    };

    var add_approval_store = function(db, tx) {
        var approvalDataSetsStore = create_store_with_key("approvals", ["period", "orgUnit"], db);
        create_index(approvalDataSetsStore, "by_period", "period", false);
    };

    var add_programs_store = function(db, tx) {
        var programStore = create_store_with_key("programs", "id", db);
        create_index(programStore, "by_organisationUnit", "orgUnitIds", false, true);
    };

    var add_org_unit_store = function(db, tx) {
        var orgUnitStore = create_store_with_key("organisationUnits", "id", db);
        create_index(orgUnitStore, "by_parent", "parentId", false, true);
    };

    var add_program_events_store = function(db, tx) {
        var programEventsStore = create_store_with_key("programEvents", "event", db);
        create_index(programEventsStore, "by_program_orgunit_period", ["program", "orgUnit", "period"], false);
        create_index(programEventsStore, "by_program_orgunit_status", ["program", "orgUnit", "localStatus"], false);
        create_index(programEventsStore, "by_event_code", "eventCode", false);
        create_index(programEventsStore, "by_event_date", "eventDate", false);
        create_index(programEventsStore, "by_organisationUnit", "orgUnit", false);
        create_index(programEventsStore, "by_period", "period", false);
    };

    var add_org_unit_group_store = function(db, tx) {
        create_store_with_key("orgUnitGroups", "id", db);
    };

    var add_dataset_store = function(db, tx) {
        var datasetStore = create_store_with_key("dataSets", "id", db);
        create_index(datasetStore, "by_organisationUnit", "orgUnitIds", false, true);
    };

    var add_organisation_unit_group_sets_store = function(db, txt) {
        create_store_with_key("organisationUnitGroupSets", "id", db);
    };

    var add_chart_store = function(db, txt) {
        create_store_with_key("charts", "name", db);
    };

    var add_chart_data_store = function(db, txt) {
        var chartDataStore = create_store_with_key("chartData", ["chart", "orgUnit"], db);
        create_index(chartDataStore, "by_chart", "chart", false);
    };

    var add_dataElementGroup_store = function(db, txt) {
        create_store_with_key("dataElementGroups", "id", db);
    };

    var add_referral_locations_store = function(db, txt) {
        create_store_with_key("referralLocations", "orgUnit", db);
    };

    var add_organisation_unit_index_by_level = function(db, txt) {
        var orgUnitStore = get_data_store("organisationUnits", txt);
        create_index(orgUnitStore, "by_level", "level", false);
    };

    var add_pivot_table_store = function(db, txt) {
        create_store_with_key("pivotTables", "name", db);
    };

    var add_pivot_table_data_store = function(db, txt) {
        var pivotTableDataStore = create_store_with_key("pivotTableData", ["pivotTable", "orgUnit"], db);
        create_index(pivotTableDataStore, "by_pivot_table", "pivotTable", false);
    };

    var delete_keys_from_changelog = function(db, txt) {
        var changeLogStore = txt.objectStore("changeLog");
        changeLogStore.delete("metaData");
        changeLogStore.delete("datasets");
        changeLogStore.delete("programs");
    };

    var clear_metadata_objectstores = function(db, txt) {
        txt.objectStore("dataSets").clear();
        txt.objectStore("programs").clear();
        txt.objectStore("categories").clear();
        txt.objectStore("categoryCombos").clear();
        txt.objectStore("categoryOptionCombos").clear();
        txt.objectStore("categoryOptions").clear();
        txt.objectStore("dataElements").clear();
        txt.objectStore("sections").clear();
        txt.objectStore("programStages").clear();
        txt.objectStore("optionSets").clear();
        txt.objectStore("dataElementGroups").clear();

        var changeLogStore = txt.objectStore("changeLog");
        changeLogStore.delete("metaData");
        changeLogStore.delete("datasets");
        changeLogStore.delete("programs");
    };

    var recreate_translations_store = function(db, tx) {
        db.deleteObjectStore("translations");
        var translationsStore = create_store_with_key("translations", "id", db);
        create_index(translationsStore, "by_locale", "locale", false);
    };

    var delete_program_stages_store = function(db, tx) {
        db.deleteObjectStore("programStages");
    };

    var update_translations_store = function(db, tx) {
        var translationStore = tx.objectStore("translations");
        translationStore.openCursor().onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                var data = cursor.value;
                data.objectId = data.objectUid;
                delete data.objectUid;
                cursor.update(data);
                cursor.continue();
            }
        };
    };

    var change_role_to_projectadmin = function(db, tx) {
        var userStore = tx.objectStore("users");
        userStore.delete("msfadmin");
        userStore.openCursor().onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                var data = cursor.value;
                if(data.userCredentials.username == "projectadmin") {
                    data.userCredentials.userRoles[0].name = "Projectadmin";
                    cursor.update(data);
                }
                cursor.continue();
            }
        };
    };

    var delete_keys_chart_and_reports_from_changelog = function (db, tx) {
        var changeLogStore = tx.objectStore("changeLog");
        changeLogStore.delete("charts");
        changeLogStore.delete("pivotTables");
    };

    return [add_object_stores,
        change_log_stores,
        create_datavalues_store,
        add_user_store_for_dhis_users,
        add_local_user_credentials_store,
        add_admin_user_to_local_cred_store,
        add_project_user_to_local_cred_store,
        add_translation_store,
        add_org_unit_group_store,
        add_system_settings_store,
        add_user_preference_store,
        add_approval_store,
        add_programs_store,
        add_program_events_store,
        add_dataset_store,
        add_org_unit_store,
        add_patient_origin_store,
        add_organisation_unit_group_sets_store,
        add_chart_store,
        add_chart_data_store,
        add_dataElementGroup_store,
        add_referral_locations_store,
        add_organisation_unit_index_by_level,
        add_pivot_table_store,
        add_pivot_table_data_store,
        add_excluded_dataelements_store,
        add_super_admin_user_to_local_cred_store,
        change_msfadmin_to_projectadmin,
        delete_keys_from_changelog,
        clear_metadata_objectstores,
        recreate_translations_store,
        delete_program_stages_store,
        delete_keys_from_changelog,
        update_translations_store,
        change_role_to_projectadmin,
        delete_keys_chart_and_reports_from_changelog
    ];
});