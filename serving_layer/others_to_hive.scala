// Launch the spark shell with all jars needed by your tables. E.g.,
spark-shell --master local[*]
import org.apache.spark.sql.SaveMode
import org.apache.spark.sql.functions._

// Opening hive tables as spark dataframes
val yson_redlight_cam = spark.table("yson_redlight_cam")
val yson_speed_cam = spark.table("yson_speed_cam")
val yson_crashes = spark.table("yson_crashes")
val yson_traffic_hist = spark.table("yson_traffic_hist")

////////////////////////////////////////////////////////////
// redlight camera and speed camera aggregation
////////////////////////////////////////////////////////////

// redlight camera violations within year and within 3 months
val redlight_within_year = yson_redlight_cam.
    select(yson_redlight_cam("dir_street_suf"), yson_redlight_cam("redlight_viol_date"), yson_redlight_cam("violations")).
    filter($"redlight_viol_date" > add_months(current_date,-12))
    redlight_within_year.createOrReplaceTempView("redlight_within_year")
val redlight_year_df = spark.sql(
"""SELECT replace(replace(replace(replace(replace(replace(dir_street_suf,' STREET',''),
      ' ST',''),' AVENUE',''),' AVE',''),' ROAD',''),' RD','') street,
        sum(violations) redlight_year
      FROM redlight_within_year
      GROUP BY street
      ORDER BY street
      """)
redlight_year_df.createOrReplaceTempView("redlight_year_df")

val redlight_within_months = yson_redlight_cam.
select(yson_redlight_cam("dir_street_suf"), yson_redlight_cam("redlight_viol_date"), yson_redlight_cam("violations")).
filter($"redlight_viol_date" > add_months(current_date,-2))
redlight_within_months.createOrReplaceTempView("redlight_within_months")
val redlight_months_df = spark.sql(
  """SELECT replace(replace(replace(replace(replace(replace(dir_street_suf,' STREET',''),
      ' ST',''),' AVENUE',''),' AVE',''),' ROAD',''),' RD','') street,
        sum(violations) redlight_months
     FROM redlight_within_months
     GROUP BY street
     """)
redlight_months_df.createOrReplaceTempView("redlight_months_df")

val redlight_year_months = redlight_year_df.
join(redlight_months_df, redlight_year_df("street") <=> redlight_months_df("street")).
select(redlight_year_df("street"), redlight_year_df("redlight_year"), redlight_months_df("redlight_months"))
redlight_year_months.createOrReplaceTempView("redlight_year_months")



// speed camera violations within year and within 3 months
val speed_within_year = yson_speed_cam.
    select(yson_speed_cam("dir_street_suf"), yson_speed_cam("speed_viol_date"), yson_speed_cam("violations")).
    filter($"speed_viol_date" > add_months(current_date,-12))
speed_within_year.createOrReplaceTempView("speed_within_year")
val speed_year_df = spark.sql(
  """SELECT replace(replace(replace(replace(replace(replace(dir_street_suf,' STREET',''),
      ' ST',''),' AVENUE',''),' AVE',''),' ROAD',''),' RD','') dir_street_suf,
      sum(violations) speed_year
     FROM speed_within_year
     GROUP BY dir_street_suf
     """)
speed_year_df.createOrReplaceTempView("speed_year_df")

val speed_within_months = yson_speed_cam.
    select(yson_speed_cam("dir_street_suf"), yson_speed_cam("speed_viol_date"), yson_speed_cam("violations")).
    filter($"speed_viol_date" > add_months(current_date,-2))
speed_within_months.createOrReplaceTempView("speed_within_months")
val speed_months_df = spark.sql(
  """SELECT replace(replace(replace(replace(replace(replace(dir_street_suf,' STREET',''),
      ' ST',''),' AVENUE',''),' AVE',''),' ROAD',''),' RD','') dir_street_suf,
   sum(violations) speed_months
     FROM speed_within_months
     GROUP BY dir_street_suf
     """)
speed_months_df.createOrReplaceTempView("speed_months_df")

val speed_year_months = speed_year_df.
    join(speed_months_df, speed_year_df("dir_street_suf") <=> speed_months_df("dir_street_suf")).
    select(speed_year_df("dir_street_suf"), speed_year_df("speed_year"), speed_months_df("speed_months"))
speed_year_months.createOrReplaceTempView("speed_year_months")



// join redlight camera and speed camera violations
val redlight_speed = redlight_year_months.
    join(speed_year_months, levenshtein(redlight_year_months("street"), speed_year_months("dir_street_suf")) < 1, "left").
    withColumn("name_", coalesce(redlight_year_months("street"), speed_year_months("dir_street_suf"))).
    drop("name").
    withColumnRenamed("name_", "name").
    select("name", "redlight_year", "redlight_months", "speed_year", "speed_months").
    withColumn("name", initcap(col("name")))
redlight_speed.createOrReplaceTempView("redlight_speed")
redlight_speed.write.mode(SaveMode.Overwrite).saveAsTable("yson_redlight_speed")




///////////////////////////////////////////////////////////
// crashes
///////////////////////////////////////////////////////////
val crashes = spark.sql(
  """SELECT crash_record_id, crash_date, street_num, replace(replace(replace(replace(dir_street_suf,' BLVD',''),
      ' ST',''),' AVE',''),' RD','') dir_street_suf, first_crash_type, crash_type, prim_cause, damage
     FROM yson_crashes
     """)
crashes.createOrReplaceTempView("crashes")

val crashes2 = crashes.
  select($"crash_record_id", $"crash_date", $"dir_street_suf", $"street_num",
    $"first_crash_type", $"crash_type", $"prim_cause", $"damage").
  filter($"crash_date" > add_months(current_date,-1)).
  withColumn("dir_street_suf", initcap(col("dir_street_suf")))
crashes2.createOrReplaceTempView("crashes2")

val crashes_month = spark.sql(
  """SELECT * from crashes2 where dir_street_suf in (SELECT DISTINCT dir_street from yson_traffic_hist)"""
)
crashes_month.createOrReplaceTempView("crashes_month")
crashes_month.write.mode(SaveMode.Overwrite).saveAsTable("yson_crashes_month")

