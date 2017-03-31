define(['dateUtils', 'lodash', 'metadataConf'], function(dateUtils, _, metadataConf) {
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

    var add_indicator_and_program_indicator_stores = function(db, tx) {
        create_data_store(["indicators", "programIndicators"], db);
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

    var create_data_sync_failure = function(db) {
        var dataSyncFailureStore = create_store_with_key("dataSyncFailure", ["moduleId", "period"], db);
    };

    var delete_org_unit_level_data_store = function(db) {
        db.deleteObjectStore("organisationUnitLevels");
    };

    var delete_pivot_table_data_and_chart_data_changelog = function (db, tx) {
        var changeLogStore = tx.objectStore("changeLog");
        changeLogStore.openCursor().onsuccess = function (e) {
            var cursor = e.target.result;
            if (cursor) {
                var type = cursor.value.type;
                if (_.startsWith(type, "chartData:") || _.startsWith(type, "pivotTableData:")) {
                    cursor.delete();
                }
                cursor.continue();
            }
        };
    };

    var create_chart_definitions_store = function (db) {
        create_store_with_key('chartDefinitions', 'id', db);
    };

    var create_pivot_table_definitions_store = function (db) {
        create_store_with_key('pivotTableDefinitions', 'id', db);
    };

    var migrate_data_between_stores = function (tx, oldStoreName, newStoreName, callback) {
        var oldStore = tx.objectStore(oldStoreName),
            newStore = tx.objectStore(newStoreName);

        oldStore.openCursor().onsuccess = function (e) {
            var cursor = e.target.result;
            if (cursor) {
                var record = cursor.value;
                newStore.put(record).onsuccess = function() {
                    cursor.continue();
                };
            } else {
                callback();
            }
        };
    };

    var migrate_and_delete_charts_store = function (db, tx) {
        migrate_data_between_stores(tx, 'charts', 'chartDefinitions', function() {
            db.deleteObjectStore('charts');
        });
    };

    var migrate_and_delete_pivot_table_store = function (db, tx) {
        migrate_data_between_stores(tx, 'pivotTables', 'pivotTableDefinitions', function() {
            db.deleteObjectStore('pivotTables');
        });
    };

    var create_excluded_line_list_options_store = function (db) {
        create_store_with_key('excludedLineListOptions', 'moduleId', db);
    };

    var force_pivot_tables_to_redownload = function (db, tx) {
        var changeLogStore = tx.objectStore("changeLog");
        changeLogStore.delete("pivotTables");
    };

    var force_charts_to_redownload = function (db, tx) {
        var changeLogStore = tx.objectStore("changeLog");
        changeLogStore.delete("charts");
    };

    var format_event_dates = function(db, tx) {
        var programEventStore = tx.objectStore('programEvents');
        programEventStore.openCursor().onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                var event = cursor.value;
                event.eventDate = dateUtils.toISODate(event.eventDate);
                cursor.update(event);
                cursor.continue();
            }
        };
    };

    var migrate_organisation_unit_data_set_association = function (db, tx) {
        var dataSetsStore = tx.objectStore("dataSets");
        var dataSets = {};
        var orgUnits = {};

        dataSetsStore.openCursor().onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
                var dataSet = cursor.value;
                dataSets[dataSet.id] =  dataSet.orgUnitIds;
                delete dataSet.orgUnitIds;
                delete dataSet.organisationUnits;
                cursor.update(dataSet);
                cursor.continue();
            } else {
                // On DataSet Cursor completion
                _.each(dataSets, function (orgUnitIds, dataSetId) {
                    _.each(orgUnitIds, function (orgUnitId) {
                        orgUnits[orgUnitId] = orgUnits[orgUnitId] || [];
                        orgUnits[orgUnitId].push({
                            id: dataSetId
                        });
                    });
                });
                var orgUnitStore = tx.objectStore('organisationUnits');
                orgUnitStore.getAll().onsuccess = function (e) {
                    var orgUnitsFromDB = e.target.result;
                    _.each(orgUnitsFromDB, function (orgUnitFromDB) {
                        orgUnitFromDB.dataSets = orgUnits[orgUnitFromDB.id] || [];
                        orgUnitStore.put(orgUnitFromDB);
                    });
                };
            }
        };
        dataSetsStore.deleteIndex('by_organisationUnit');
    };

    var delete_indices_for_chart_data_and_pivot_table_data = function (db, tx) {
        var chartDataStore = tx.objectStore('chartData');
        var pivotTableDataStore = tx.objectStore('pivotTableData');

        chartDataStore.deleteIndex('by_chart');
        pivotTableDataStore.deleteIndex('by_pivot_table');
    };

    var migrate_chart_and_pivot_table_keys_from_names_to_ids = function (db, tx) {
        var chartDefinitionsStore = tx.objectStore('chartDefinitions');
        var chartDataStore = tx.objectStore('chartData');

        var pivotTableDefinitionsStore = tx.objectStore('pivotTableDefinitions');
        var pivotTableDataStore = tx.objectStore('pivotTableData');

        chartDefinitionsStore.getAll().onsuccess = function (e) {
            var chartDefinitions = e.target.result;
            var chartNamesAndIdsMap = _.reduce(chartDefinitions, function (map, chartDefinition) {
                map[chartDefinition.name] = chartDefinition.id;
                return map;
            }, {});

            chartDataStore.getAll().onsuccess = function (e) {
                var chartData = e.target.result;
                _.each(chartData, function (chartDatum) {
                    var chartName = chartDatum.chart;
                    if(chartNamesAndIdsMap[chartName]) {
                        chartDatum.chart = chartNamesAndIdsMap[chartName];
                        chartDataStore.put(chartDatum);
                        chartDataStore.delete([chartName, chartDatum.orgUnit]);
                    }
                });
            };
        };

        pivotTableDefinitionsStore.getAll().onsuccess = function (e) {
            var pivotTableDefinitions = e.target.result;
            var pivotTableNamesAndIdsMap = _.reduce(pivotTableDefinitions, function (map, pivotTableDefinition) {
                map[pivotTableDefinition.name] = pivotTableDefinition.id;
                return map;
            }, {});

            pivotTableDataStore.getAll().onsuccess = function (e) {
                var pivotTableData = e.target.result;
                _.each(pivotTableData, function (pivotTableDatum) {
                    var pivotTableName = pivotTableDatum.pivotTable;
                    if(pivotTableNamesAndIdsMap[pivotTableName]) {
                        pivotTableDatum.pivotTable = pivotTableNamesAndIdsMap[pivotTableName];
                        pivotTableDataStore.put(pivotTableDatum);
                        pivotTableDataStore.delete([pivotTableName, pivotTableDatum.orgUnit]);
                    }
                });
            };
        };
    };

    var add_custom_attributes_store = function (db, tx) {
        create_store_with_key("attributes", "id", db);
    };

    var add_user_roles_store = function (db, tx) {
        create_store_with_key("userRoles", "id", db);
    };

    var update_change_log_keys = function (db, tx) {
        var changeLogKeyMapper = {'orgUnits': 'organisationUnits', 'orgUnitGroups': 'organisationUnitGroups', 'datasets': 'dataSets'};
        var changeLogStore = tx.objectStore('changeLog');
        Object.keys(changeLogKeyMapper).forEach(function (key) {
            var request = changeLogStore.get(key);
            request.onsuccess = function (e) {
                var changeLog = e.target.result;
                if (changeLog) {
                    changeLogStore.delete(key);
                    changeLogStore.put({
                        'type': changeLogKeyMapper[key],
                        'lastUpdatedTime': changeLog.lastUpdatedTime
                    });
                }
            };
        });
    };

    var migrate_metadata_change_log = function (db, tx) {
        var changeLogStore = tx.objectStore('changeLog');
        var req = changeLogStore.get('metaData');
        req.onsuccess = function (e) {
            var metaDataChangeLog = e.target.result;
            if (metaDataChangeLog) {
                metadataConf.entities
                    .filter(function (entity) {
                        return !_.includes(['userRoles', 'attributes', 'indicators', 'programIndicators'], entity);
                    })
                    .forEach(function (entityType) {
                        changeLogStore.put({
                            'type': entityType,
                            'lastUpdatedTime': metaDataChangeLog.lastUpdatedTime
                        });
                    });
            }
        };
    };

    var force_charts_and_reports_to_redownload = function (db, tx) {
        var changeLogStore = tx.objectStore("changeLog");
        changeLogStore.delete("charts");
        changeLogStore.delete("pivotTables");
    };

    var delete_local_user_credentials_store = function(db) {
        db.deleteObjectStore("localUserCredentials");
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
        delete_keys_chart_and_reports_from_changelog,
        create_data_sync_failure,
        delete_org_unit_level_data_store,
        delete_pivot_table_data_and_chart_data_changelog,
        create_chart_definitions_store,
        create_pivot_table_definitions_store,
        migrate_and_delete_charts_store,
        migrate_and_delete_pivot_table_store,
        delete_keys_chart_and_reports_from_changelog,
        force_pivot_tables_to_redownload,
        create_excluded_line_list_options_store,
        force_charts_to_redownload,
        format_event_dates,
        migrate_organisation_unit_data_set_association,
        delete_indices_for_chart_data_and_pivot_table_data,
        migrate_chart_and_pivot_table_keys_from_names_to_ids,
        delete_keys_chart_and_reports_from_changelog,
        add_indicator_and_program_indicator_stores,
        force_charts_and_reports_to_redownload,
        add_custom_attributes_store,
        add_user_roles_store,
        update_change_log_keys,
        migrate_metadata_change_log,
        delete_local_user_credentials_store
    ];
});
