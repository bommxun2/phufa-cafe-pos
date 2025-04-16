const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend service is operational.",
    serviceName: "PhufaCafeAPI",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Backend service listening on port ${port}`);
});
