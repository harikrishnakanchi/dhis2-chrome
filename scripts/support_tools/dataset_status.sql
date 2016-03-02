WITH weekly_periods AS (
	SELECT			pe.periodid,
					pe.startdate,
					date_part('year', pe.startdate) || 'W' || date_part('week', pe.startdate) "periodId"
	FROM			period AS pe
	INNER JOIN		periodtype AS pet ON pet.periodtypeid = pe.periodtypeid AND pet."name" = 'Weekly'
	WHERE			pe.startdate >= '2015-07-27' AND pe.enddate <= '2016-01-17'
), orgunits_datasets AS (
	SELECT			ou_l4.name "orgUnitGrandparent",
					ou_l5.name "orgUnitParent",
					ou.name "orgUnit",
					ou.uid "orgUnitId",
					ou.organisationunitid,
					ds.name "dataSet",
					ds.uid "dataSetId",
					ds.datasetid
	FROM			organisationunit AS ou
	LEFT OUTER JOIN	organisationunit AS ou_l7 ON ou_l7.parentid = ou.organisationunitid
	INNER JOIN		organisationunit AS ou_l5 ON ou_l5.organisationunitid = ou.parentid
	INNER JOIN		organisationunit AS ou_l4 ON ou_l4.organisationunitid = ou_l5.parentid
	INNER JOIN		organisationunit AS ou_l3 ON ou_l3.organisationunitid = ou_l4.parentid
	INNER JOIN		organisationunit AS ou_l2 ON ou_l2.organisationunitid = ou_l3.parentid AND ou_l2.name = 'OCP'
	INNER JOIN		datasetsource AS dsou ON dsou.sourceid = ou.organisationunitid OR dsou.sourceid = ou_l7.organisationunitid
	INNER JOIN		dataset AS ds ON ds.datasetid = dsou.datasetid
	GROUP BY		ou_l4.name, ou_l5.name, ou.name, ou.uid, ou.organisationunitid, ds.name, ds.uid, ds.datasetid
)
SELECT			ouds."orgUnitGrandparent",
				ouds."orgUnitParent",
				ouds."orgUnit",
				ouds."orgUnitId",
				ouds."dataSet",
				ouds."dataSetId",
				pe."periodId",
				pe.startdate "periodStartDate",
				dss."lastUpdated" "submittedOn",
				dss."storedBy" "submittedBy",
				dsc."date" "completedOn",
				dsc.storedby "completedBy",
				dsa.created "approvedOn",
				dsau.username "approvedBy"
FROM			orgunits_datasets AS ouds
CROSS JOIN		weekly_periods AS pe
LEFT OUTER JOIN	completedatasetregistration AS dsc ON
					dsc.datasetid = ouds.datasetid AND
					dsc.sourceid = ouds.organisationunitid AND
					dsc.periodid = pe.periodid
LEFT OUTER JOIN dataapproval AS dsa ON
					dsa.datasetid = ouds.datasetid AND
					dsa.organisationunitid = ouds.organisationunitid AND
					dsa.periodid = pe.periodid
LEFT OUTER JOIN	users AS dsau ON dsau.userid = dsa.creator
LEFT OUTER JOIN (
					SELECT		dv.sourceid,
								dv.datasetid,
								dv.periodid,
								MAX(dv.lastupdated) "lastUpdated",
								MAX(dv.storedby) "storedBy"
					FROM (
							SELECT		dv.sourceid,
										dsm.datasetid,
										dv.periodid,
										dv.lastupdated,
										dv.storedby
							FROM		datavalue dv
							INNER JOIN	datasetmembers dsm ON dsm.dataelementid = dv.dataelementid
							INNER JOIN	(
											SELECT		ou_l6.organisationunitid
											FROM		organisationunit AS ou_l6
											INNER JOIN	organisationunit AS ou_l5 ON ou_l5.organisationunitid = ou_l6.parentid
											INNER JOIN	organisationunit AS ou_l4 ON ou_l4.organisationunitid = ou_l5.parentid
											INNER JOIN	organisationunit AS ou_l3 ON ou_l3.organisationunitid = ou_l4.parentid
											INNER JOIN	organisationunit AS ou_l2 ON ou_l2.organisationunitid = ou_l3.parentid AND ou_l2.name = 'OCP'
										) moduleOrgUnits ON moduleOrgUnits.organisationunitid = dv.sourceid
							UNION ALL
							SELECT		parentId "sourceId",
										dsm.datasetid,
										dv.periodid,
										dv.lastupdated,
										dv.storedby
							FROM		datavalue dv
							INNER JOIN	datasetmembers dsm ON dsm.dataelementid = dv.dataelementid
							INNER JOIN	(
											SELECT		ou_l7.organisationunitid,
														ou_l6.organisationunitid as parentId
											FROM		organisationunit AS ou_l7
											INNER JOIN	organisationunit AS ou_l6 ON ou_l6.organisationunitid = ou_l7.parentid
											INNER JOIN	organisationunit AS ou_l5 ON ou_l5.organisationunitid = ou_l6.parentid
											INNER JOIN	organisationunit AS ou_l4 ON ou_l4.organisationunitid = ou_l5.parentid
											INNER JOIN	organisationunit AS ou_l3 ON ou_l3.organisationunitid = ou_l4.parentid
											INNER JOIN	organisationunit AS ou_l2 ON ou_l2.organisationunitid = ou_l3.parentid AND ou_l2.name = 'OCP'
										) originOrgUnits ON originOrgUnits.organisationunitid = dv.sourceid
						) dv
						GROUP BY	dv.sourceid, dv.datasetid, dv.periodid
				) dss ON
					dss.datasetid = ouds.datasetid AND
					dss.sourceid = ouds.organisationunitid AND
					dss.periodid = pe.periodid
ORDER BY		"orgUnitGrandparent", "orgUnitParent", "orgUnit", "periodStartDate", "dataSet"
