const mqtt = require("mqtt");
const { MongoClient } = require("mongodb");

const MQTT_BROKER = "mqtt://broker.hivemq.com";
const MQTT_TOPIC = "greenhouse/data";

const MONGO_URI = "mongodb://127.0.0.1:27017";
const DB_NAME = "smart_greenhouse";

async function start() {
  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();

  const db = mongo.db(DB_NAME);
  const collection = db.collection("readings");

  const client = mqtt.connect(MQTT_BROKER);

  client.on("connect", () => {
    console.log("MQTT connected");
    client.subscribe(MQTT_TOPIC);
  });

  client.on("message", async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());

      const doc = {
        timestamp: new Date(),
        temperature: data.temperature,
        humidity: data.humidity,
        lux: data.lux,
        airppm: data.airppm,
        soil: data.soil,
        fan: data.fan,
        buzzer: data.buzzer
      };

      await collection.insertOne(doc);
      console.log("Saved to MongoDB:", doc);
    } catch (err) {
      console.error("Error:", err.message);
    }
  });
}

start();