import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.spark.streaming._
import org.apache.spark.streaming.kafka010.ConsumerStrategies.Subscribe
import org.apache.spark.streaming.kafka010.LocationStrategies.PreferConsistent
import org.apache.spark.SparkConf
import com.fasterxml.jackson.databind.{DeserializationFeature, ObjectMapper}
import com.fasterxml.jackson.module.scala.experimental.ScalaObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.hbase.TableName
import org.apache.hadoop.hbase.HBaseConfiguration
import org.apache.hadoop.hbase.client.ConnectionFactory
import org.apache.hadoop.hbase.client.Get
import org.apache.hadoop.hbase.client.Increment
import org.apache.hadoop.hbase.util.Bytes
import org.apache.spark.streaming.kafka010.KafkaUtils

object StreamTraffic {
  val mapper = new ObjectMapper()
  mapper.registerModule(DefaultScalaModule)
  val hbaseConf: Configuration = HBaseConfiguration.create()
  hbaseConf.set("hbase.zookeeper.property.clientPort", "2181")
  hbaseConf.set("hbase.zookeeper.quorum", "localhost")

  val hbaseConnection = ConnectionFactory.createConnection(hbaseConf)
  val ysonTraffic = hbaseConnection.getTable(TableName.valueOf("yson_traffic"))
  val yson_latest_traffic = hbaseConnection.getTable(TableName.valueOf("yson_latest_traffic"))

  def getLatestTraffic(segmentId: String) = {
    val result = yson_latest_traffic.get(new Get(Bytes.toBytes(segmentId)))
    if (result.isEmpty())
      None
    else
      Some(TrafficRecord(
        segmentId,
        Integer.valueOf(Bytes.toString(result.getValue(Bytes.toBytes("stats"), Bytes.toBytes("traffic_latest")))),
        Integer.valueOf(Bytes.toString(result.getValue(Bytes.toBytes("stats"), Bytes.toBytes("traffic_hour")))),
        Integer.valueOf(Bytes.toString(result.getValue(Bytes.toBytes("stats"), Bytes.toBytes("traffic_today"))))
      ))
  }

  // Function to increment HBase table for each new record received from Kafka
  def incrementTrafficByStreet(ktr: KafkaTrafficRecord) : String = {

    // Get current record
    val maybeLatestTraffic = getLatestTraffic(ktr.segmentId)
    if (maybeLatestTraffic.isEmpty)
      return "No data for street " + ktr.segmentId
    val latestTraffic = maybeLatestTraffic.get
    val inc = new Increment(Bytes.toBytes(ktr.segmentId))
    if (latestTraffic.traffic_latest > -2) {
      val diff = ktr.trafficSpeed - latestTraffic.traffic_latest;
      inc.addColumn(Bytes.toBytes("stats"), Bytes.toBytes("temp_latest"), diff)
    }

    yson_latest_traffic.increment(inc)
    return "Updated data for street " + ktr.segmentId
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

    // Create context with 5 minute batch interval
    val sparkConf = new SparkConf().setAppName("StreamFlights")
    val ssc = new StreamingContext(sparkConf, Seconds(2))

    // Create direct kafka stream with brokers and topics
    val topicsSet = Set("yson_traffic")
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

    // Get value from (key, value) for each Kafka message and convert to KafkaObsRecord
    val serializedRecords = stream.map(_.value);
    val kfrs = serializedRecords.map(rec => mapper.readValue(rec, classOf[KafkaTrafficRecord]))

    // Update speed table
    val processedNodeUpdate = kfrs.map(incrementTrafficByStreet)
    processedNodeUpdate.print()
    // Start the computation
    ssc.start()
    ssc.awaitTermination()
  }

}