import scala.reflect.runtime.universe._


case class KafkaFlightRecord(
    flight: String,
    originName: String, 
    destinationName: String, 
    departureDelay:Long)