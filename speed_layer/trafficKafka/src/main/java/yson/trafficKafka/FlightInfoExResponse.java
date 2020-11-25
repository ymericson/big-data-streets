package yson.trafficKafka;

import java.util.Arrays;

import com.fasterxml.jackson.annotation.JsonProperty;

public class FlightInfoExResponse {
	static class FlightInfoExResult {
		static class Flight {
			public String getFaFlightID() {
				return faFlightID;
			}
			public void setFaFlightID(String faFlightID) {
				this.faFlightID = faFlightID;
			}
			public String getIdent() {
				return ident;
			}
			public void setIdent(String ident) {
				this.ident = ident;
			}
			public String getAircrafttype() {
				return aircrafttype;
			}
			public void setAircrafttype(String aircrafttype) {
				this.aircrafttype = aircrafttype;
			}
			public String getFiledEte() {
				return filedEte;
			}
			public void setFiledEte(String filedEte) {
				this.filedEte = filedEte;
			}
			public Integer getFiledTime() {
				return filedTime;
			}
			public void setFiledTime(Integer filedTime) {
				this.filedTime = filedTime;
			}
			public Integer getFiledDeparturetime() {
				return filedDeparturetime;
			}
			public void setFiledDeparturetime(Integer filedDeparturetime) {
				this.filedDeparturetime = filedDeparturetime;
			}
			public Integer getFiledAirspeedKts() {
				return filedAirspeedKts;
			}
			public void setFiledAirspeedKts(Integer filedAirspeedKts) {
				this.filedAirspeedKts = filedAirspeedKts;
			}
			public String getFiledAirspeedMach() {
				return filedAirspeedMach;
			}
			public void setFiledAirspeedMach(String filedAirspeedMach) {
				this.filedAirspeedMach = filedAirspeedMach;
			}
			public Integer getFiledAltitude() {
				return filedAltitude;
			}
			public void setFiledAltitude(Integer filedAltitude) {
				this.filedAltitude = filedAltitude;
			}
			public String getRoute() {
				return route;
			}
			public void setRoute(String route) {
				this.route = route;
			}
			public Integer getActualdeparturetime() {
				return actualdeparturetime;
			}
			public void setActualdeparturetime(Integer actualdeparturetime) {
				this.actualdeparturetime = actualdeparturetime;
			}
			public Integer getEstimatedarrivaltime() {
				return estimatedarrivaltime;
			}
			public void setEstimatedarrivaltime(Integer estimatedarrivaltime) {
				this.estimatedarrivaltime = estimatedarrivaltime;
			}
			public Integer getActualarrivaltime() {
				return actualarrivaltime;
			}
			public void setActualarrivaltime(Integer actualarrivaltime) {
				this.actualarrivaltime = actualarrivaltime;
			}
			public String getDiverted() {
				return diverted;
			}
			public void setDiverted(String diverted) {
				this.diverted = diverted;
			}
			public String getOrigin() {
				return origin;
			}
			public void setOrigin(String origin) {
				this.origin = origin;
			}
			public String getDestination() {
				return destination;
			}
			public void setDestination(String destination) {
				this.destination = destination;
			}
			public String getOriginName() {
				return originName;
			}
			public void setOriginName(String originName) {
				this.originName = originName;
			}
			public String getOriginCity() {
				return originCity;
			}
			public void setOriginCity(String originCity) {
				this.originCity = originCity;
			}
			public String getDestinationName() {
				return destinationName;
			}
			public void setDestinationName(String destinationName) {
				this.destinationName = destinationName;
			}
			public String getDestinationCity() {
				return destinationCity;
			}
			public void setDestinationCity(String destinationCity) {
				this.destinationCity = destinationCity;
			}
			@Override
			public String toString() {
				return "Flight [faFlightID=" + faFlightID + ", ident=" + ident + ", aircrafttype=" + aircrafttype
						+ ", filedEte=" + filedEte + ", filedTime=" + filedTime + ", filedDeparturetime="
						+ filedDeparturetime + ", filedAirspeedKts=" + filedAirspeedKts + ", filedAirspeedMach="
						+ filedAirspeedMach + ", filedAltitude=" + filedAltitude + ", route=" + route
						+ ", actualdeparturetime=" + actualdeparturetime + ", estimatedarrivaltime="
						+ estimatedarrivaltime + ", actualarrivaltime=" + actualarrivaltime + ", diverted=" + diverted
						+ ", origin=" + origin + ", destination=" + destination + ", originName=" + originName
						+ ", originCity=" + originCity + ", destinationName=" + destinationName + ", destinationCity="
						+ destinationCity + "]";
			}
			@JsonProperty("faFlightID")
			private String faFlightID;
			@JsonProperty("ident")
			private String ident;
			@JsonProperty("aircrafttype")
			private String aircrafttype;
			@JsonProperty("filed_ete")
			private String filedEte;
			@JsonProperty("filed_time")
			private Integer filedTime;
			@JsonProperty("filed_departuretime")
			private Integer filedDeparturetime;
			@JsonProperty("filed_airspeed_kts")
			private Integer filedAirspeedKts;
			@JsonProperty("filed_airspeed_mach")
			private String filedAirspeedMach;
			@JsonProperty("filed_altitude")
			private Integer filedAltitude;
			@JsonProperty("route")
			private String route;
			@JsonProperty("actualdeparturetime")
			private Integer actualdeparturetime;
			@JsonProperty("estimatedarrivaltime")
			private Integer estimatedarrivaltime;
			@JsonProperty("actualarrivaltime")
			private Integer actualarrivaltime;
			@JsonProperty("diverted")
			private String diverted;
			@JsonProperty("origin")
			private String origin;
			@JsonProperty("destination")
			private String destination;
			@JsonProperty("originName")
			private String originName;
			@JsonProperty("originCity")
			private String originCity;
			@JsonProperty("destinationName")
			private String destinationName;
			@JsonProperty("destinationCity")
			private String destinationCity;			
		}
		
		@Override
		public String toString() {
			return "FlightInfoExResult [nextOffset=" + nextOffset + ", flights=" + Arrays.toString(flights) + "]";
		}
		public Integer getNextOffset() {
			return nextOffset;
		}
		public void setNextOffset(Integer nextOffset) {
			this.nextOffset = nextOffset;
		}
		public Flight[] getFlights() {
			return flights;
		}
		public void setFlights(Flight[] flights) {
			this.flights = flights;
		}
		@JsonProperty("next_offset")
		private Integer nextOffset;
		@JsonProperty("flights")
		private Flight[] flights;		
	}
	public FlightInfoExResult getFlightInfoExResult() {
		return FlightInfoExResult;
	}
	public void setFlightInfoExResult(FlightInfoExResult flightInfoExResult) {
		FlightInfoExResult = flightInfoExResult;
	}
	@Override
	public String toString() {
		return "FlightInfoExResponse [FlightInfoExResult=" + FlightInfoExResult + "]";
	}
	@JsonProperty("FlightInfoExResult")
	private FlightInfoExResult FlightInfoExResult;
}
