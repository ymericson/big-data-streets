drop table if exists yson_traffic_times_hbase;
create table yson_traffic_times_hbase (
    segment_id BIGINT,
    street STRING,
    from_street STRING,
    to_street STRING,
    speed_month STRING,
    speed_week STRING,
    speed_day STRING,
    speed_hour STRING
)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,stats:street,stats:from_street,stats:to_street,
    stats:speed_month,stats:speed_week,stats:speed_day,stats:speed_hour')
TBLPROPERTIES ('hbase.table.name' = 'yson_traffic_times');

insert overwrite table yson_traffic_times_hbase
select
    segment_id,
    dir_street,
    from_street,
    to_street,
    ROUND(AVG(IF(month(traffic_datetime) = month(current_timestamp), speed, NULL)), 2) AS speed_month,
    ROUND(AVG(IF(weekofyear(traffic_datetime) = weekofyear(current_timestamp), speed, NULL)), 2) AS speed_week,
    ROUND(AVG(IF(dayofweek(traffic_datetime) = dayofweek(current_timestamp), speed, NULL)), 2) AS speed_week,
    ROUND(AVG(IF(hour(traffic_datetime) = hour(current_timestamp), speed, NULL)), 2) AS speed_week
from yson_traffic_hist
where speed != -1
group by segment_id, dir_street, from_street, to_street;




drop table if exists yson_street_by_seg;
create table yson_street_by_seg (
    street_segment_id STRING,
    segment_id STRING,
    street STRING,
    from_street STRING,
    to_street STRING,
    speed_month STRING,
    speed_week STRING,
    speed_day STRING,
    speed_hour STRING
)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,stats:segment_id,stats:street,stats:from_street,stats:to_street,
    stats:speed_month,stats:speed_week,stats:speed_day,stats:speed_hour')
TBLPROPERTIES ('hbase.table.name' = 'yson_street_by_seg');

insert overwrite table yson_street_by_seg
select
    concat(dir_street, segment_id),
    segment_id,
    dir_street,
    from_street,
    to_street,
    ROUND(AVG(IF(month(traffic_datetime) = month(current_timestamp), speed, NULL)), 2) AS speed_month,
    ROUND(AVG(IF(weekofyear(traffic_datetime) = weekofyear(current_timestamp), speed, NULL)), 2) AS speed_week,
    ROUND(AVG(IF(dayofweek(traffic_datetime) = dayofweek(current_timestamp), speed, NULL)), 2) AS speed_week,
    ROUND(AVG(IF(hour(traffic_datetime) = hour(current_timestamp), speed, NULL)), 2) AS speed_week
from yson_traffic_hist
where speed != -1
group by segment_id, dir_street, street, from_street, to_street;




drop table if exists yson_segment_ids;
create table yson_segment_ids (
    segment_id BIGINT,
    street STRING)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
  WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,info:street')
  TBLPROPERTIES ('hbase.table.name' = 'yson_segment_ids');
insert overwrite table yson_segment_ids
  select distinct segment_id, street
  from yson_traffic_times;

drop table if exists yson_st_segid;
create table yson_streets (
    st_name_id STRING,
    segment_id BIGINT)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
  WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,info:segment_id')
  TBLPROPERTIES ('hbase.table.name' = 'yson_st_segid');
insert overwrite table yson_st_segid
  SELECT distinct CONCAT(street, segment_id) st_name_id, segment_id
  FROM yson_traffic_times;

drop table if exists yson_streets;
create table yson_streets (
    street STRING,
    street_dup STRING)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
  WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,info:street')
  TBLPROPERTIES ('hbase.table.name' = 'yson_streets');
insert overwrite table yson_streets
  SELECT distinct street, street
  FROM yson_traffic_times;










insert overwrite table yson_traffic_times_hbase
select
    segment_id,
    street,
    from_street,
    to_street,
    speed_month,
    speed_week,
    speed_day,
    speed_hour,
    speed_current
from
    yson_traffic_times;



insert overwrite table yson_traffic_times_hbase
select
    segment_id,
    street,
    from_street,
    to_street,
    AVG(IF(traffic_datetime > DATE_SUB(current_timestamp, 30), speed, NULL)) AS speed_month,
    AVG(IF(traffic_datetime > DATE_SUB(current_timestamp, 7), speed, NULL)) AS speed_week,
    AVG(IF(traffic_datetime > DATE_SUB(current_timestamp, 1), speed, NULL)) AS speed_day,
    AVG(IF(traffic_datetime > DATE_SUB(current_timestamp, 1)
        and (hour(traffic_datetime) = hour(current_timestamp)), speed, NULL)) AS speed_hour
from
    yson_traffic_hist
where
    speed != -1
group by
    segment_id, street, from_street, to_street;










































