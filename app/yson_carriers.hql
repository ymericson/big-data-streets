drop table if exists yson_hw6_1;
create external table yson_hw6_1 (
    carrier_year string,
    all_ontime_dep string,
    fog_ontime_dep string,
    rain_ontime_dep string,
    snow_ontime_dep string,
    hail_ontime_dep string,
    thunder_ontime_dep string,
    tornado_ontime_dep string)
STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key, ontime:all_ontime_dep, ontime:fog_ontime_dep,
ontime:rain_ontime_dep, ontime:snow_ontime_dep, ontime:hail_ontime_dep, ontime:thunder_ontime_dep, ontime:tornado_ontime_dep')
TBLPROPERTIES ('hbase.table.name' = 'yson_hw6_1');

insert overwrite table yson_hw6_1
SELECT CONCAT(carrier, year) as carrier_year,
    cast(sum(case when dep_delay <= 15 then 1 end) / count(1) * 100 as decimal(16, 3)) all_ontime_dep,
    cast(sum(case when fog and dep_delay <= 15 then 1 else 0 end) / count(fog) * 100 as decimal(16, 3)) fog_ontime_dep,
    cast(sum(case when rain and dep_delay <= 15 then 1 else 0 end) / count(rain) * 100 as decimal(16, 3)) rain_ontime_dep,
    cast(sum(case when snow and dep_delay <= 15 then 1 else 0 end) / count(snow) * 100 as decimal(16, 3)) snow_ontime_dep,
    cast(sum(case when hail and dep_delay <= 15 then 1 else 0 end) / count(hail) * 100 as decimal(16, 3)) hail_ontime_dep,
    cast(sum(case when thunder and dep_delay <= 15 then 1 else 0 end) / count(thunder) * 100 as decimal(16, 3)) thunder_ontime_dep,
    cast(sum(case when tornado and dep_delay <= 15 then 1 else 0 end) / count(tornado) * 100 as decimal(16, 3)) tornado_ontime_dep
FROM flights_and_weather
GROUP BY carrier, year;

drop table if exists yson_carriers;
create table yson_carriers (carrier string, carrier_dup string)
    STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
    WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key, info:carrier')
    TBLPROPERTIES ('hbase.table.name' = 'yson_carriers');

insert overwrite table yson_carriers
    select distinct carrier, carrier from ontime;




























