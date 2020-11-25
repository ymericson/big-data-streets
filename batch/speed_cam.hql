
DROP TABLE IF EXISTS yson_speed_cam_csv;
CREATE EXTERNAL TABLE yson_speed_cam_csv(
    address string,
    camera_id string,
    violation_date timestamp,
    violations int,
    x_coord string,
    y_coord string,
    latitude string,
    longitude string,
    location string
)
    ROW FORMAT serde 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = "\,",
    "quoteChar"     = "\"",
    "timestamp.formats" = "MM/dd/yyyy"
)
STORED AS TEXTFILE
LOCATION '/tmp/yson/chidata/speed_cam'
TBLPROPERTIES("skip.header.line.count"="1");


-- Create an ORC table to hold data
DROP TABLE IF EXISTS yson_speed_cam;
CREATE EXTERNAL TABLE yson_speed_cam(
    address string,
    dir_street_suf string,
    camear_id string,
    speed_viol_date date,
    speed_viol_datetime timestamp,
    violations int,
    x_coord float,
    y_coord float,
    latitude decimal(10, 8),
    longitude decimal(10, 8),
    location string
)
    stored as orc;

-- Copy the CSV table to the ORC table
INSERT OVERWRITE TABLE yson_speed_cam
SELECT
    address,
    regexp_extract(address, '^(.*?)(?: )(.*)$', 2),
    camera_id,
    date(from_unixtime(unix_timestamp(violation_date,"MM/dd/yyyy"))),
    from_unixtime(unix_timestamp(violation_date,"MM/dd/yyyy")),
    violations,
    x_coord,
    y_coord,
    latitude,
    longitude,
    location
FROM yson_speed_cam_csv
WHERE address is not null and location is not null;


--SELECT * from yson_speed_cam limit 10;

--DROP TABLE IF EXISTS yson_speed_cam_csv;
