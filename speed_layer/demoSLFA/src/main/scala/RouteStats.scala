

case class RouteStats(
    originName: String,
    destinationName: String,
    clear_flights: Long = 0,
    clear_delays: Long = 0,
    fog_flights: Long = 0,
    fog_delays: Long = 0,
    rain_flights: Long = 0,
    rain_delays: Long = 0,
    snow_flights: Long = 0,
    snow_delays: Long = 0,
    hail_flights: Long = 0,
    hail_delays: Long = 0,
    thunder_flights: Long = 0,
    thunder_delays: Long = 0,
    tornado_flights: Long = 0,
    tornado_delays: Long = 0)
  