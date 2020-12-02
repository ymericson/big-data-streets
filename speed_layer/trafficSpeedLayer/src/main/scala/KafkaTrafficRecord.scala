import scala.reflect.runtime.universe._

case class KafkaTrafficRecord(
                               segmentId: String,
                               strHeading: String,
                               street: String,
                               speed: Int
)