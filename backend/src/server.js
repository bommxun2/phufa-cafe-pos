const express = require("express");
const dotenv = require("dotenv");

dotenv.config({path: '.env'});

const app = express();
const port = process.env.PORT || 3000;

const orderRoutes = require("./routes/order.route");
const reportsRouter = require('./routes/report.route');
const employeesRouter = require('./routes/employee.route');

app.use(express.json());

app.use('/order', orderRoutes);
app.use('/reports', reportsRouter);
app.use('/employees', employeesRouter);

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

module.exports = app;