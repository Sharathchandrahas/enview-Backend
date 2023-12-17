Web APIs with Express.js:
The solution is implemented using the Express.js web framework in Node.js.
Two main APIs are provided:
POST /event: Used by the IoT device to send driving events to the server.
GET /alert/{alert_id}: Used to retrieve alerts based on the unique alert ID.

Background Processing and Alerts:
A background process runs every 5 minutes to evaluate the rule against the collected driving events.
If the rule is satisfied, an alert is generated and stored in a database with a unique ID.
The alert includes details such as timestamp, location type, the count of unsafe events, and associated vehicle ID.

MongoDB Integration for Location Thresholds:

    Location thresholds (the frequency of unsafe events for each location type) are stored in a MongoDB database as instructed in last rule of the task.
    The MongoDB model includes location, threshold, and unit of measurement.
    An additional API (POST /init/location-thresholds) is provided to initialize the location thresholds in the database.

TO INITIALISE RUN THESE COMMANDS IN CLI-
npm init
npm i
nodemon server.js
