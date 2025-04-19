const express = require("express");
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
const reportsRouter = require('./routes/route.report');
const ordersRouter = require('./routes/route.order');

app.use('/reports', reportsRouter);
app.use('/employees', ordersRouter);

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
