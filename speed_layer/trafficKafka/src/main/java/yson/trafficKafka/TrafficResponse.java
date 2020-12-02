
package yson.trafficKafka;

import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
        "segmentid",
        "street",
        "_direction",
        "_fromst",
        "_tost",
        "_length",
        "_strheading",
        "start_lon",
        "_lif_lat",
        "_lit_lon",
        "_lit_lat",
        "_traffic",
        "_last_updt"
})
public class TrafficResponse {

    @JsonProperty("segmentid")
    private String segmentid;
    @JsonProperty("street")
    private String street;
    @JsonProperty("_direction")
    private String direction;
    @JsonProperty("_fromst")
    private String fromst;
    @JsonProperty("_tost")
    private String tost;
    @JsonProperty("_length")
    private String length;
    @JsonProperty("_strheading")
    private String strheading;
    @JsonProperty("start_lon")
    private String startLon;
    @JsonProperty("_lif_lat")
    private String lifLat;
    @JsonProperty("_lit_lon")
    private String litLon;
    @JsonProperty("_lit_lat")
    private String litLat;
    @JsonProperty("_traffic")
    private String traffic;
    @JsonProperty("_last_updt")
    private String lastUpdt;
    @JsonIgnore
    private Map<String, Object> additionalProperties = new HashMap<String, Object>();

    public static int length() {
        return 1000;
    }
    @JsonProperty("segmentid")
    public String getSegmentid() {
        return segmentid;
    }
    @JsonProperty("segmentid")
    public void setSegmentid(String segmentid) {
        this.segmentid = segmentid;
    }
    @JsonProperty("street")
    public String getStreet() {
        return street;
    }
    @JsonProperty("street")
    public void setStreet(String street) {
        this.street = street;
    }
    @JsonProperty("_direction")
    public String getDirection() {
        return direction;
    }
    @JsonProperty("_direction")
    public void setDirection(String direction) {
        this.direction = direction;
    }
    @JsonProperty("_fromst")
    public String getFromst() {
        return fromst;
    }
    @JsonProperty("_fromst")
    public void setFromst(String fromst) {
        this.fromst = fromst;
    }
    @JsonProperty("_tost")
    public String getTost() {
        return tost;
    }
    @JsonProperty("_tost")
    public void setTost(String tost) {
        this.tost = tost;
    }
    @JsonProperty("_length")
    public String getLength() {
        return length;
    }
    @JsonProperty("_length")
    public void setLength(String length) {
        this.length = length;
    }
    @JsonProperty("_strheading")
    public String getStrheading() {
        return strheading;
    }
    @JsonProperty("_strheading")
    public void setStrheading(String strheading) {
        this.strheading = strheading;
    }
    @JsonProperty("start_lon")
    public String getStartLon() {
        return startLon;
    }
    @JsonProperty("start_lon")
    public void setStartLon(String startLon) {
        this.startLon = startLon;
    }
    @JsonProperty("_lif_lat")
    public String getLifLat() {
        return lifLat;
    }
    @JsonProperty("_lif_lat")
    public void setLifLat(String lifLat) {
        this.lifLat = lifLat;
    }
    @JsonProperty("_lit_lon")
    public String getLitLon() {
        return litLon;
    }
    @JsonProperty("_lit_lon")
    public void setLitLon(String litLon) {
        this.litLon = litLon;
    }
    @JsonProperty("_lit_lat")
    public String getLitLat() {
        return litLat;
    }
    @JsonProperty("_lit_lat")
    public void setLitLat(String litLat) {
        this.litLat = litLat;
    }
    @JsonProperty("_traffic")
    public String getTraffic() {
        return traffic;
    }
    @JsonProperty("_traffic")
    public void setTraffic(String traffic) {
        this.traffic = traffic;
    }
    @JsonProperty("_last_updt")
    public String getLastUpdt() {
        return lastUpdt;
    }
    @JsonProperty("_last_updt")
    public void setLastUpdt(String lastUpdt) {
        this.lastUpdt = lastUpdt;
    }
    @JsonAnyGetter
    public Map<String, Object> getAdditionalProperties() {
        return this.additionalProperties;
    }
    @JsonAnySetter
    public void setAdditionalProperty(String name, Object value) {
        this.additionalProperties.put(name, value);
    }

}