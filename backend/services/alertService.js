const SensorData = require("../models/Sensor");
const { checkAndCreateAlerts } = require("../controllers/alertController");

// ✅ Watch only NEW inserted sensor data
// ❌ Does NOT create alerts from existing old data
const watchSensorDataInserts = () => {
  const changeStream = SensorData.watch([
    {
      $match: {
        operationType: "insert"
      }
    }
  ]);

  console.log("Watching sensor collection for new inserts...");

  changeStream.on("change", async (change) => {
    try {
      const newSensorData = change.fullDocument;

      console.log("New sensor data inserted:", newSensorData._id);

      const alerts = await checkAndCreateAlerts(newSensorData);

      if (alerts.length > 0) {
        console.log(`Created ${alerts.length} alerts for new sensor data`);
      } else {
        console.log("No alert needed for this sensor data");
      }
    } catch (error) {
      console.error("Error creating alerts from new sensor data:", error);
    }
  });

  changeStream.on("error", (error) => {
    console.error("Sensor change stream error:", error);
  });
};

module.exports = {
  watchSensorDataInserts
};