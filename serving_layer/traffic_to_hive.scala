// Launch the spark shell with all jars needed by your tables. E.g.,
spark-shell --master local[*]
import org.apache.spark.sql.SaveMode

// Opening hive tables as spark dataframes

val yson_traffic_hist = spark.table("yson_traffic_hist")

////////////////////////////////////////////////////////////
// traffic aggregation
////////////////////////////////////////////////////////////

// remove speeds of -1 (no estimate is available)
val traffic_null = yson_traffic_hist.
select($"segment_id", yson_traffic_hist("dir_street").as("street"), $"traffic_datetime", $"from_street", $"to_street",
    $"traffic_direction", $"speed").
  withColumn("speed", when(col("speed") > 0,$"speed"))
traffic_null.createOrReplaceTempView("traffic_null")

// get average traffic by month, week, day, hour, and current
val traffic_month = traffic_null.
  filter($"traffic_datetime" > add_months(current_date,-1)).
  groupBy(yson_traffic_hist("segment_id"), $"street", $"from_street",
      $"to_street", $"traffic_direction").
  agg(avg("speed").as("speed_month"))
traffic_month.createOrReplaceTempView("traffic_month")

val traffic_week = traffic_null.
  filter($"traffic_datetime" > date_add(current_date,-7)).
  groupBy(yson_traffic_hist("segment_id").as("segment_id_week")).
  agg(avg("speed").as("speed_week"))
traffic_week.createOrReplaceTempView("traffic_week")

val traffic_day = traffic_null.
  filter($"traffic_datetime" > date_add(current_date,-111111)).
  groupBy(yson_traffic_hist("segment_id").as("segment_id_day")).
  agg(avg("speed").as("speed_day"))
traffic_day.createOrReplaceTempView("traffic_day")

val traffic_hour = traffic_null.
  filter($"traffic_datetime" > (current_date - expr("INTERVAL 111111 HOURS"))).
  groupBy(yson_traffic_hist("segment_id").as("segment_id_hour")).
  agg(avg("speed").as("speed_hour"))
traffic_hour.createOrReplaceTempView("traffic_hour")

val traffic_current = traffic_null.
  filter($"traffic_datetime" > (current_date - expr("INTERVAL 10 minutes"))).
  groupBy(yson_traffic_hist("segment_id").as("segment_id_current")).
  agg(avg("speed").as("speed_current"))
traffic_current.createOrReplaceTempView("traffic_current")

// put all average speeds in one graph
val traffic_times_draft = traffic_month.
  join(traffic_week, traffic_month("segment_id") === traffic_week("segment_id_week"), "left").
  join(traffic_day, traffic_month("segment_id") === traffic_day("segment_id_day"), "left").
  join(traffic_hour, traffic_month("segment_id") === traffic_hour("segment_id_hour"), "left").
  join(traffic_current, traffic_month("segment_id") === traffic_current("segment_id_current"), "left").
    select("segment_id", "street", "from_street", "to_street", "traffic_direction",
        "speed_month", "speed_week", "speed_day", "speed_hour", "speed_current")
traffic_times_draft.createOrReplaceTempView("traffic_times_draft")

// rounding average speeds
val traffic_times = traffic_times_draft.
  withColumn("street", upper(traffic_times_draft("street"))).
  withColumn("from_street", upper(traffic_times_draft("from_street"))).
  withColumn("to_street", upper(traffic_times_draft("to_street"))).
  withColumn("speed_month", bround(traffic_times_draft("speed_month"), 2)).
  withColumn("speed_week", bround(traffic_times_draft("speed_week"), 2)).
  withColumn("speed_day", bround(traffic_times_draft("speed_day"), 2)).
  withColumn("speed_hour", bround(traffic_times_draft("speed_hour"), 2)).
  withColumn("speed_current", bround(traffic_times_draft("speed_current"), 2))
traffic_times.createOrReplaceTempView("traffic_times")
import org.apache.spark.sql.SaveMode
traffic_times.write.mode(SaveMode.Overwrite).saveAsTable("yson_traffic_times")
