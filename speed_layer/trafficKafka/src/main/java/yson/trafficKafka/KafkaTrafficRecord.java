package yson.trafficKafka;

public class KafkaTrafficRecord {
	public KafkaTrafficRecord(String timestamp, String segmentId, String streetName,
							  String fromStreet, String toStreet, int trafficSpeed) {
		super();
		this.timestamp = timestamp;
		this.segmentId = segmentId;
		this.streetName = streetName;
		this.fromStreet = fromStreet;
		this.toStreet = toStreet;
		this.trafficSpeed = trafficSpeed;
	}
	public String getTimestamp() {
		return timestamp;
	}
	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}
	public String getSegmentId() {
		return segmentId;
	}
	public void setSegmentId(String segmentId) {
		this.segmentId = segmentId;
	}
	public String getStreetName() {
		return streetName;
	}
	public void setStreetName(String streetName) {
		this.streetName = streetName;
	}
	public String getFromStreet() {
		return fromStreet;
	}
	public void setFromStreet(String fromStreet) {
		this.fromStreet = fromStreet;
	}
	public String getToStreet() {
		return toStreet;
	}
	public void setToStreet(String toStreet) {
		this.toStreet = toStreet;
	}
	public int getTrafficSpeed() {
		return trafficSpeed;
	}
	public void setTrafficSpeed(int trafficSpeed) {
		this.trafficSpeed = trafficSpeed;
	}
	String timestamp;
	String segmentId;
	String streetName;
	String fromStreet;
	String toStreet;
	int trafficSpeed;
}
