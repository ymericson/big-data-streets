
DROP TABLE IF EXISTS yson_redlight_cam_csv;
CREATE EXTERNAL TABLE yson_redlight_cam_csv(
    intersection string,
    camera_id string,
    address string,
    violation_date timestamp,
    violations int,
    x_coord int,
    y_coord int,
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
LOCATION '/tmp/yson/chidata/redlight_cam'
TBLPROPERTIES("skip.header.line.count"="1");


-- Create an ORC table to hold data
DROP TABLE IF EXISTS yson_redlight_cam;
CREATE EXTERNAL TABLE yson_redlight_cam(
    intersection string,
    camera_id string,
    address string,
    dir_street_suf string,
    redlight_viol_date date,
    redlight_viol_datetime timestamp,
    violations int,
    x_coord int,
    y_coord int,
    latitude decimal(10, 8),
    longitude decimal(10, 8),
    location string
)
    stored as orc;

-- Copy the CSV table to the ORC table
INSERT OVERWRITE TABLE yson_redlight_cam
SELECT
    intersection,
    camera_id,
    address,
    regexp_extract(address, '^(.*?)(?: )(.*)$', 2),
    date(from_unixtime(unix_timestamp(violation_date,"MM/dd/yyyy"))),
    from_unixtime(unix_timestamp(violation_date,"MM/dd/yyyy")),
    violations,
    x_coord,
    y_coord,
    latitude,
    longitude,
    location
FROM yson_redlight_cam_csv
WHERE address is not null and location is not null;


--SELECT dir_street_suf, redlight_viol_date from yson_redlight_cam limit 30;

--DROP TABLE IF EXISTS yson_redlight_cam_csv;
