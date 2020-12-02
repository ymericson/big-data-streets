import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.spark.SparkConf
import org.apache.spark.streaming._
import org.apache.spark.streaming.kafka010.ConsumerStrategies.Subscribe
import org.apache.spark.streaming.kafka010.LocationStrategies.PreferConsistent
import org.apache.spark.streaming.kafka010._
import com.fasterxml.jackson.databind.{ DeserializationFeature, ObjectMapper }
import com.fasterxml.jackson.module.scala.experimental.ScalaObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.hbase.TableName
import org.apache.hadoop.hbase.HBaseConfiguration
import org.apache.hadoop.hbase.client.ConnectionFactory
import org.apache.hadoop.hbase.client.Get
import org.apache.hadoop.hbase.client.Increment
import org.apache.hadoop.hbase.util.Bytes

object StreamFlights {
  val mapper = new ObjectMapper()
  mapper.registerModule(DefaultScalaModule)
  val hbaseConf: Configuration = HBaseConfiguration.create()
  hbaseConf.set("hbase.zookeeper.property.clientPort", "2181")
  hbaseConf.set("hbase.zookeeper.quorum", "localhost")
  
  val hbaseConnection = ConnectionFactory.createConnection(hbaseConf)
  val weatherDelaysByRoute = hbaseConnection.getTable(TableName.valueOf("weather_delays_by_route_v2"))
  val latestWeather = hbaseConnection.getTable(TableName.valueOf("latest_weather"))
  
  def getLatestWeather(station: String) = {
      val result = latestWeather.get(new Get(Bytes.toBytes(station)))
      System.out.println(result.isEmpty())
      if(result.isEmpty())
        None
      else
        Some(WeatherReport(
              station,
              Bytes.toBoolean(result.getValue(Bytes.toBytes("weather"), Bytes.toBytes("fog"))),
              Bytes.toBoolean(result.getValue(Bytes.toBytes("weather"), Bytes.toBytes("rain"))),
              Bytes.toBoolean(result.getValue(Bytes.toBytes("weather"), Bytes.toBytes("snow"))),
              Bytes.toBoolean(result.getValue(Bytes.toBytes("weather"), Bytes.toBytes("hail"))),
              Bytes.toBoolean(result.getValue(Bytes.toBytes("weather"), Bytes.toBytes("thunder"))),
              Bytes.toBoolean(result.getValue(Bytes.toBytes("weather"), Bytes.toBytes("tornado")))))
  }
  
  def incrementDelaysByRoute(kfr : KafkaFlightRecord) : String = {
    val maybeLatestWeather = getLatestWeather(kfr.originName)
    if(maybeLatestWeather.isEmpty)
      return "No weather for " + kfr.originName;
    val latestWeather = maybeLatestWeather.get
    val inc = new Increment(Bytes.toBytes(kfr.originName + kfr.destinationName))
    if(latestWeather.clear) {
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("clear_flights"), 1)
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("clear_delays"), kfr.departureDelay)
    }
    if(latestWeather.fog) {
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("fog_flights"), 1)
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("fog_delays"), kfr.departureDelay)
    }
    if(latestWeather.rain) {
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("rain_flights"), 1)
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("rain_delays"), kfr.departureDelay)
    }
    if(latestWeather.snow) {
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("snow_flights"), 1)
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("snow_delays"), kfr.departureDelay)
    }
    if(latestWeather.hail) {
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("hail_flights"), 1)
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("hail_delays"), kfr.departureDelay)
    }
    if(latestWeather.hail) {
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("thunder_flights"), 1)
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("thunder_delays"), kfr.departureDelay)
    }
    if(latestWeather.hail) {
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("tornado_flights"), 1)
      inc.addColumn(Bytes.toBytes("delay"), Bytes.toBytes("tornado_delays"), kfr.departureDelay)
    }
    weatherDelaysByRoute.increment(inc)
    return "Updated speed layer for flight from " + kfr.originName + " to " + kfr.destinationName
  }
  
  def main(args: Array[String]) {
    if (args.length < 1) {
      System.err.println(s"""
        |Usage: StreamFlights <brokers> 
        |  <brokers> is a list of one or more Kafka brokers
        | 
        """.stripMargin)
      System.exit(1)
    }
    
    val Array(brokers) = args

    // Create context with 2 second batch interval
    val sparkConf = new SparkConf().setAppName("StreamFlights")
    val ssc = new StreamingContext(sparkConf, Seconds(2))

    // Create direct kafka stream with brokers and topics
    val topicsSet = Set("flights")
    // Create direct kafka stream with brokers and topics
    val kafkaParams = Map[String, Object](
      "bootstrap.servers" -> brokers,
      "key.deserializer" -> classOf[StringDeserializer],
      "value.deserializer" -> classOf[StringDeserializer],
      "group.id" -> "use_a_separate_group_id_for_each_stream",
      "auto.offset.reset" -> "latest",
      "enable.auto.commit" -> (false: java.lang.Boolean)
    )
    val stream = KafkaUtils.createDirectStream[String, String](
      ssc, PreferConsistent,
      Subscribe[String, String](topicsSet, kafkaParams)
    )

    // Get the lines, split them into words, count the words and print
    val serializedRecords = stream.map(_.value);
    val kfrs = serializedRecords.map(rec => mapper.readValue(rec, classOf[KafkaFlightRecord]))

    // Update speed table    
    val processedFlights = kfrs.map(incrementDelaysByRoute)
    processedFlights.print()
    // Start the computation
    ssc.start()
    ssc.awaitTermination()
  }
}
