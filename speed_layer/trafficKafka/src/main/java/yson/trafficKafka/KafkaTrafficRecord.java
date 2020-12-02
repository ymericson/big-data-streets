package yson.trafficKafka;

public class KafkaTrafficRecord {
	public KafkaTrafficRecord(String segmentId, String StrHeading, String street, int speed) {
		super();
		this.segmentId = segmentId;
		this.StrHeading = StrHeading;
		this.street = street;
		this.speed = speed;
	}
	public String getSegmentId() {
		return segmentId;
	}
	public void setSegmentId(String segmentId) {
		this.segmentId = segmentId;
	}
	public String getStrHeading() {
		return StrHeading;
	}
	public void setStrHeading(String StrHeading) {
		this.StrHeading = StrHeading;
	}
	public String getStreet() {
		return street;
	}
	public void setStreet(String street) {
		this.street = street;
	}
	public int getSpeed() {
		return speed;
	}
	public void setSpeed(int speed) {
		this.speed = speed;
	}
	String segmentId;
	String StrHeading;
	String street;
	int speed;
}
