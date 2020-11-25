package yson.trafficKafka;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

class FleetArrivedResponse {
	static class FleetArrivedResult {
		static class Arrival {
			public Arrival() {}
			
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
			public Integer getActualdeparturetime() {
				return actualdeparturetime;
			}
			public void setActualdeparturetime(Integer actualdeparturetime) {
				this.actualdeparturetime = actualdeparturetime;
			}
			public Integer getActualarrivaltime() {
				return actualarrivaltime;
			}
			public void setActualarrivaltime(Integer actualarrivaltime) {
				this.actualarrivaltime = actualarrivaltime;
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
			private String ident;
			private String aircrafttype;
			private Integer actualdeparturetime;
			private Integer actualarrivaltime;
			private String origin;
			private String destination;
			private String originName;
			private String originCity;
			private String destinationName;
			private String destinationCity;
		}

		public Integer getNextOffset() {
			return nextOffset;
		}
		public void setNextOffset(Integer nextOffset) {
			this.nextOffset = nextOffset;
		}
		public Arrival[] getArrivals() {
			return arrivals;
		}
		public void setArrivals(Arrival[] arrivals) {
			this.arrivals = arrivals;
		}
		@JsonProperty("next_offset")
		private Integer nextOffset;
		@JsonProperty("arrivals")
		private Arrival[] arrivals;

	}
	public FleetArrivedResult getFleetArrivedResult() {
		return fleetArrivedResult;
	}
	public void setFleetArrivedResult(FleetArrivedResult fleetArrivedResult) {
		this.fleetArrivedResult = fleetArrivedResult;
	}
	@JsonProperty("FleetArrivedResult")
	private FleetArrivedResult fleetArrivedResult;
}
