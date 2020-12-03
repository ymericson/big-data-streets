DROP TABLE IF EXISTS yson_street_by_seg;
CREATE TABLE yson_street_by_seg (
    street_segment_id STRING,
    segment_id STRING,
    street STRING,
    from_street STRING,
    to_street STRING,
    traffic_direction STRING,
    speed_month STRING,
    speed_week STRING,
    speed_day STRING,
    speed_hour STRING,
    speed_now BIGINT
)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,stats:segment_id,stats:street,stats:from_street,stats:to_street,
    stats:traffic_direction,stats:speed_month,stats:speed_week,stats:speed_day,stats:speed_hour,stats:speed_now#b')
TBLPROPERTIES ('hbase.table.name' = 'yson_street_by_seg');

INSERT OVERWRITE TABLE yson_street_by_seg
SELECT
    concat(dir_street, segment_id),
    segment_id,
    dir_street,
    from_street,
    to_street,
    traffic_direction,
    ROUND(AVG(IF(month(traffic_datetime) = month(current_timestamp), speed, NULL)), 2) AS speed_month,
    ROUND(AVG(IF(weekofyear(traffic_datetime) = weekofyear(current_timestamp), speed, NULL)), 2) AS speed_week,
    ROUND(AVG(IF(dayofweek(traffic_datetime) = dayofweek(current_timestamp), speed, NULL)), 2) AS speed_week,
    ROUND(AVG(IF(hour(traffic_datetime) = hour(current_timestamp), speed, NULL)), 2) AS speed_week,
    0
FROM yson_traffic_hist
WHERE  speed != -1
GROUP BY segment_id, dir_street, street, from_street, to_street, traffic_direction;


DROP TABLE IF EXISTS yson_streets;
CREATE TABLE yson_streets (
    street STRING,
    street_dup STRING)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
  WITH SERDEPROPERTIES ('hbase.columns.mapping' = ':key,info:street')
  TBLPROPERTIES ('hbase.table.name' = 'yson_streets');
INSERT OVERWRITE TABLE yson_streets
  SELECT distinct dir_street, dir_street
  FROM yson_traffic_hist;
