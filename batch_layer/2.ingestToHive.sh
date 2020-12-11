#!/bin/bash
options="jdbc:hive2://localhost:10000/default -n hadoop -d org.apache.hive.jdbc.HiveDriver"
declare -a sql_files=("crashes.hql" "redlight_cam.hql" "speed_dam.hql" "traffic_hist.hql")
for val in "${sql_files[@]}"; 
do
  beeline -u ${options} -f $val
done