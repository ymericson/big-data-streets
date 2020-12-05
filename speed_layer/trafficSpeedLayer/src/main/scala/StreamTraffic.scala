import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.apache.hadoop.conf.Configuration
import org.apache.hadoop.hbase.{HBaseConfiguration, TableName}
import org.apache.hadoop.hbase.client.{ConnectionFactory, Get, Increment}
import org.apache.hadoop.hbase.util.Bytes
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.spark.SparkConf
import org.apache.spark.streaming._
import org.apache.spark.streaming.kafka010.ConsumerStrategies.Subscribe
import org.apache.spark.streaming.kafka010.KafkaUtils
import org.apache.spark.streaming.kafka010.LocationStrategies.PreferConsistent
import org.apache.hadoop.hbase.client.Put

object StreamTraffic {
  val mapper = new ObjectMapper()
  mapper.registerModule(DefaultScalaModule)
  val hbaseConf: Configuration = HBaseConfiguration.create()
  hbaseConf.set("hbase.zookeeper.property.clientPort", "2181")
  hbaseConf.set("hbase.zookeeper.quorum", "localhost")



  val hbaseConnection = ConnectionFactory.createConnection(hbaseConf)
  val StreetBySeg = hbaseConnection.getTable(TableName.valueOf("yson_street_by_seg"))
//  val LatestTraffic = hbaseConnection.getTable(TableName.valueOf("yson_latest_traffic"))

//  def getPreviousTraffic(street_segment_id: String) = {
//      val result = StreetBySeg.get(new Get(Bytes.toBytes(street_segment_id)))
//      if (result.isEmpty())
//        None
//      else
//        Some(TrafficRecord(
//          street_segment_id,
//          Integer.valueOf(Bytes.toString(result.getValue(Bytes.toBytes("stats"), Bytes.toBytes("speed_now"))))
//        ))
//  }
//  // Function to increment HBase table for each new record received from Kafka
//  def incrementTrafficByStreet(ktr: KafkaTrafficRecord) : String = {
//    // Get current record
//    val TrafficRecordResponse = getPreviousTraffic(ktr.StrHeading + " " + ktr.street + ktr.segmentId)
//    if (TrafficRecordResponse.isEmpty)
//      return "No data for street segment" + ktr.segmentId
//    val TrafficRecord = TrafficRecordResponse.get
//
//    // Build put call
//    val inc = new Increment(Bytes.toBytes(ktr.StrHeading + " " + ktr.street + ktr.segmentId))
//    if (ktr.speed > -2) {
//      val diff = ktr.speed - TrafficRecord.speed_now;
//      inc.addColumn(Bytes.toBytes("stats"), Bytes.toBytes("speed_now"), diff)
//    }
//
//    StreetBySeg.increment(inc)
//    return "Updated data for street " + ktr.segmentId
//  }

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

    val sparkConf = new SparkConf().setAppName("StreamTraffic")
    sparkConf.set("spark.streaming.kafka.maxRatePerPartition", "50000")
    val ssc = new StreamingContext(sparkConf, Seconds(30))

    val topicsSet = Set("yson_traffic_2")
    val kafkaParams = Map[String, Object](
      "bootstrap.servers" -> brokers,
      "key.deserializer" -> classOf[StringDeserializer],
      "value.deserializer" -> classOf[StringDeserializer],
      "group.id" -> "use_a_separate_group_id_for_each_stream",
      "auto.offset.reset" -> "latest",
      "enable.auto.commit" -> (false: java.lang.Boolean),
    )
    val stream = KafkaUtils.createDirectStream[String, String](
      ssc, PreferConsistent,
      Subscribe[String, String](topicsSet, kafkaParams)
    )

    // Get the lines, split them into words, count the words and print
    val serializedRecords = stream.map(_.value);
    val ktr = serializedRecords.map(rec => mapper.readValue(rec, classOf[KafkaTrafficRecord]))

    // write to an HBase table
    val batchStats = ktr.map(tr => {
      println(tr.strHeading + " " + tr.street + tr.segmentId + " : " + tr.speed)
      if (tr.speed > 0) { // value of -1 means no estimate is available
        val put = new Put(Bytes.toBytes(tr.strHeading + " " + tr.street + tr.segmentId))
        put.addColumn(Bytes.toBytes("stats"), Bytes.toBytes("speed_now"), Bytes.toBytes(tr.speed))
        StreetBySeg.put(put)
      }
    })
    batchStats.print()

    ssc.start()
    ssc.awaitTermination()
  }

}