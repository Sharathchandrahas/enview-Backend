const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");

const app = express();
const port = 3000;
uuidv4();
//connection to database
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(
    "mongodb+srv://sharathchandrahasreddy:2002@cluster0.mzf18w7.mongodb.net/?retryWrites=true&w=majority"
  );
}
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to the MongoDB database");
});
// In-memory storage for events and alerts
const events = [];
const alerts = [];
let alertIdCounter = 1;

// Rule configuration
const locationThresholdsSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    unique: true,
  },
  threshold: {
    type: Number,
    required: true,
  },
});

// Create a model using the schema
const LocationThreshold = mongoose.model(
  "LocationThreshold",
  locationThresholdsSchema
);

// In-memory storage for events and alerts
app.post("/init/location-thresholds", async (req, res) => {
  const initialThresholds = [
    { location: "highway", threshold: 4, unit: "events" },
    { location: "city_center", threshold: 3, unit: "events" },
    { location: "commercial", threshold: 2, unit: "events" },
    { location: "residential", threshold: 1, unit: "events" },
  ];

  try {
    await LocationThreshold.create(initialThresholds);
    res
      .status(201)
      .json({ message: "Location thresholds initialized successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error initializing location thresholds",
      error: error.message,
    });
  }
});

app.use(bodyParser.json());

// Endpoint to receive driving events
app.post("/event", (req, res) => {
  const data = req.body;
  events.push(data);
  res.status(201).json({ message: "Event received successfully" });
});

// Endpoint to retrieve alerts
app.get("/alert/:alertId", (req, res) => {
  const alertId = parseInt(req.params.alertId);
  const alert = alerts.find((a) => a.alertId === alertId);

  if (alert) {
    res.json(alert);
  } else {
    res.status(404).json({ message: "Alert not found" });
  }
});

// Function to run the rule
async function runRule() {
  const currentTime = new Date();

  // Fetch location thresholds from MongoDB
  const locationThresholds = await LocationThreshold.find();

  // Filter events in the past 5 minutes
  const recentEvents = events.filter(
    (event) => currentTime - new Date(event.timestamp) < 5 * 60 * 1000
  );

  // Check if an alert has already been generated in the past 5 minutes
  const lastAlertTime = Math.max(
    ...alerts.map((alert) => new Date(alert.timestamp).getTime()),
    0
  );

  if (currentTime - lastAlertTime < 5 * 60 * 1000) {
    return;
  }

  // Run the rule for each location type
  for (const { location, threshold } of locationThresholds) {
    // Run the rule for each vehicle
    const vehicles = Array.from(
      new Set(recentEvents.map((event) => event.vehicle_id))
    );

    for (const vehicleId of vehicles) {
      const unsafeEvents = recentEvents.filter(
        (event) =>
          !event.is_driving_safe &&
          event.location_type === location &&
          event.vehicle_id === vehicleId
      );

      if (unsafeEvents.length >= threshold) {
        // Generate an alert
        const alert = {
          alertId: alertIdCounter++,
          timestamp: currentTime.toISOString(),
          locationType: location,
          eventCount: unsafeEvents.length,
          vehicleId,
          events: unsafeEvents,
        };

        alerts.push(alert);
      }
    }
  }
}
// Background interval to run the rule every 5 minutes
setInterval(runRule, 5 * 60 * 1000);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
