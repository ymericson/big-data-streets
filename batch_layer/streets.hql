-- This file will create an ORC table with street name data
-- First, map the CSV data we downloaded in Hive
DROP TABLE IF EXISTS yson_streets_csv;
CREATE EXTERNAL TABLE yson_streets_csv(
    full_street_name string,
    direction string,
    street string,
    suffix string,
    suffix_dir string,
    min_address string,
    max_address string
)
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
    dir_street_suf string,
    dir_street string,
    direction string,
    street string,
    suffix string,
    suffix_dir string,
    min_address string,
    max_address string
)
    stored as orc;

-- Copy the CSV table to the ORC table
INSERT OVERWRITE TABLE yson_streets
SELECT
    full_street_name,
    CONCAT(direction, " ", street),
    direction,
    street,
    suffix,
    suffix_dir,
    min_address,
    max_address
FROM yson_streets_csv
WHERE full_street_name is not null and street is not null;



DROP TABLE IF EXISTS yson_streets_csv;
