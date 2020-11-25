package yson.trafficKafka;

public class KafkaFlightRecord {
	public KafkaFlightRecord(String flight, String originName, String destinationName, int departureDelay) {
		super();
		this.flight = flight;
		this.originName = originName;
		this.destinationName = destinationName;
		this.departureDelay = departureDelay;
	}
	public String getFlight() {
		return flight;
	}
	public void setFlight(String flight) {
		this.flight = flight;
	}
	public String getOriginName() {
		return originName;
	}
	public void setOriginName(String originName) {
		this.originName = originName;
	}
	public String getDestinationName() {
		return destinationName;
	}
	public void setDestinationName(String destinationName) {
		this.destinationName = destinationName;
	}
	public int getDepartureDelay() {
		return departureDelay;
	}
	public void setDepartureDelay(int departureDelay) {
		this.departureDelay = departureDelay;
	}
	String flight;
	String originName;
	String destinationName;
	int departureDelay;
}
