const express = require("express");
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Routes
const reportsRouter = require('./routes/report.route');
const employeesRouter = require('./routes/employee.route');

app.use('/reports', reportsRouter);
app.use('/employees', employeesRouter);

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
