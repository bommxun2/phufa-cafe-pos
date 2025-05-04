const express = require("express");
const dotenv = require("dotenv");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/api-spec.json');

dotenv.config({path: '.env'});

const app = express();
const port = process.env.PORT || 3000;

const orderRoutes = require("./routes/order.route");
const reportsRouter = require('./routes/report.route');
const employeesRouter = require('./routes/employee.route');
const customerRouter = require('./routes/customer.route');
const menuRoutes = require("./routes/menu.route");

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/order', orderRoutes);
app.use('/reports', reportsRouter);
app.use('/employees', employeesRouter);
app.use('/customers', customerRouter);
app.use('/menu', menuRoutes);

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