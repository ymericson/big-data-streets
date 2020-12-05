package yson.trafficKafka;

import java.util.Properties;
import java.util.Timer;
import java.util.TimerTask;
import java.sql.Timestamp;

import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.Invocation;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.glassfish.jersey.jackson.JacksonFeature;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;


public class TrafficUpdate {
	static class Task extends TimerTask {
		private Client client;
		public TrafficResponse[] getTrafficResponse() {
			Invocation.Builder bldr
					= client.target("https://data.cityofchicago.org/resource/n4j6-wkkf.json?$limit=10000")
					.request("application/json");
			try {
				return bldr.get(TrafficResponse[].class);
			} catch (Exception e) {
				System.err.println(e.getMessage());
			}
			return null;
		}

		// Send API updates to the "yson_traffic" topic
		Properties props = new Properties();
		String TOPIC = "yson_traffic_2";
		KafkaProducer<String, String> producer;

		public Task() {
			client = ClientBuilder.newClient();
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
			TrafficResponse[] response = getTrafficResponse();
			if(response == null)
				return;
			ObjectMapper mapper = new ObjectMapper();
			// Process API response
			for (TrafficResponse tr : response) {
				ProducerRecord<String, String> data;
				try {
					KafkaTrafficRecord ktr = new KafkaTrafficRecord(
							tr.getSegmentid(),
							tr.getStrheading(),
							tr.getStreet(),
							Integer.parseInt(tr.getTraffic()));
					data = new ProducerRecord<String, String> (
							TOPIC,
							mapper.writeValueAsString(ktr));
					producer.send(data);
				} catch (JsonProcessingException e) {
					// System.err.println(e.getMessage());
					e.printStackTrace();
				}
			}
		}
	}

	static String bootstrapServers = new String("localhost:9092");

	public static void main(String[] args) {
		if(args.length > 0)  // run on the cluster with a different kafka
			bootstrapServers = args[0];
		Timer timer = new Timer();
		timer.scheduleAtFixedRate(new Task(), 0, 60*1000);
	}
}
