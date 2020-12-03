  
#!/bin/bash

# 1.getData.sh
# Downloads data from Chicago Data Portal

chi_url=https://data.cityofchicago.org/api/views
declare -A chicago_data=( ["crashes"]="85ca-t3if" ["streets"]="i6bp-fvbx" ["redlight_cam"]="spqx-js37" ["speed_cam"]="hhkd-xvj4" ["traffic_hist"]="sxs8-h27x")
for data in "${!chicago_data[@]}"; 
do 
	curl ${chi_url}/${chicago_data[$data]}/rows.csv | hdfs dfs -put -f - /tmp/yson/chidata/$data/$data.csv
done