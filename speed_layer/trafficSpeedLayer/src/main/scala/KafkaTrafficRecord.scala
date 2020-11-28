import scala.reflect.runtime.universe._


case class KafkaTrafficRecord(
    timestamp: String,
    segmentId: String,
    streetName: String,
    fromStreet: String,
    toStreet: String,
    trafficSpeed: Int
)