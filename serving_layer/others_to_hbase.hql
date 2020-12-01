DROP TABLE IF EXISTS yson_redlight_speed_hbase;
CREATE TABLE yson_redlight_speed_hbase (
    street_name STRING,
    street STRING,
    redlight_year STRING,
    redlight_months STRING,
    speed_year STRING,
    speed_months STRING
)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,stats:street,stats:redlight_year,
    stats:redlight_months,stats:speed_year,stats:speed_months')
TBLPROPERTIES ('hbase.table.name' = 'yson_redlight_speed');

INSERT OVERWRITE TABLE yson_redlight_speed_hbase
SELECT
    name,
    name,
    redlight_year,
    redlight_months,
    speed_year,
    speed_months
FROM
    yson_redlight_speed;




DROP TABLE IF EXISTS yson_crashes_month_hbase;
CREATE TABLE yson_crashes_month_hbase (
    crash_record_id STRING,
    street STRING,
    address STRING,
    crash_date STRING,
    first_crash_type STRING,
    crash_type STRING,
    prim_cause STRING,
    damage STRING
)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,stats:street,stats:address,stats:crash_date,
    stats:first_crash_type,stats:crash_type,stats:prim_cause,stats:damage')
TBLPROPERTIES ('hbase.table.name' = 'yson_crashes_month');


INSERT OVERWRITE TABLE yson_crashes_month_hbase
SELECT
    concat(dir_street_suf, crash_record_id),
    dir_street_suf,
    concat(street_num, " ", dir_street_suf),
    crash_date,
    first_crash_type,
    crash_type,
    prim_cause,
    damage
FROM
    yson_crashes_month;

