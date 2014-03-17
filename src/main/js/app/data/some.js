define([], function() {
    return {
        some: {
            "created": "2014-03-12T12:32:12.484+0000",
            "concepts": [{
                "name": "default",
                "created": "2014-03-12T12:29:22.852+0000",
                "lastUpdated": "2014-03-12T12:29:22.852+0000",
                "id": "gpW8EiwwoYB"
            }],
            "users": [{
                "name": "admin admin",
                "created": "2014-03-12T12:29:51.845+0000",
                "lastUpdated": "2014-03-12T12:29:51.845+0000",
                "surname": "admin",
                "firstName": "admin",
                "userCredentials": {
                    "code": "admin",
                    "name": "admin admin",
                    "created": "2014-03-12T12:29:51.901+0000",
                    "username": "admin",
                    "userAuthorityGroups": [{
                        "name": "Superuser",
                        "created": "2014-03-12T12:29:51.885+0000",
                        "lastUpdated": "2014-03-12T12:29:51.885+0000",
                        "id": "BT6jHaIkXT4"
                    }],
                    "lastLogin": "2014-03-12T12:32:12.441+0000",
                    "selfRegistered": false,
                    "disabled": false
                },
                "id": "tTZpqEV6fZ7"
            }],
            "userRoles": [{
                "name": "Superuser",
                "created": "2014-03-12T12:29:51.885+0000",
                "lastUpdated": "2014-03-12T12:29:51.885+0000",
                "authorities": ["F_CHART_PUBLIC_ADD", "F_METADATA_SUBSET_IMPORT", "F_DASHBOARD_PUBLIC_ADD", "F_MAP_PUBLIC_ADD", "ALL", "F_CHART_EXTERNAL", "F_APPROVE_DATA_LOWER_LEVELS", "F_METADATA_EXPORT", "F_METADATA_IMPORT", "F_REPORTTABLE_PUBLIC_ADD", "F_REPORTTABLE_EXTERNAL", "F_APPROVE_DATA", "F_METADATA_SUBSET_EXPORT", "F_MAP_EXTERNAL", "F_USERGROUP_PUBLIC_ADD"],
                "id": "BT6jHaIkXT4"
            }],
            "categories": [{
                "name": "default",
                "created": "2014-03-12T12:29:23.291+0000",
                "lastUpdated": "2014-03-12T12:29:23.421+0000",
                "shortName": "default",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "default",
                    "created": "2014-03-12T12:29:23.260+0000",
                    "lastUpdated": "2014-03-12T12:29:23.344+0000",
                    "id": "Cq6KMaB1aiS"
                }],
                "dataDimension": false,
                "id": "Uofbss6JcIj"
            }, {
                "name": "Default Age",
                "created": "2014-03-12T12:30:14.548+0000",
                "lastUpdated": "2014-03-12T12:30:14.558+0000",
                "shortName": "Default Age",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "<5 years",
                    "created": "2014-03-12T12:30:13.106+0000",
                    "lastUpdated": "2014-03-12T12:30:13.128+0000",
                    "id": "lessThan5Yr"
                }, {
                    "name": ">=5 years",
                    "created": "2014-03-12T12:30:13.133+0000",
                    "lastUpdated": "2014-03-12T12:30:13.144+0000",
                    "id": "gr8Eq5Yrs"
                }],
                "dataDimension": false,
                "id": "DefaultAge"
            }, {
                "name": "Vaccination Age 1",
                "created": "2014-03-12T12:30:14.563+0000",
                "lastUpdated": "2014-03-12T12:30:14.570+0000",
                "shortName": "Vaccination Age 1",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "0-11 months",
                    "created": "2014-03-12T12:30:13.179+0000",
                    "lastUpdated": "2014-03-12T12:30:13.189+0000",
                    "id": "0To11Mnth"
                }, {
                    "name": "12-23 months",
                    "created": "2014-03-12T12:30:13.227+0000",
                    "lastUpdated": "2014-03-12T12:30:13.239+0000",
                    "id": "12To23Mnth"
                }, {
                    "name": "24 - 59 months",
                    "created": "2014-03-12T12:30:13.260+0000",
                    "lastUpdated": "2014-03-12T12:30:13.273+0000",
                    "id": "24To59Mnth"
                }, {
                    "name": ">=60 months",
                    "created": "2014-03-12T12:30:13.210+0000",
                    "lastUpdated": "2014-03-12T12:30:13.221+0000",
                    "id": "gr8Eq60Mnth"
                }],
                "dataDimension": false,
                "id": "VaccAge1"
            }, {
                "name": "Vaccination Age 2",
                "created": "2014-03-12T12:30:14.576+0000",
                "lastUpdated": "2014-03-12T12:30:14.593+0000",
                "shortName": "Vaccination Age 2",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "0-11 months",
                    "created": "2014-03-12T12:30:13.179+0000",
                    "lastUpdated": "2014-03-12T12:30:13.189+0000",
                    "id": "0To11Mnth"
                }, {
                    "name": "12-59 months",
                    "created": "2014-03-12T12:30:13.193+0000",
                    "lastUpdated": "2014-03-12T12:30:13.205+0000",
                    "id": "12To59Mnth"
                }, {
                    "name": ">=60 months",
                    "created": "2014-03-12T12:30:13.210+0000",
                    "lastUpdated": "2014-03-12T12:30:13.221+0000",
                    "id": "gr8Eq60Mnth"
                }],
                "dataDimension": false,
                "id": "VaccAge2"
            }, {
                "name": "Nutrition Age",
                "created": "2014-03-12T12:30:14.598+0000",
                "lastUpdated": "2014-03-12T12:30:14.606+0000",
                "shortName": "Nutrition Age",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "6 - 23 months",
                    "created": "2014-03-12T12:30:13.244+0000",
                    "lastUpdated": "2014-03-12T12:30:13.255+0000",
                    "id": "6To23Mnth"
                }, {
                    "name": "24 - 59 months",
                    "created": "2014-03-12T12:30:13.260+0000",
                    "lastUpdated": "2014-03-12T12:30:13.273+0000",
                    "id": "24To59Mnth"
                }],
                "dataDimension": false,
                "id": "NutAge"
            }, {
                "name": "Age LessThanOrGreaterThan15",
                "created": "2014-03-12T12:30:14.612+0000",
                "lastUpdated": "2014-03-12T12:30:14.620+0000",
                "shortName": "Age LessThanOrGreaterThan15",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "<5 years",
                    "created": "2014-03-12T12:30:13.106+0000",
                    "lastUpdated": "2014-03-12T12:30:13.128+0000",
                    "id": "lessThan5Yr"
                }, {
                    "name": ">=15 years",
                    "created": "2014-03-12T12:30:13.163+0000",
                    "lastUpdated": "2014-03-12T12:30:13.174+0000",
                    "id": "gr8Eq15Yrs"
                }, {
                    "name": "5 to 14 years",
                    "created": "2014-03-12T12:30:13.148+0000",
                    "lastUpdated": "2014-03-12T12:30:13.159+0000",
                    "id": "5To14Yrs"
                }],
                "dataDimension": false,
                "id": "LesOrGr815"
            }, {
                "name": "Migration Status",
                "created": "2014-03-12T12:30:14.623+0000",
                "lastUpdated": "2014-03-12T12:30:14.636+0000",
                "shortName": "Migration Status",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "Resident",
                    "created": "2014-03-12T12:30:13.278+0000",
                    "lastUpdated": "2014-03-12T12:30:13.292+0000",
                    "id": "Resident"
                }, {
                    "name": "Migrant",
                    "created": "2014-03-12T12:30:13.298+0000",
                    "lastUpdated": "2014-03-12T12:30:13.312+0000",
                    "id": "Migrant"
                }],
                "dataDimension": false,
                "id": "MigStatus"
            }, {
                "name": "Diagnosis",
                "created": "2014-03-12T12:30:14.645+0000",
                "lastUpdated": "2014-03-12T12:30:14.654+0000",
                "shortName": "Diagnosis",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "Primary",
                    "created": "2014-03-12T12:30:13.317+0000",
                    "lastUpdated": "2014-03-12T12:30:13.334+0000",
                    "id": "Primary"
                }, {
                    "name": "Secondary",
                    "created": "2014-03-12T12:30:13.358+0000",
                    "lastUpdated": "2014-03-12T12:30:13.376+0000",
                    "id": "Secondary"
                }],
                "dataDimension": false,
                "id": "Diagnosis"
            }, {
                "name": "Case Type",
                "created": "2014-03-12T12:30:14.658+0000",
                "lastUpdated": "2014-03-12T12:30:14.665+0000",
                "shortName": "Case Type",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "New",
                    "created": "2014-03-12T12:30:13.384+0000",
                    "lastUpdated": "2014-03-12T12:30:13.401+0000",
                    "id": "New"
                }, {
                    "name": "Follow-up",
                    "created": "2014-03-12T12:30:13.409+0000",
                    "lastUpdated": "2014-03-12T12:30:13.427+0000",
                    "id": "FollowUp"
                }],
                "dataDimension": false,
                "id": "CaseType"
            }, {
                "name": "Purpose of TT vaccination",
                "created": "2014-03-12T12:30:14.670+0000",
                "lastUpdated": "2014-03-12T12:30:14.677+0000",
                "shortName": "Purpose of TT vaccination",
                "dimensionType": "disaggregation",
                "categoryOptions": [{
                    "name": "Pregnancy",
                    "created": "2014-03-12T12:30:13.434+0000",
                    "lastUpdated": "2014-03-12T12:30:13.451+0000",
                    "id": "Pregnancy"
                }, {
                    "name": "Wounds",
                    "created": "2014-03-12T12:30:13.458+0000",
                    "lastUpdated": "2014-03-12T12:30:13.473+0000",
                    "id": "Wounds"
                }],
                "dataDimension": false,
                "id": "PurTTVacc"
            }],
            "categoryOptions": [{
                "name": "default",
                "created": "2014-03-12T12:29:23.260+0000",
                "lastUpdated": "2014-03-12T12:29:23.344+0000",
                "id": "Cq6KMaB1aiS"
            }, {
                "name": "<5 years",
                "created": "2014-03-12T12:30:13.106+0000",
                "lastUpdated": "2014-03-12T12:30:13.128+0000",
                "id": "lessThan5Yr"
            }, {
                "name": ">=5 years",
                "created": "2014-03-12T12:30:13.133+0000",
                "lastUpdated": "2014-03-12T12:30:13.144+0000",
                "id": "gr8Eq5Yrs"
            }, {
                "name": "5 to 14 years",
                "created": "2014-03-12T12:30:13.148+0000",
                "lastUpdated": "2014-03-12T12:30:13.159+0000",
                "id": "5To14Yrs"
            }, {
                "name": ">=15 years",
                "created": "2014-03-12T12:30:13.163+0000",
                "lastUpdated": "2014-03-12T12:30:13.174+0000",
                "id": "gr8Eq15Yrs"
            }, {
                "name": "0-11 months",
                "created": "2014-03-12T12:30:13.179+0000",
                "lastUpdated": "2014-03-12T12:30:13.189+0000",
                "id": "0To11Mnth"
            }, {
                "name": "12-59 months",
                "created": "2014-03-12T12:30:13.193+0000",
                "lastUpdated": "2014-03-12T12:30:13.205+0000",
                "id": "12To59Mnth"
            }, {
                "name": ">=60 months",
                "created": "2014-03-12T12:30:13.210+0000",
                "lastUpdated": "2014-03-12T12:30:13.221+0000",
                "id": "gr8Eq60Mnth"
            }, {
                "name": "12-23 months",
                "created": "2014-03-12T12:30:13.227+0000",
                "lastUpdated": "2014-03-12T12:30:13.239+0000",
                "id": "12To23Mnth"
            }, {
                "name": "6 - 23 months",
                "created": "2014-03-12T12:30:13.244+0000",
                "lastUpdated": "2014-03-12T12:30:13.255+0000",
                "id": "6To23Mnth"
            }, {
                "name": "24 - 59 months",
                "created": "2014-03-12T12:30:13.260+0000",
                "lastUpdated": "2014-03-12T12:30:13.273+0000",
                "id": "24To59Mnth"
            }, {
                "name": "Resident",
                "created": "2014-03-12T12:30:13.278+0000",
                "lastUpdated": "2014-03-12T12:30:13.292+0000",
                "id": "Resident"
            }, {
                "name": "Migrant",
                "created": "2014-03-12T12:30:13.298+0000",
                "lastUpdated": "2014-03-12T12:30:13.312+0000",
                "id": "Migrant"
            }, {
                "name": "Primary",
                "created": "2014-03-12T12:30:13.317+0000",
                "lastUpdated": "2014-03-12T12:30:13.334+0000",
                "id": "Primary"
            }, {
                "name": "Secondary",
                "created": "2014-03-12T12:30:13.358+0000",
                "lastUpdated": "2014-03-12T12:30:13.376+0000",
                "id": "Secondary"
            }, {
                "name": "New",
                "created": "2014-03-12T12:30:13.384+0000",
                "lastUpdated": "2014-03-12T12:30:13.401+0000",
                "id": "New"
            }, {
                "name": "Follow-up",
                "created": "2014-03-12T12:30:13.409+0000",
                "lastUpdated": "2014-03-12T12:30:13.427+0000",
                "id": "FollowUp"
            }, {
                "name": "Pregnancy",
                "created": "2014-03-12T12:30:13.434+0000",
                "lastUpdated": "2014-03-12T12:30:13.451+0000",
                "id": "Pregnancy"
            }, {
                "name": "Wounds",
                "created": "2014-03-12T12:30:13.458+0000",
                "lastUpdated": "2014-03-12T12:30:13.473+0000",
                "id": "Wounds"
            }],
            "categoryCombos": [{
                "name": "default",
                "created": "2014-03-12T12:29:23.308+0000",
                "lastUpdated": "2014-03-12T12:29:23.343+0000",
                "categories": [{
                    "name": "default",
                    "created": "2014-03-12T12:29:23.291+0000",
                    "lastUpdated": "2014-03-12T12:29:23.421+0000",
                    "id": "Uofbss6JcIj"
                }],
                "dimensionType": "disaggregation",
                "skipTotal": false,
                "id": "al8JpTTkOuk"
            }, {
                "name": "Default Age and Migration Status",
                "created": "2014-03-12T12:30:15.230+0000",
                "lastUpdated": "2014-03-12T12:30:15.238+0000",
                "categories": [{
                    "name": "Default Age",
                    "created": "2014-03-12T12:30:14.548+0000",
                    "lastUpdated": "2014-03-12T12:30:14.558+0000",
                    "id": "DefaultAge"
                }, {
                    "name": "Migration Status",
                    "created": "2014-03-12T12:30:14.623+0000",
                    "lastUpdated": "2014-03-12T12:30:14.636+0000",
                    "id": "MigStatus"
                }],
                "dimensionType": "disaggregation",
                "skipTotal": false,
                "id": "DefAgeMig"
            }, {
                "name": "Nutrition Age and Migration Status",
                "created": "2014-03-12T12:30:15.241+0000",
                "lastUpdated": "2014-03-12T12:30:15.250+0000",
                "categories": [{
                    "name": "Nutrition Age",
                    "created": "2014-03-12T12:30:14.598+0000",
                    "lastUpdated": "2014-03-12T12:30:14.606+0000",
                    "id": "NutAge"
                }, {
                    "name": "Migration Status",
                    "created": "2014-03-12T12:30:14.623+0000",
                    "lastUpdated": "2014-03-12T12:30:14.636+0000",
                    "id": "MigStatus"
                }],
                "dimensionType": "disaggregation",
                "skipTotal": false,
                "id": "NutrAgeMig"
            }, {
                "name": "Default Age",
                "created": "2014-03-12T12:30:15.253+0000",
                "lastUpdated": "2014-03-12T12:30:15.260+0000",
                "categories": [{
                    "name": "Default Age",
                    "created": "2014-03-12T12:30:14.548+0000",
                    "lastUpdated": "2014-03-12T12:30:14.558+0000",
                    "id": "DefaultAge"
                }],
                "dimensionType": "disaggregation",
                "skipTotal": false,
                "id": "DefAgeComb"
            }, {
                "name": "Vaccination Age 2",
                "created": "2014-03-12T12:30:15.263+0000",
                "lastUpdated": "2014-03-12T12:30:15.278+0000",
                "categories": [{
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:14.576+0000",
                    "lastUpdated": "2014-03-12T12:30:14.593+0000",
                    "id": "VaccAge2"
                }],
                "dimensionType": "disaggregation",
                "skipTotal": false,
                "id": "VccAgeComb1"
            }, {
                "name": "Age LessThanOrGreaterThan15",
                "created": "2014-03-12T12:30:15.281+0000",
                "lastUpdated": "2014-03-12T12:30:15.289+0000",
                "categories": [{
                    "name": "Age LessThanOrGreaterThan15",
                    "created": "2014-03-12T12:30:14.612+0000",
                    "lastUpdated": "2014-03-12T12:30:14.620+0000",
                    "id": "LesOrGr815"
                }],
                "dimensionType": "disaggregation",
                "skipTotal": false,
                "id": "Age15Comb"
            }, {
                "name": "Case Type",
                "created": "2014-03-12T12:30:15.293+0000",
                "lastUpdated": "2014-03-12T12:30:15.300+0000",
                "categories": [{
                    "name": "Case Type",
                    "created": "2014-03-12T12:30:14.658+0000",
                    "lastUpdated": "2014-03-12T12:30:14.665+0000",
                    "id": "CaseType"
                }],
                "dimensionType": "disaggregation",
                "skipTotal": false,
                "id": "CaseTypComb"
            }, {
                "name": "Purpose of TT vaccination",
                "created": "2014-03-12T12:30:15.304+0000",
                "lastUpdated": "2014-03-12T12:30:15.311+0000",
                "categories": [{
                    "name": "Purpose of TT vaccination",
                    "created": "2014-03-12T12:30:14.670+0000",
                    "lastUpdated": "2014-03-12T12:30:14.677+0000",
                    "id": "PurTTVacc"
                }],
                "dimensionType": "disaggregation",
                "skipTotal": false,
                "id": "TTVaccComb"
            }],
            "categoryOptionCombos": [{
                "name": "(default)",
                "created": "2014-03-12T12:29:23.316+0000",
                "lastUpdated": "2014-03-12T12:29:23.316+0000",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "categoryOptions": [{
                    "name": "default",
                    "created": "2014-03-12T12:29:23.260+0000",
                    "lastUpdated": "2014-03-12T12:29:23.344+0000",
                    "id": "Cq6KMaB1aiS"
                }],
                "id": "EXYoECwhjR7"
            }],
            "dataElements": [{
                "code": "DE_OPD_001",
                "name": "Hypertension",
                "created": "2014-03-12T12:30:15.957+0000",
                "lastUpdated": "2014-03-12T12:30:15.976+0000",
                "shortName": "Hypertension",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_HyTnsn"
            }, {
                "code": "DE_OPD_002",
                "name": "Malaria RT",
                "created": "2014-03-12T12:30:15.979+0000",
                "lastUpdated": "2014-03-12T12:30:15.986+0000",
                "shortName": "MalariaRT",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_MalRT"
            }, {
                "code": "DE_OPD_003",
                "name": "Malaria Suspected",
                "created": "2014-03-12T12:30:15.989+0000",
                "lastUpdated": "2014-03-12T12:30:15.998+0000",
                "shortName": "MalariaSusp",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_MalSus"
            }, {
                "code": "DE_OPD_004",
                "name": "Malaria Confirmed",
                "created": "2014-03-12T12:30:16.009+0000",
                "lastUpdated": "2014-03-12T12:30:16.016+0000",
                "shortName": "MalariaConf",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_MalConf"
            }, {
                "code": "DE_OPD_005",
                "name": "Cholera",
                "created": "2014-03-12T12:30:16.019+0000",
                "lastUpdated": "2014-03-12T12:30:16.033+0000",
                "shortName": "Cholera",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_Cholera"
            }, {
                "code": "DE_OPD_006",
                "name": "Injections",
                "created": "2014-03-12T12:30:16.036+0000",
                "lastUpdated": "2014-03-12T12:30:16.043+0000",
                "shortName": "Injections",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_Inject"
            }, {
                "code": "DE_OPD_007",
                "name": "New Cases of Dressing",
                "created": "2014-03-12T12:30:16.046+0000",
                "lastUpdated": "2014-03-12T12:30:16.053+0000",
                "shortName": "NewDressing",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_New_Dres"
            }, {
                "code": "DE_OPD_008",
                "name": "Old Cases of Dressing",
                "created": "2014-03-12T12:30:16.058+0000",
                "lastUpdated": "2014-03-12T12:30:16.066+0000",
                "shortName": "OldDressing",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_Old_Dres"
            }, {
                "code": "DE_OPD_009",
                "name": "Rapes",
                "created": "2014-03-12T12:30:16.069+0000",
                "lastUpdated": "2014-03-12T12:30:16.078+0000",
                "shortName": "Rapes",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_Rapes"
            }, {
                "code": "DE_OPD_010",
                "name": "No of MUAC Cases",
                "created": "2014-03-12T12:30:16.087+0000",
                "lastUpdated": "2014-03-12T12:30:16.101+0000",
                "shortName": "MUACCases",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Default Age and Migration Status",
                    "created": "2014-03-12T12:30:15.230+0000",
                    "lastUpdated": "2014-03-12T12:30:15.238+0000",
                    "id": "DefAgeMig"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_MuacCase"
            }, {
                "code": "DE_OPD_011",
                "name": "No of Follow Up Cases",
                "created": "2014-03-12T12:30:16.105+0000",
                "lastUpdated": "2014-03-12T12:30:16.113+0000",
                "shortName": "FolUpCases",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Case Type",
                    "created": "2014-03-12T12:30:15.293+0000",
                    "lastUpdated": "2014-03-12T12:30:15.300+0000",
                    "id": "CaseTypComb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_FollCase"
            }, {
                "code": "DE_OPD_012",
                "name": "Basey",
                "created": "2014-03-12T12:30:16.116+0000",
                "lastUpdated": "2014-03-12T12:30:16.164+0000",
                "shortName": "Basey",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_Basey"
            }, {
                "code": "DE_OPD_013",
                "name": "Palo",
                "created": "2014-03-12T12:30:16.127+0000",
                "lastUpdated": "2014-03-12T12:30:16.136+0000",
                "shortName": "Palo",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_Palo"
            }, {
                "code": "DE_OPD_014",
                "name": "Jaro",
                "created": "2014-03-12T12:30:16.140+0000",
                "lastUpdated": "2014-03-12T12:30:16.148+0000",
                "shortName": "Jaro",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_Jaro"
            }, {
                "code": "DE_OPD_015",
                "name": "Tunga",
                "created": "2014-03-12T12:30:16.151+0000",
                "lastUpdated": "2014-03-12T12:30:16.159+0000",
                "shortName": "Tunga",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DE_Tunga"
            }, {
                "code": "BCG",
                "name": "BCG",
                "created": "2014-03-12T12:30:16.795+0000",
                "lastUpdated": "2014-03-12T12:30:16.803+0000",
                "shortName": "BCG",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "BCG"
            }, {
                "code": "Hep_B_At_Birth",
                "name": "Hepatitis B at birth",
                "created": "2014-03-12T12:30:16.807+0000",
                "lastUpdated": "2014-03-12T12:30:16.815+0000",
                "shortName": "Hepatitis B Birth",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "HepBBirth"
            }, {
                "code": "DTP_HIB_1",
                "name": "DTP + Hib 1",
                "created": "2014-03-12T12:30:16.818+0000",
                "lastUpdated": "2014-03-12T12:30:16.826+0000",
                "shortName": "DTP_HIB_1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DTPHIB1"
            }, {
                "code": "DTP_HIB_2",
                "name": "DTP + Hib 2",
                "created": "2014-03-12T12:30:16.830+0000",
                "lastUpdated": "2014-03-12T12:30:16.838+0000",
                "shortName": "DTP_HIB_2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DTPHIB2"
            }, {
                "code": "DTC_HIB_3",
                "name": "DTC + Hib 3",
                "created": "2014-03-12T12:30:16.841+0000",
                "lastUpdated": "2014-03-12T12:30:16.849+0000",
                "shortName": "DTC_HIB_3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DTCHIB3"
            }, {
                "code": "DTP_HIB_B",
                "name": "DTP + Hib booster",
                "created": "2014-03-12T12:30:16.853+0000",
                "lastUpdated": "2014-03-12T12:30:16.861+0000",
                "shortName": "DTP_HIB_B",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DTPHIBB"
            }, {
                "code": "DTC_hémophilus_1",
                "name": "DTC + hémophilus 1",
                "created": "2014-03-12T12:30:16.864+0000",
                "lastUpdated": "2014-03-12T12:30:16.873+0000",
                "shortName": "DTCH1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DTCH1"
            }, {
                "code": "DTC_hémophilus_2",
                "name": "DTC + hémophilus 2",
                "created": "2014-03-12T12:30:16.877+0000",
                "lastUpdated": "2014-03-12T12:30:16.885+0000",
                "shortName": "DTCH2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DTCH2"
            }, {
                "code": "DTC_hémophilus_3",
                "name": "DTC + hémophilus 3",
                "created": "2014-03-12T12:30:16.889+0000",
                "lastUpdated": "2014-03-12T12:30:16.898+0000",
                "shortName": "DTCH3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DTCH3"
            }, {
                "code": "DTC_hémophilus_B",
                "name": "DTC + hémophilus Booster",
                "created": "2014-03-12T12:30:16.901+0000",
                "lastUpdated": "2014-03-12T12:30:16.910+0000",
                "shortName": "DTCHB",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "DTCHB"
            }, {
                "code": "Polio_At_Birth",
                "name": "Polio 0 at birth",
                "created": "2014-03-12T12:30:16.914+0000",
                "lastUpdated": "2014-03-12T12:30:16.923+0000",
                "shortName": "Polio_At_Birth",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "PAB"
            }, {
                "code": "Polio 1",
                "name": "Polio 1",
                "created": "2014-03-12T12:30:16.927+0000",
                "lastUpdated": "2014-03-12T12:30:16.936+0000",
                "shortName": "Polio 1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Polio1"
            }, {
                "code": "Polio 2",
                "name": "Polio 2",
                "created": "2014-03-12T12:30:16.941+0000",
                "lastUpdated": "2014-03-12T12:30:16.950+0000",
                "shortName": "Polio 2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Polio2"
            }, {
                "code": "Polio 3",
                "name": "Polio 3",
                "created": "2014-03-12T12:30:16.954+0000",
                "lastUpdated": "2014-03-12T12:30:16.964+0000",
                "shortName": "Polio 3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Polio3"
            }, {
                "code": "Polio B",
                "name": "Polio booster",
                "created": "2014-03-12T12:30:16.968+0000",
                "lastUpdated": "2014-03-12T12:30:16.977+0000",
                "shortName": "Polio B",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "PolioB"
            }, {
                "code": "IPV",
                "name": "IPV (Injectable polio)",
                "created": "2014-03-12T12:30:16.981+0000",
                "lastUpdated": "2014-03-12T12:30:16.992+0000",
                "shortName": "IPV",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "IPV"
            }, {
                "code": "Measles_6_To_8_months",
                "name": "Measles: 6 to 8 months",
                "created": "2014-03-12T12:30:16.996+0000",
                "lastUpdated": "2014-03-12T12:30:17.005+0000",
                "shortName": "Meas_6_To_8_mths",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Meas6To8"
            }, {
                "code": "Measles_1st_dose",
                "name": "Measles 1st dose",
                "created": "2014-03-12T12:30:17.009+0000",
                "lastUpdated": "2014-03-12T12:30:17.020+0000",
                "shortName": "Meas_1st_dose",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Meas1"
            }, {
                "code": "Measles_2nd_dose",
                "name": "Measles 2nd dose",
                "created": "2014-03-12T12:30:17.024+0000",
                "lastUpdated": "2014-03-12T12:30:17.034+0000",
                "shortName": "Meas_2nd_dose",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Meas2"
            }, {
                "code": "Yellow_fever",
                "name": "Yellow fever",
                "created": "2014-03-12T12:30:17.040+0000",
                "lastUpdated": "2014-03-12T12:30:17.050+0000",
                "shortName": "Yellow_fev",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Yellfev"
            }, {
                "code": "Pneumo_1",
                "name": "Pneumo 1",
                "created": "2014-03-12T12:30:17.053+0000",
                "lastUpdated": "2014-03-12T12:30:17.064+0000",
                "shortName": "P1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Pneumo1"
            }, {
                "code": "Pneumo_2",
                "name": "Pneumo 2",
                "created": "2014-03-12T12:30:17.068+0000",
                "lastUpdated": "2014-03-12T12:30:17.080+0000",
                "shortName": "P2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Pneumo2"
            }, {
                "code": "Pneumo_3",
                "name": "Pneumo 3",
                "created": "2014-03-12T12:30:17.084+0000",
                "lastUpdated": "2014-03-12T12:30:17.095+0000",
                "shortName": "P3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Pneumo3"
            }, {
                "code": "Rotavirus_1",
                "name": "Rotavirus 1",
                "created": "2014-03-12T12:30:17.099+0000",
                "lastUpdated": "2014-03-12T12:30:17.110+0000",
                "shortName": "R1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Rotavirus1"
            }, {
                "code": "Rotavirus_2",
                "name": "Rotavirus 2",
                "created": "2014-03-12T12:30:17.114+0000",
                "lastUpdated": "2014-03-12T12:30:17.126+0000",
                "shortName": "R2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Rotavirus2"
            }, {
                "code": "Rotavirus_3",
                "name": "Rotavirus 3",
                "created": "2014-03-12T12:30:17.130+0000",
                "lastUpdated": "2014-03-12T12:30:17.142+0000",
                "shortName": "R3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Rotavirus3"
            }, {
                "code": "MenAConjugate_1",
                "name": "MenAConjugate 1",
                "created": "2014-03-12T12:30:17.146+0000",
                "lastUpdated": "2014-03-12T12:30:17.157+0000",
                "shortName": "MAC1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "MAC1"
            }, {
                "code": "MenAConjugate_2",
                "name": "MenAConjugate 2",
                "created": "2014-03-12T12:30:17.161+0000",
                "lastUpdated": "2014-03-12T12:30:17.173+0000",
                "shortName": "MAC2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "MAC2"
            }, {
                "code": "HPV_1",
                "name": "HPV1",
                "created": "2014-03-12T12:30:17.177+0000",
                "lastUpdated": "2014-03-12T12:30:17.189+0000",
                "shortName": "HPV1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "HPV1"
            }, {
                "code": "HPV_2",
                "name": "HPV2",
                "created": "2014-03-12T12:30:17.193+0000",
                "lastUpdated": "2014-03-12T12:30:17.204+0000",
                "shortName": "HPV2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "HPV2"
            }, {
                "code": "HPV_3",
                "name": "HPV3",
                "created": "2014-03-12T12:30:17.208+0000",
                "lastUpdated": "2014-03-12T12:30:17.219+0000",
                "shortName": "HPV3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Vaccination Age 2",
                    "created": "2014-03-12T12:30:15.263+0000",
                    "lastUpdated": "2014-03-12T12:30:15.278+0000",
                    "id": "VccAgeComb1"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "HPV3"
            }, {
                "code": "TT_1",
                "name": "TT1",
                "created": "2014-03-12T12:30:17.224+0000",
                "lastUpdated": "2014-03-12T12:30:17.235+0000",
                "shortName": "TT1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Purpose of TT vaccination",
                    "created": "2014-03-12T12:30:15.304+0000",
                    "lastUpdated": "2014-03-12T12:30:15.311+0000",
                    "id": "TTVaccComb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "TT1"
            }, {
                "code": "TT_2",
                "name": "TT2",
                "created": "2014-03-12T12:30:17.239+0000",
                "lastUpdated": "2014-03-12T12:30:17.250+0000",
                "shortName": "TT2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Purpose of TT vaccination",
                    "created": "2014-03-12T12:30:15.304+0000",
                    "lastUpdated": "2014-03-12T12:30:15.311+0000",
                    "id": "TTVaccComb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "TT2"
            }, {
                "code": "TT_3",
                "name": "TT3",
                "created": "2014-03-12T12:30:17.255+0000",
                "lastUpdated": "2014-03-12T12:30:17.266+0000",
                "shortName": "TT3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Purpose of TT vaccination",
                    "created": "2014-03-12T12:30:15.304+0000",
                    "lastUpdated": "2014-03-12T12:30:15.311+0000",
                    "id": "TTVaccComb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "TT3"
            }, {
                "code": "TT_4",
                "name": "TT4",
                "created": "2014-03-12T12:30:17.271+0000",
                "lastUpdated": "2014-03-12T12:30:17.283+0000",
                "shortName": "TT4",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Purpose of TT vaccination",
                    "created": "2014-03-12T12:30:15.304+0000",
                    "lastUpdated": "2014-03-12T12:30:15.311+0000",
                    "id": "TTVaccComb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "TT4"
            }, {
                "code": "TT_5",
                "name": "TT5",
                "created": "2014-03-12T12:30:17.288+0000",
                "lastUpdated": "2014-03-12T12:30:17.302+0000",
                "shortName": "TT5",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Purpose of TT vaccination",
                    "created": "2014-03-12T12:30:15.304+0000",
                    "lastUpdated": "2014-03-12T12:30:15.311+0000",
                    "id": "TTVaccComb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "TT5"
            }, {
                "code": "Anti-tetanus_Ig",
                "name": "Anti-tetanus Ig",
                "created": "2014-03-12T12:30:17.308+0000",
                "lastUpdated": "2014-03-12T12:30:17.327+0000",
                "shortName": "ATIg",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Purpose of TT vaccination",
                    "created": "2014-03-12T12:30:15.304+0000",
                    "lastUpdated": "2014-03-12T12:30:15.311+0000",
                    "id": "TTVaccComb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "ATIg"
            }, {
                "code": "Rabies_1_and_2_(day 0)",
                "name": "Rabies 1 & 2 (day 0)",
                "created": "2014-03-12T12:30:17.334+0000",
                "lastUpdated": "2014-03-12T12:30:17.346+0000",
                "shortName": "Rab1And2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Rab1And2"
            }, {
                "code": "Rabies_3_(day 7)",
                "name": "Rabies 3 (day 7)",
                "created": "2014-03-12T12:30:17.366+0000",
                "lastUpdated": "2014-03-12T12:30:17.380+0000",
                "shortName": "Rab3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Rab3"
            }, {
                "code": "Rabies_4_(days 21 to 28)",
                "name": "Rabies 4 (days 21 to 28)",
                "created": "2014-03-12T12:30:17.386+0000",
                "lastUpdated": "2014-03-12T12:30:17.399+0000",
                "shortName": "Rab4",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "Rab4"
            }, {
                "code": "Anti-rabies_Ig",
                "name": "Anti-rabies Ig",
                "created": "2014-03-12T12:30:17.404+0000",
                "lastUpdated": "2014-03-12T12:30:17.417+0000",
                "shortName": "ARIg",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "ARIg"
            }, {
                "code": "Hepatitis_B_1_(day 0)",
                "name": "Hepatitis B 1 (day 0)",
                "created": "2014-03-12T12:30:17.422+0000",
                "lastUpdated": "2014-03-12T12:30:17.435+0000",
                "shortName": "HB1",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Age LessThanOrGreaterThan15",
                    "created": "2014-03-12T12:30:15.281+0000",
                    "lastUpdated": "2014-03-12T12:30:15.289+0000",
                    "id": "Age15Comb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "HB1"
            }, {
                "code": "Hepatitis_B_2_(day 7)",
                "name": "Hepatitis B 2 (day 7)",
                "created": "2014-03-12T12:30:17.440+0000",
                "lastUpdated": "2014-03-12T12:30:17.452+0000",
                "shortName": "HB2",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Age LessThanOrGreaterThan15",
                    "created": "2014-03-12T12:30:15.281+0000",
                    "lastUpdated": "2014-03-12T12:30:15.289+0000",
                    "id": "Age15Comb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "HB2"
            }, {
                "code": "Hepatitis_B_3_(days 21 to 28)",
                "name": "Hepatitis B 3 (days 21 to 28)",
                "created": "2014-03-12T12:30:17.457+0000",
                "lastUpdated": "2014-03-12T12:30:17.470+0000",
                "shortName": "HB3",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Age LessThanOrGreaterThan15",
                    "created": "2014-03-12T12:30:15.281+0000",
                    "lastUpdated": "2014-03-12T12:30:15.289+0000",
                    "id": "Age15Comb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "HB3"
            }, {
                "code": "TT1_(day 0)",
                "name": "TT1 (day 0)",
                "created": "2014-03-12T12:30:17.476+0000",
                "lastUpdated": "2014-03-12T12:30:17.492+0000",
                "shortName": "TT1R",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Age LessThanOrGreaterThan15",
                    "created": "2014-03-12T12:30:15.281+0000",
                    "lastUpdated": "2014-03-12T12:30:15.289+0000",
                    "id": "Age15Comb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "TT1R"
            }, {
                "code": "TT2_(days 21 to 28)",
                "name": "TT2 (days 21 to 28)",
                "created": "2014-03-12T12:30:17.502+0000",
                "lastUpdated": "2014-03-12T12:30:17.517+0000",
                "shortName": "TT2R",
                "active": true,
                "domainType": "aggregate",
                "type": "int",
                "numberType": "zeroPositiveInt",
                "aggregationOperator": "sum",
                "categoryCombo": {
                    "name": "Age LessThanOrGreaterThan15",
                    "created": "2014-03-12T12:30:15.281+0000",
                    "lastUpdated": "2014-03-12T12:30:15.289+0000",
                    "id": "Age15Comb"
                },
                "zeroIsSignificant": false,
                "legendSet": null,
                "id": "TT2R"
            }],
            "sections": [{
                "name": "Diagnosis",
                "created": "2014-03-12T12:30:19.668+0000",
                "lastUpdated": "2014-03-12T12:30:19.822+0000",
                "dataSet": {
                    "code": "DS_OPD",
                    "name": "Main Out Patient Service",
                    "created": "2014-03-12T12:30:18.537+0000",
                    "lastUpdated": "2014-03-12T12:30:18.570+0000",
                    "id": "DS_OPD"
                },
                "dataElements": [{
                    "code": "DE_OPD_001",
                    "name": "Hypertension",
                    "created": "2014-03-12T12:30:15.957+0000",
                    "lastUpdated": "2014-03-12T12:30:15.976+0000",
                    "id": "DE_HyTnsn"
                }, {
                    "code": "DE_OPD_002",
                    "name": "Malaria RT",
                    "created": "2014-03-12T12:30:15.979+0000",
                    "lastUpdated": "2014-03-12T12:30:15.986+0000",
                    "id": "DE_MalRT"
                }, {
                    "code": "DE_OPD_003",
                    "name": "Malaria Suspected",
                    "created": "2014-03-12T12:30:15.989+0000",
                    "lastUpdated": "2014-03-12T12:30:15.998+0000",
                    "id": "DE_MalSus"
                }, {
                    "code": "DE_OPD_004",
                    "name": "Malaria Confirmed",
                    "created": "2014-03-12T12:30:16.009+0000",
                    "lastUpdated": "2014-03-12T12:30:16.016+0000",
                    "id": "DE_MalConf"
                }, {
                    "code": "DE_OPD_005",
                    "name": "Cholera",
                    "created": "2014-03-12T12:30:16.019+0000",
                    "lastUpdated": "2014-03-12T12:30:16.033+0000",
                    "id": "DE_Cholera"
                }],
                "id": "sect_diagn"
            }, {
                "name": "Consultations",
                "created": "2014-03-12T12:30:19.824+0000",
                "lastUpdated": "2014-03-12T12:30:19.831+0000",
                "dataSet": {
                    "code": "DS_OPD",
                    "name": "Main Out Patient Service",
                    "created": "2014-03-12T12:30:18.537+0000",
                    "lastUpdated": "2014-03-12T12:30:18.570+0000",
                    "id": "DS_OPD"
                },
                "dataElements": [{
                    "code": "DE_OPD_013",
                    "name": "Palo",
                    "created": "2014-03-12T12:30:16.127+0000",
                    "lastUpdated": "2014-03-12T12:30:16.136+0000",
                    "id": "DE_Palo"
                }, {
                    "code": "DE_OPD_014",
                    "name": "Jaro",
                    "created": "2014-03-12T12:30:16.140+0000",
                    "lastUpdated": "2014-03-12T12:30:16.148+0000",
                    "id": "DE_Jaro"
                }, {
                    "code": "DE_OPD_015",
                    "name": "Tunga",
                    "created": "2014-03-12T12:30:16.151+0000",
                    "lastUpdated": "2014-03-12T12:30:16.159+0000",
                    "id": "DE_Tunga"
                }, {
                    "code": "DE_OPD_012",
                    "name": "Basey",
                    "created": "2014-03-12T12:30:16.116+0000",
                    "lastUpdated": "2014-03-12T12:30:16.164+0000",
                    "id": "DE_Basey"
                }],
                "id": "sect_consul"
            }, {
                "name": "Injections And Dressings",
                "created": "2014-03-12T12:30:19.833+0000",
                "lastUpdated": "2014-03-12T12:30:19.837+0000",
                "dataSet": {
                    "code": "DS_OPD",
                    "name": "Main Out Patient Service",
                    "created": "2014-03-12T12:30:18.537+0000",
                    "lastUpdated": "2014-03-12T12:30:18.570+0000",
                    "id": "DS_OPD"
                },
                "dataElements": [{
                    "code": "DE_OPD_006",
                    "name": "Injections",
                    "created": "2014-03-12T12:30:16.036+0000",
                    "lastUpdated": "2014-03-12T12:30:16.043+0000",
                    "id": "DE_Inject"
                }, {
                    "code": "DE_OPD_007",
                    "name": "New Cases of Dressing",
                    "created": "2014-03-12T12:30:16.046+0000",
                    "lastUpdated": "2014-03-12T12:30:16.053+0000",
                    "id": "DE_New_Dres"
                }, {
                    "code": "DE_OPD_008",
                    "name": "Old Cases of Dressing",
                    "created": "2014-03-12T12:30:16.058+0000",
                    "lastUpdated": "2014-03-12T12:30:16.066+0000",
                    "id": "DE_Old_Dres"
                }],
                "id": "sect_injdrs"
            }, {
                "name": "Rapes",
                "created": "2014-03-12T12:30:19.839+0000",
                "lastUpdated": "2014-03-12T12:30:19.847+0000",
                "dataSet": {
                    "code": "DS_OPD",
                    "name": "Main Out Patient Service",
                    "created": "2014-03-12T12:30:18.537+0000",
                    "lastUpdated": "2014-03-12T12:30:18.570+0000",
                    "id": "DS_OPD"
                },
                "dataElements": [{
                    "code": "DE_OPD_009",
                    "name": "Rapes",
                    "created": "2014-03-12T12:30:16.069+0000",
                    "lastUpdated": "2014-03-12T12:30:16.078+0000",
                    "id": "DE_Rapes"
                }],
                "id": "sect_follow"
            }, {
                "name": "MUAC",
                "created": "2014-03-12T12:30:19.849+0000",
                "lastUpdated": "2014-03-12T12:30:19.854+0000",
                "dataSet": {
                    "code": "DS_OPD",
                    "name": "Main Out Patient Service",
                    "created": "2014-03-12T12:30:18.537+0000",
                    "lastUpdated": "2014-03-12T12:30:18.570+0000",
                    "id": "DS_OPD"
                },
                "dataElements": [{
                    "code": "DE_OPD_010",
                    "name": "No of MUAC Cases",
                    "created": "2014-03-12T12:30:16.087+0000",
                    "lastUpdated": "2014-03-12T12:30:16.101+0000",
                    "id": "DE_MuacCase"
                }],
                "id": "sect_muac"
            }, {
                "name": "Programmed Vaccination",
                "created": "2014-03-12T12:30:19.856+0000",
                "lastUpdated": "2014-03-12T12:30:19.862+0000",
                "dataSet": {
                    "code": "DS_VS",
                    "name": "Vaccination Service",
                    "created": "2014-03-12T12:30:18.579+0000",
                    "lastUpdated": "2014-03-12T12:30:18.594+0000",
                    "id": "DS_VS"
                },
                "dataElements": [{
                    "code": "BCG",
                    "name": "BCG",
                    "created": "2014-03-12T12:30:16.795+0000",
                    "lastUpdated": "2014-03-12T12:30:16.803+0000",
                    "id": "BCG"
                }, {
                    "code": "Hep_B_At_Birth",
                    "name": "Hepatitis B at birth",
                    "created": "2014-03-12T12:30:16.807+0000",
                    "lastUpdated": "2014-03-12T12:30:16.815+0000",
                    "id": "HepBBirth"
                }, {
                    "code": "DTP_HIB_1",
                    "name": "DTP + Hib 1",
                    "created": "2014-03-12T12:30:16.818+0000",
                    "lastUpdated": "2014-03-12T12:30:16.826+0000",
                    "id": "DTPHIB1"
                }, {
                    "code": "DTP_HIB_2",
                    "name": "DTP + Hib 2",
                    "created": "2014-03-12T12:30:16.830+0000",
                    "lastUpdated": "2014-03-12T12:30:16.838+0000",
                    "id": "DTPHIB2"
                }, {
                    "code": "DTC_HIB_3",
                    "name": "DTC + Hib 3",
                    "created": "2014-03-12T12:30:16.841+0000",
                    "lastUpdated": "2014-03-12T12:30:16.849+0000",
                    "id": "DTCHIB3"
                }, {
                    "code": "DTP_HIB_B",
                    "name": "DTP + Hib booster",
                    "created": "2014-03-12T12:30:16.853+0000",
                    "lastUpdated": "2014-03-12T12:30:16.861+0000",
                    "id": "DTPHIBB"
                }, {
                    "code": "DTC_hémophilus_1",
                    "name": "DTC + hémophilus 1",
                    "created": "2014-03-12T12:30:16.864+0000",
                    "lastUpdated": "2014-03-12T12:30:16.873+0000",
                    "id": "DTCH1"
                }, {
                    "code": "DTC_hémophilus_2",
                    "name": "DTC + hémophilus 2",
                    "created": "2014-03-12T12:30:16.877+0000",
                    "lastUpdated": "2014-03-12T12:30:16.885+0000",
                    "id": "DTCH2"
                }, {
                    "code": "DTC_hémophilus_3",
                    "name": "DTC + hémophilus 3",
                    "created": "2014-03-12T12:30:16.889+0000",
                    "lastUpdated": "2014-03-12T12:30:16.898+0000",
                    "id": "DTCH3"
                }, {
                    "code": "DTC_hémophilus_B",
                    "name": "DTC + hémophilus Booster",
                    "created": "2014-03-12T12:30:16.901+0000",
                    "lastUpdated": "2014-03-12T12:30:16.910+0000",
                    "id": "DTCHB"
                }, {
                    "code": "Polio_At_Birth",
                    "name": "Polio 0 at birth",
                    "created": "2014-03-12T12:30:16.914+0000",
                    "lastUpdated": "2014-03-12T12:30:16.923+0000",
                    "id": "PAB"
                }, {
                    "code": "Polio 1",
                    "name": "Polio 1",
                    "created": "2014-03-12T12:30:16.927+0000",
                    "lastUpdated": "2014-03-12T12:30:16.936+0000",
                    "id": "Polio1"
                }, {
                    "code": "Polio 2",
                    "name": "Polio 2",
                    "created": "2014-03-12T12:30:16.941+0000",
                    "lastUpdated": "2014-03-12T12:30:16.950+0000",
                    "id": "Polio2"
                }, {
                    "code": "Polio 3",
                    "name": "Polio 3",
                    "created": "2014-03-12T12:30:16.954+0000",
                    "lastUpdated": "2014-03-12T12:30:16.964+0000",
                    "id": "Polio3"
                }, {
                    "code": "Polio B",
                    "name": "Polio booster",
                    "created": "2014-03-12T12:30:16.968+0000",
                    "lastUpdated": "2014-03-12T12:30:16.977+0000",
                    "id": "PolioB"
                }, {
                    "code": "IPV",
                    "name": "IPV (Injectable polio)",
                    "created": "2014-03-12T12:30:16.981+0000",
                    "lastUpdated": "2014-03-12T12:30:16.992+0000",
                    "id": "IPV"
                }, {
                    "code": "Measles_6_To_8_months",
                    "name": "Measles: 6 to 8 months",
                    "created": "2014-03-12T12:30:16.996+0000",
                    "lastUpdated": "2014-03-12T12:30:17.005+0000",
                    "id": "Meas6To8"
                }, {
                    "code": "Measles_1st_dose",
                    "name": "Measles 1st dose",
                    "created": "2014-03-12T12:30:17.009+0000",
                    "lastUpdated": "2014-03-12T12:30:17.020+0000",
                    "id": "Meas1"
                }, {
                    "code": "Measles_2nd_dose",
                    "name": "Measles 2nd dose",
                    "created": "2014-03-12T12:30:17.024+0000",
                    "lastUpdated": "2014-03-12T12:30:17.034+0000",
                    "id": "Meas2"
                }, {
                    "code": "Pneumo_1",
                    "name": "Pneumo 1",
                    "created": "2014-03-12T12:30:17.053+0000",
                    "lastUpdated": "2014-03-12T12:30:17.064+0000",
                    "id": "Pneumo1"
                }, {
                    "code": "Pneumo_2",
                    "name": "Pneumo 2",
                    "created": "2014-03-12T12:30:17.068+0000",
                    "lastUpdated": "2014-03-12T12:30:17.080+0000",
                    "id": "Pneumo2"
                }, {
                    "code": "Pneumo_3",
                    "name": "Pneumo 3",
                    "created": "2014-03-12T12:30:17.084+0000",
                    "lastUpdated": "2014-03-12T12:30:17.095+0000",
                    "id": "Pneumo3"
                }, {
                    "code": "Rotavirus_1",
                    "name": "Rotavirus 1",
                    "created": "2014-03-12T12:30:17.099+0000",
                    "lastUpdated": "2014-03-12T12:30:17.110+0000",
                    "id": "Rotavirus1"
                }, {
                    "code": "Rotavirus_2",
                    "name": "Rotavirus 2",
                    "created": "2014-03-12T12:30:17.114+0000",
                    "lastUpdated": "2014-03-12T12:30:17.126+0000",
                    "id": "Rotavirus2"
                }, {
                    "code": "Rotavirus_3",
                    "name": "Rotavirus 3",
                    "created": "2014-03-12T12:30:17.130+0000",
                    "lastUpdated": "2014-03-12T12:30:17.142+0000",
                    "id": "Rotavirus3"
                }, {
                    "code": "MenAConjugate_1",
                    "name": "MenAConjugate 1",
                    "created": "2014-03-12T12:30:17.146+0000",
                    "lastUpdated": "2014-03-12T12:30:17.157+0000",
                    "id": "MAC1"
                }, {
                    "code": "MenAConjugate_2",
                    "name": "MenAConjugate 2",
                    "created": "2014-03-12T12:30:17.161+0000",
                    "lastUpdated": "2014-03-12T12:30:17.173+0000",
                    "id": "MAC2"
                }, {
                    "code": "HPV_1",
                    "name": "HPV1",
                    "created": "2014-03-12T12:30:17.177+0000",
                    "lastUpdated": "2014-03-12T12:30:17.189+0000",
                    "id": "HPV1"
                }, {
                    "code": "HPV_2",
                    "name": "HPV2",
                    "created": "2014-03-12T12:30:17.193+0000",
                    "lastUpdated": "2014-03-12T12:30:17.204+0000",
                    "id": "HPV2"
                }, {
                    "code": "HPV_3",
                    "name": "HPV3",
                    "created": "2014-03-12T12:30:17.208+0000",
                    "lastUpdated": "2014-03-12T12:30:17.219+0000",
                    "id": "HPV3"
                }, {
                    "code": "Yellow_fever",
                    "name": "Yellow fever",
                    "created": "2014-03-12T12:30:17.040+0000",
                    "lastUpdated": "2014-03-12T12:30:17.050+0000",
                    "id": "Yellfev"
                }],
                "id": "ProgVacc"
            }, {
                "name": "Tetanus",
                "created": "2014-03-12T12:30:19.863+0000",
                "lastUpdated": "2014-03-12T12:30:19.868+0000",
                "dataSet": {
                    "code": "DS_VS",
                    "name": "Vaccination Service",
                    "created": "2014-03-12T12:30:18.579+0000",
                    "lastUpdated": "2014-03-12T12:30:18.594+0000",
                    "id": "DS_VS"
                },
                "dataElements": [{
                    "code": "TT_1",
                    "name": "TT1",
                    "created": "2014-03-12T12:30:17.224+0000",
                    "lastUpdated": "2014-03-12T12:30:17.235+0000",
                    "id": "TT1"
                }, {
                    "code": "TT_2",
                    "name": "TT2",
                    "created": "2014-03-12T12:30:17.239+0000",
                    "lastUpdated": "2014-03-12T12:30:17.250+0000",
                    "id": "TT2"
                }, {
                    "code": "TT_3",
                    "name": "TT3",
                    "created": "2014-03-12T12:30:17.255+0000",
                    "lastUpdated": "2014-03-12T12:30:17.266+0000",
                    "id": "TT3"
                }, {
                    "code": "TT_4",
                    "name": "TT4",
                    "created": "2014-03-12T12:30:17.271+0000",
                    "lastUpdated": "2014-03-12T12:30:17.283+0000",
                    "id": "TT4"
                }, {
                    "code": "TT_5",
                    "name": "TT5",
                    "created": "2014-03-12T12:30:17.288+0000",
                    "lastUpdated": "2014-03-12T12:30:17.302+0000",
                    "id": "TT5"
                }, {
                    "code": "Anti-tetanus_Ig",
                    "name": "Anti-tetanus Ig",
                    "created": "2014-03-12T12:30:17.308+0000",
                    "lastUpdated": "2014-03-12T12:30:17.327+0000",
                    "id": "ATIg"
                }],
                "id": "Tetanus"
            }, {
                "name": "Rabies (post-exposure)",
                "created": "2014-03-12T12:30:19.870+0000",
                "lastUpdated": "2014-03-12T12:30:19.875+0000",
                "dataSet": {
                    "code": "DS_VS",
                    "name": "Vaccination Service",
                    "created": "2014-03-12T12:30:18.579+0000",
                    "lastUpdated": "2014-03-12T12:30:18.594+0000",
                    "id": "DS_VS"
                },
                "dataElements": [{
                    "code": "Rabies_1_and_2_(day 0)",
                    "name": "Rabies 1 & 2 (day 0)",
                    "created": "2014-03-12T12:30:17.334+0000",
                    "lastUpdated": "2014-03-12T12:30:17.346+0000",
                    "id": "Rab1And2"
                }, {
                    "code": "Rabies_3_(day 7)",
                    "name": "Rabies 3 (day 7)",
                    "created": "2014-03-12T12:30:17.366+0000",
                    "lastUpdated": "2014-03-12T12:30:17.380+0000",
                    "id": "Rab3"
                }, {
                    "code": "Rabies_4_(days 21 to 28)",
                    "name": "Rabies 4 (days 21 to 28)",
                    "created": "2014-03-12T12:30:17.386+0000",
                    "lastUpdated": "2014-03-12T12:30:17.399+0000",
                    "id": "Rab4"
                }, {
                    "code": "Anti-rabies_Ig",
                    "name": "Anti-rabies Ig",
                    "created": "2014-03-12T12:30:17.404+0000",
                    "lastUpdated": "2014-03-12T12:30:17.417+0000",
                    "id": "ARIg"
                }],
                "id": "RabPE"
            }, {
                "name": "Vaccination after rape",
                "created": "2014-03-12T12:30:19.877+0000",
                "lastUpdated": "2014-03-12T12:30:19.884+0000",
                "dataSet": {
                    "code": "DS_VS",
                    "name": "Vaccination Service",
                    "created": "2014-03-12T12:30:18.579+0000",
                    "lastUpdated": "2014-03-12T12:30:18.594+0000",
                    "id": "DS_VS"
                },
                "dataElements": [{
                    "code": "Hepatitis_B_1_(day 0)",
                    "name": "Hepatitis B 1 (day 0)",
                    "created": "2014-03-12T12:30:17.422+0000",
                    "lastUpdated": "2014-03-12T12:30:17.435+0000",
                    "id": "HB1"
                }, {
                    "code": "Hepatitis_B_2_(day 7)",
                    "name": "Hepatitis B 2 (day 7)",
                    "created": "2014-03-12T12:30:17.440+0000",
                    "lastUpdated": "2014-03-12T12:30:17.452+0000",
                    "id": "HB2"
                }, {
                    "code": "Hepatitis_B_3_(days 21 to 28)",
                    "name": "Hepatitis B 3 (days 21 to 28)",
                    "created": "2014-03-12T12:30:17.457+0000",
                    "lastUpdated": "2014-03-12T12:30:17.470+0000",
                    "id": "HB3"
                }, {
                    "code": "TT1_(day 0)",
                    "name": "TT1 (day 0)",
                    "created": "2014-03-12T12:30:17.476+0000",
                    "lastUpdated": "2014-03-12T12:30:17.492+0000",
                    "id": "TT1R"
                }, {
                    "code": "TT2_(days 21 to 28)",
                    "name": "TT2 (days 21 to 28)",
                    "created": "2014-03-12T12:30:17.502+0000",
                    "lastUpdated": "2014-03-12T12:30:17.517+0000",
                    "id": "TT2R"
                }],
                "id": "VaccAR"
            }],
            "dataSets": [{
                "code": "DS_OPD",
                "name": "Main Out Patient Service",
                "created": "2014-03-12T12:30:18.537+0000",
                "lastUpdated": "2014-03-12T12:30:18.570+0000",
                "shortName": "OPD DS",
                "periodType": "Weekly",
                "dataElements": [{
                    "code": "DE_OPD_008",
                    "name": "Old Cases of Dressing",
                    "created": "2014-03-12T12:30:16.058+0000",
                    "lastUpdated": "2014-03-12T12:30:16.066+0000",
                    "id": "DE_Old_Dres"
                }, {
                    "code": "DE_OPD_009",
                    "name": "Rapes",
                    "created": "2014-03-12T12:30:16.069+0000",
                    "lastUpdated": "2014-03-12T12:30:16.078+0000",
                    "id": "DE_Rapes"
                }, {
                    "code": "DE_OPD_006",
                    "name": "Injections",
                    "created": "2014-03-12T12:30:16.036+0000",
                    "lastUpdated": "2014-03-12T12:30:16.043+0000",
                    "id": "DE_Inject"
                }, {
                    "code": "DE_OPD_001",
                    "name": "Hypertension",
                    "created": "2014-03-12T12:30:15.957+0000",
                    "lastUpdated": "2014-03-12T12:30:15.976+0000",
                    "id": "DE_HyTnsn"
                }, {
                    "code": "DE_OPD_004",
                    "name": "Malaria Confirmed",
                    "created": "2014-03-12T12:30:16.009+0000",
                    "lastUpdated": "2014-03-12T12:30:16.016+0000",
                    "id": "DE_MalConf"
                }, {
                    "code": "DE_OPD_003",
                    "name": "Malaria Suspected",
                    "created": "2014-03-12T12:30:15.989+0000",
                    "lastUpdated": "2014-03-12T12:30:15.998+0000",
                    "id": "DE_MalSus"
                }, {
                    "code": "DE_OPD_002",
                    "name": "Malaria RT",
                    "created": "2014-03-12T12:30:15.979+0000",
                    "lastUpdated": "2014-03-12T12:30:15.986+0000",
                    "id": "DE_MalRT"
                }, {
                    "code": "DE_OPD_015",
                    "name": "Tunga",
                    "created": "2014-03-12T12:30:16.151+0000",
                    "lastUpdated": "2014-03-12T12:30:16.159+0000",
                    "id": "DE_Tunga"
                }, {
                    "code": "DE_OPD_007",
                    "name": "New Cases of Dressing",
                    "created": "2014-03-12T12:30:16.046+0000",
                    "lastUpdated": "2014-03-12T12:30:16.053+0000",
                    "id": "DE_New_Dres"
                }, {
                    "code": "DE_OPD_012",
                    "name": "Basey",
                    "created": "2014-03-12T12:30:16.116+0000",
                    "lastUpdated": "2014-03-12T12:30:16.164+0000",
                    "id": "DE_Basey"
                }, {
                    "code": "DE_OPD_010",
                    "name": "No of MUAC Cases",
                    "created": "2014-03-12T12:30:16.087+0000",
                    "lastUpdated": "2014-03-12T12:30:16.101+0000",
                    "id": "DE_MuacCase"
                }, {
                    "code": "DE_OPD_005",
                    "name": "Cholera",
                    "created": "2014-03-12T12:30:16.019+0000",
                    "lastUpdated": "2014-03-12T12:30:16.033+0000",
                    "id": "DE_Cholera"
                }, {
                    "code": "DE_OPD_014",
                    "name": "Jaro",
                    "created": "2014-03-12T12:30:16.140+0000",
                    "lastUpdated": "2014-03-12T12:30:16.148+0000",
                    "id": "DE_Jaro"
                }, {
                    "code": "DE_OPD_011",
                    "name": "No of Follow Up Cases",
                    "created": "2014-03-12T12:30:16.105+0000",
                    "lastUpdated": "2014-03-12T12:30:16.113+0000",
                    "id": "DE_FollCase"
                }, {
                    "code": "DE_OPD_013",
                    "name": "Palo",
                    "created": "2014-03-12T12:30:16.127+0000",
                    "lastUpdated": "2014-03-12T12:30:16.136+0000",
                    "id": "DE_Palo"
                }],
                "categoryCombo": {
                    "name": "default",
                    "created": "2014-03-12T12:29:23.308+0000",
                    "lastUpdated": "2014-03-12T12:29:23.343+0000",
                    "id": "al8JpTTkOuk"
                },
                "mobile": false,
                "expiryDays": 15,
                "timelyDays": 15,
                "skipAggregation": false,
                "notifyCompletingUser": false,
                "approveData": false,
                "allowFuturePeriods": false,
                "fieldCombinationRequired": false,
                "validCompleteOnly": false,
                "noValueRequiresComment": false,
                "skipOffline": false,
                "dataElementDecoration": false,
                "renderAsTabs": false,
                "renderHorizontally": false,
                "legendSet": null,
                "id": "DS_OPD"
            }, {
                "code": "DS_VS",
                "name": "Vaccination Service",
                "created": "2014-03-12T12:30:18.579+0000",
                "lastUpdated": "2014-03-12T12:30:18.594+0000",
                "shortName": "VS DS",
                "periodType": "Weekly",
                "dataElements": [{
                    "code": "Rotavirus_2",
                    "name": "Rotavirus 2",
                    "created": "2014-03-12T12:30:17.114+0000",
                    "lastUpdated": "2014-03-12T12:30:17.126+0000",
                    "id": "Rotavirus2"
                }, {
                    "code": "Pneumo_3",
                    "name": "Pneumo 3",
                    "created": "2014-03-12T12:30:17.084+0000",
                    "lastUpdated": "2014-03-12T12:30:17.095+0000",
                    "id": "Pneumo3"
                }, {
                    "code": "Anti-tetanus_Ig",
                    "name": "Anti-tetanus Ig",
                    "created": "2014-03-12T12:30:17.308+0000",
                    "lastUpdated": "2014-03-12T12:30:17.327+0000",
                    "id": "ATIg"
                }, {
                    "code": "Pneumo_1",
                    "name": "Pneumo 1",
                    "created": "2014-03-12T12:30:17.053+0000",
                    "lastUpdated": "2014-03-12T12:30:17.064+0000",
                    "id": "Pneumo1"
                }, {
                    "code": "Hepatitis_B_2_(day 7)",
                    "name": "Hepatitis B 2 (day 7)",
                    "created": "2014-03-12T12:30:17.440+0000",
                    "lastUpdated": "2014-03-12T12:30:17.452+0000",
                    "id": "HB2"
                }, {
                    "code": "Hep_B_At_Birth",
                    "name": "Hepatitis B at birth",
                    "created": "2014-03-12T12:30:16.807+0000",
                    "lastUpdated": "2014-03-12T12:30:16.815+0000",
                    "id": "HepBBirth"
                }, {
                    "code": "DTP_HIB_B",
                    "name": "DTP + Hib booster",
                    "created": "2014-03-12T12:30:16.853+0000",
                    "lastUpdated": "2014-03-12T12:30:16.861+0000",
                    "id": "DTPHIBB"
                }, {
                    "code": "TT_1",
                    "name": "TT1",
                    "created": "2014-03-12T12:30:17.224+0000",
                    "lastUpdated": "2014-03-12T12:30:17.235+0000",
                    "id": "TT1"
                }, {
                    "code": "Rotavirus_3",
                    "name": "Rotavirus 3",
                    "created": "2014-03-12T12:30:17.130+0000",
                    "lastUpdated": "2014-03-12T12:30:17.142+0000",
                    "id": "Rotavirus3"
                }, {
                    "code": "BCG",
                    "name": "BCG",
                    "created": "2014-03-12T12:30:16.795+0000",
                    "lastUpdated": "2014-03-12T12:30:16.803+0000",
                    "id": "BCG"
                }, {
                    "code": "Rotavirus_1",
                    "name": "Rotavirus 1",
                    "created": "2014-03-12T12:30:17.099+0000",
                    "lastUpdated": "2014-03-12T12:30:17.110+0000",
                    "id": "Rotavirus1"
                }, {
                    "code": "Rabies_3_(day 7)",
                    "name": "Rabies 3 (day 7)",
                    "created": "2014-03-12T12:30:17.366+0000",
                    "lastUpdated": "2014-03-12T12:30:17.380+0000",
                    "id": "Rab3"
                }, {
                    "code": "Yellow_fever",
                    "name": "Yellow fever",
                    "created": "2014-03-12T12:30:17.040+0000",
                    "lastUpdated": "2014-03-12T12:30:17.050+0000",
                    "id": "Yellfev"
                }, {
                    "code": "DTC_hémophilus_B",
                    "name": "DTC + hémophilus Booster",
                    "created": "2014-03-12T12:30:16.901+0000",
                    "lastUpdated": "2014-03-12T12:30:16.910+0000",
                    "id": "DTCHB"
                }, {
                    "code": "Anti-rabies_Ig",
                    "name": "Anti-rabies Ig",
                    "created": "2014-03-12T12:30:17.404+0000",
                    "lastUpdated": "2014-03-12T12:30:17.417+0000",
                    "id": "ARIg"
                }, {
                    "code": "Rabies_4_(days 21 to 28)",
                    "name": "Rabies 4 (days 21 to 28)",
                    "created": "2014-03-12T12:30:17.386+0000",
                    "lastUpdated": "2014-03-12T12:30:17.399+0000",
                    "id": "Rab4"
                }, {
                    "code": "Rabies_1_and_2_(day 0)",
                    "name": "Rabies 1 & 2 (day 0)",
                    "created": "2014-03-12T12:30:17.334+0000",
                    "lastUpdated": "2014-03-12T12:30:17.346+0000",
                    "id": "Rab1And2"
                }, {
                    "code": "Measles_1st_dose",
                    "name": "Measles 1st dose",
                    "created": "2014-03-12T12:30:17.009+0000",
                    "lastUpdated": "2014-03-12T12:30:17.020+0000",
                    "id": "Meas1"
                }, {
                    "code": "Polio 2",
                    "name": "Polio 2",
                    "created": "2014-03-12T12:30:16.941+0000",
                    "lastUpdated": "2014-03-12T12:30:16.950+0000",
                    "id": "Polio2"
                }, {
                    "code": "TT_5",
                    "name": "TT5",
                    "created": "2014-03-12T12:30:17.288+0000",
                    "lastUpdated": "2014-03-12T12:30:17.302+0000",
                    "id": "TT5"
                }, {
                    "code": "HPV_3",
                    "name": "HPV3",
                    "created": "2014-03-12T12:30:17.208+0000",
                    "lastUpdated": "2014-03-12T12:30:17.219+0000",
                    "id": "HPV3"
                }, {
                    "code": "HPV_2",
                    "name": "HPV2",
                    "created": "2014-03-12T12:30:17.193+0000",
                    "lastUpdated": "2014-03-12T12:30:17.204+0000",
                    "id": "HPV2"
                }, {
                    "code": "Pneumo_2",
                    "name": "Pneumo 2",
                    "created": "2014-03-12T12:30:17.068+0000",
                    "lastUpdated": "2014-03-12T12:30:17.080+0000",
                    "id": "Pneumo2"
                }, {
                    "code": "Polio B",
                    "name": "Polio booster",
                    "created": "2014-03-12T12:30:16.968+0000",
                    "lastUpdated": "2014-03-12T12:30:16.977+0000",
                    "id": "PolioB"
                }, {
                    "code": "DTP_HIB_1",
                    "name": "DTP + Hib 1",
                    "created": "2014-03-12T12:30:16.818+0000",
                    "lastUpdated": "2014-03-12T12:30:16.826+0000",
                    "id": "DTPHIB1"
                }, {
                    "code": "TT2_(days 21 to 28)",
                    "name": "TT2 (days 21 to 28)",
                    "created": "2014-03-12T12:30:17.502+0000",
                    "lastUpdated": "2014-03-12T12:30:17.517+0000",
                    "id": "TT2R"
                }, {
                    "code": "DTP_HIB_2",
                    "name": "DTP + Hib 2",
                    "created": "2014-03-12T12:30:16.830+0000",
                    "lastUpdated": "2014-03-12T12:30:16.838+0000",
                    "id": "DTPHIB2"
                }, {
                    "code": "Hepatitis_B_1_(day 0)",
                    "name": "Hepatitis B 1 (day 0)",
                    "created": "2014-03-12T12:30:17.422+0000",
                    "lastUpdated": "2014-03-12T12:30:17.435+0000",
                    "id": "HB1"
                }, {
                    "code": "DTC_hémophilus_1",
                    "name": "DTC + hémophilus 1",
                    "created": "2014-03-12T12:30:16.864+0000",
                    "lastUpdated": "2014-03-12T12:30:16.873+0000",
                    "id": "DTCH1"
                }, {
                    "code": "DTC_hémophilus_2",
                    "name": "DTC + hémophilus 2",
                    "created": "2014-03-12T12:30:16.877+0000",
                    "lastUpdated": "2014-03-12T12:30:16.885+0000",
                    "id": "DTCH2"
                }, {
                    "code": "Measles_2nd_dose",
                    "name": "Measles 2nd dose",
                    "created": "2014-03-12T12:30:17.024+0000",
                    "lastUpdated": "2014-03-12T12:30:17.034+0000",
                    "id": "Meas2"
                }, {
                    "code": "DTC_hémophilus_3",
                    "name": "DTC + hémophilus 3",
                    "created": "2014-03-12T12:30:16.889+0000",
                    "lastUpdated": "2014-03-12T12:30:16.898+0000",
                    "id": "DTCH3"
                }, {
                    "code": "TT_3",
                    "name": "TT3",
                    "created": "2014-03-12T12:30:17.255+0000",
                    "lastUpdated": "2014-03-12T12:30:17.266+0000",
                    "id": "TT3"
                }, {
                    "code": "Measles_6_To_8_months",
                    "name": "Measles: 6 to 8 months",
                    "created": "2014-03-12T12:30:16.996+0000",
                    "lastUpdated": "2014-03-12T12:30:17.005+0000",
                    "id": "Meas6To8"
                }, {
                    "code": "MenAConjugate_1",
                    "name": "MenAConjugate 1",
                    "created": "2014-03-12T12:30:17.146+0000",
                    "lastUpdated": "2014-03-12T12:30:17.157+0000",
                    "id": "MAC1"
                }, {
                    "code": "Polio_At_Birth",
                    "name": "Polio 0 at birth",
                    "created": "2014-03-12T12:30:16.914+0000",
                    "lastUpdated": "2014-03-12T12:30:16.923+0000",
                    "id": "PAB"
                }, {
                    "code": "Polio 1",
                    "name": "Polio 1",
                    "created": "2014-03-12T12:30:16.927+0000",
                    "lastUpdated": "2014-03-12T12:30:16.936+0000",
                    "id": "Polio1"
                }, {
                    "code": "MenAConjugate_2",
                    "name": "MenAConjugate 2",
                    "created": "2014-03-12T12:30:17.161+0000",
                    "lastUpdated": "2014-03-12T12:30:17.173+0000",
                    "id": "MAC2"
                }, {
                    "code": "TT1_(day 0)",
                    "name": "TT1 (day 0)",
                    "created": "2014-03-12T12:30:17.476+0000",
                    "lastUpdated": "2014-03-12T12:30:17.492+0000",
                    "id": "TT1R"
                }, {
                    "code": "IPV",
                    "name": "IPV (Injectable polio)",
                    "created": "2014-03-12T12:30:16.981+0000",
                    "lastUpdated": "2014-03-12T12:30:16.992+0000",
                    "id": "IPV"
                }, {
                    "code": "Hepatitis_B_3_(days 21 to 28)",
                    "name": "Hepatitis B 3 (days 21 to 28)",
                    "created": "2014-03-12T12:30:17.457+0000",
                    "lastUpdated": "2014-03-12T12:30:17.470+0000",
                    "id": "HB3"
                }, {
                    "code": "Polio 3",
                    "name": "Polio 3",
                    "created": "2014-03-12T12:30:16.954+0000",
                    "lastUpdated": "2014-03-12T12:30:16.964+0000",
                    "id": "Polio3"
                }, {
                    "code": "TT_4",
                    "name": "TT4",
                    "created": "2014-03-12T12:30:17.271+0000",
                    "lastUpdated": "2014-03-12T12:30:17.283+0000",
                    "id": "TT4"
                }, {
                    "code": "HPV_1",
                    "name": "HPV1",
                    "created": "2014-03-12T12:30:17.177+0000",
                    "lastUpdated": "2014-03-12T12:30:17.189+0000",
                    "id": "HPV1"
                }, {
                    "code": "DTC_HIB_3",
                    "name": "DTC + Hib 3",
                    "created": "2014-03-12T12:30:16.841+0000",
                    "lastUpdated": "2014-03-12T12:30:16.849+0000",
                    "id": "DTCHIB3"
                }, {
                    "code": "TT_2",
                    "name": "TT2",
                    "created": "2014-03-12T12:30:17.239+0000",
                    "lastUpdated": "2014-03-12T12:30:17.250+0000",
                    "id": "TT2"
                }],
                "categoryCombo": null,
                "mobile": false,
                "expiryDays": 15,
                "timelyDays": 15,
                "skipAggregation": false,
                "notifyCompletingUser": false,
                "approveData": false,
                "allowFuturePeriods": false,
                "fieldCombinationRequired": false,
                "validCompleteOnly": false,
                "noValueRequiresComment": false,
                "skipOffline": false,
                "dataElementDecoration": false,
                "renderAsTabs": false,
                "renderHorizontally": false,
                "legendSet": null,
                "id": "DS_VS"
            }]
        }
    };
});