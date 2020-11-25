package yson.trafficKafka;
import java.net.Authenticator;
import java.net.InetAddress;
import java.net.PasswordAuthentication;
import java.util.Properties;
import java.util.Timer;
import java.util.TimerTask;
import java.util.Random;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Invocation;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.glassfish.jersey.jackson.JacksonFeature;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import yson.trafficKafka.FleetArrivedResponse.FleetArrivedResult.Arrival;
import yson.trafficKafka.FlightInfoExResponse.FlightInfoExResult.Flight;

// Inspired by http://stackoverflow.com/questions/14458450/what-to-use-instead-of-org-jboss-resteasy-client-clientrequest
public class FleetArrivals {
	static class Task extends TimerTask {
		private Client client;
		Random generator = new Random();
		// We are just going to get a random sampling of flights from a few airlines
		// Getting all flights would be much more expensive!
		String[] airlines = new String[] { "DAL", "AAL", "SWA", "UAL" };

		public FleetArrivedResponse getFleetArrivedResponse() {
			Invocation.Builder bldr
			  = client.target("http://flightxml.flightaware.com/json/FlightXML2/FleetArrived?fleet="
					          + airlines[generator.nextInt(airlines.length)]
					          + "&howMany=3&offset=0").request("application/json");
			try {
				return bldr.get(FleetArrivedResponse.class);
			} catch (Exception e) {
				System.err.println(e.getMessage());
			}
			return null;  // Sometimes the web service fails due to network problems. Just let it try again
		}

		public FlightInfoExResponse getFlightInfoExResponse(String ident, int departureTime) {
			String uri= String.format("http://flightxml.flightaware.com/json/FlightXML2/FlightInfoEx?ident=%s@%d&howMany=1&offset=0", ident, departureTime);
			Invocation.Builder bldr = client.target(uri).request("application/json");
			return bldr.get(FlightInfoExResponse.class);

		}

		// Adapted from http://hortonworks.com/hadoop-tutorial/simulating-transporting-realtime-events-stream-apache-kafka/
		Properties props = new Properties();
		String TOPIC = "flights";
		KafkaProducer<String, String> producer;
		
		public Task() {
			client = ClientBuilder.newClient();
			// enable POJO mapping using Jackson - see
			// https://jersey.java.net/documentation/latest/user-guide.html#json.jackson
			client.register(JacksonFeature.class); 
			props.put("bootstrap.servers", bootstrapServers);
			props.put("acks", "all");
			props.put("retries", 0);
			props.put("batch.size", 16384);
			props.put("linger.ms", 1);
			props.put("buffer.memory", 33554432);
			props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
			props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

			producer = new KafkaProducer<>(props);
		}

		@Override
		public void run() {
			FleetArrivedResponse response = getFleetArrivedResponse();
			if(response == null || response.getFleetArrivedResult() == null)
				return;
			ObjectMapper mapper = new ObjectMapper();

			for(Arrival arrival : response.getFleetArrivedResult().getArrivals()) {
				ProducerRecord<String, String> data;
				try {
					Flight f
					  = getFlightInfoExResponse(arrival.getIdent(), arrival.getActualdeparturetime()).getFlightInfoExResult().getFlights()[0];
					KafkaFlightRecord kfr = new KafkaFlightRecord(
							f.getIdent(),
							f.getOrigin().substring(1), 
							f.getDestination().substring(1), 
							(f.getActualdeparturetime() - f.getFiledDeparturetime())/60);
					data = new ProducerRecord<String, String>
					(TOPIC, 
					 mapper.writeValueAsString(kfr));
					producer.send(data);
				} catch (JsonProcessingException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}

	}
	public static class CustomAuthenticator extends Authenticator {

		// Called when password authorization is needed
		protected PasswordAuthentication getPasswordAuthentication() {

			// Get information about the request
			String prompt = getRequestingPrompt();
			String hostname = getRequestingHost();
			InetAddress ipaddr = getRequestingSite();
			int port = getRequestingPort();

			String username = "Put Your Username here"; // TODO
			String password = "Put your password here"; // TODO

			// Return the information (a data holder that is used by Authenticator)
			return new PasswordAuthentication(username, password.toCharArray());

		}

	}

	static String bootstrapServers = new String("localhost:9092");

	public static void main(String[] args) {
		if(args.length > 0)  // This lets us run on the cluster with a different kafka
			bootstrapServers = args[0];
		Authenticator.setDefault(new CustomAuthenticator());
		Timer timer = new Timer();
		timer.scheduleAtFixedRate(new Task(), 0, 60*1000);
	}
}

