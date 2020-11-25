

DROP TABLE IF EXISTS yson_traffic_hist_csv;
CREATE EXTERNAL TABLE yson_traffic_hist_csv(
    traffic_datetime timestamp,
    segment_id int,
    speed int,
    street string,
    direction string,
    from_street string,
    to_street string,
    length int,
    street_heading string,
    comments string,
    bus_count int,
    message_count int,
    hour int,
    day_of_week int,
    month int,
    record_id string,
    start_latitude string,
    start_longitude string,
    end_latitude string,
    end_longitude string,
    start_location string,
    end_location string
)
    ROW FORMAT serde 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = "\,",
    "quoteChar"     = "\"",
    "timestamp.formats" = "MM/dd/yyyy hh:mm:ss a"
)
STORED AS TEXTFILE
LOCATION '/tmp/yson/chidata/traffic_hist'
TBLPROPERTIES("skip.header.line.count"="1");

-- Create an ORC table to hold data
DROP TABLE IF EXISTS yson_traffic_hist;
CREATE EXTERNAL TABLE yson_traffic_hist(
    --traffic_date date,
    traffic_datetime timestamp,
    segment_id int,
    speed int,
    street string,
    dir_street string,
    traffic_direction string,
    from_street string,
    to_street string,
    length int,
    street_heading string,
    comments string,
    bus_count int,
    message_count int,
    hour int,
    day_of_week int,
    month int,
    record_id string,
    start_latitude decimal(10, 8),
    start_longitude decimal(10, 8),
    end_latitude decimal(10, 8),
    end_longitude decimal(10, 8),
    start_location string,
    end_location string
)
    stored as orc;

-- Copy the CSV table to the ORC table
INSERT OVERWRITE TABLE yson_traffic_hist
SELECT
    --date(from_unixtime(unix_timestamp(traffic_datetime,"MM/dd/yyyy hh:mm:ss a"))),
    from_unixtime(unix_timestamp(traffic_datetime,"MM/dd/yyyy hh:mm:ss a")),
    segment_id,
    speed,
    street,
    CONCAT(street_heading, " ", street),
    direction,
    from_street,
    to_street,
    length,
    street_heading,
    comments,
    bus_count,
    message_count,
    hour,
    day_of_week,
    month,
    record_id,
    start_latitude,
    start_longitude,
    end_latitude,
    end_longitude,
    start_location,
    end_location
FROM yson_traffic_hist_csv
WHERE street_heading is not null and street is not null;

select dir_street, traffic_datetime from yson_traffic_hist limit 10;


--DROP TABLE IF EXISTS yson_traffic_hist_csv;
