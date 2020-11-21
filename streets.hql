-- This file will create an ORC table with street name data
-- First, map the CSV data we downloaded in Hive
DROP TABLE IF EXISTS yson_streets_csv;
CREATE EXTERNAL TABLE yson_streets_csv(
    FullStreetName string,
    Direction string,
    Street string,
    Suffix string,
    SuffixDirection string,
    MinAddress string,
    MaxAddress string)
    ROW FORMAT serde 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
    "separatorChar" = "\,",
    "quoteChar"     = "\"")
STORED AS TEXTFILE
LOCATION '/tmp/yson/chidata/streets'
TBLPROPERTIES("skip.header.line.count"="1");

-- Create an ORC table to hold data
DROP TABLE IF EXISTS yson_streets;
CREATE EXTERNAL TABLE yson_streets(
    FullStreetName string,
    Direction string,
    Street string,
    Suffix string,
    SuffixDirection string,
    MinAddress string,
    MaxAddress string)
    stored as orc;

-- Copy the CSV table to the ORC table
INSERT OVERWRITE TABLE yson_streets
SELECT * FROM yson_streets_csv
WHERE FullStreetName is not null and Street is not null;

DROP TABLE IF EXISTS yson_streets_csv;
