const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/api-spec.json');

dotenv.config({path: '.env'});

const app = express();
const port = process.env.PORT || 3000;

const errorHandlerMiddleware = require('./middlewares/errorServer.middleware');
const errorNotFoundMiddleware = require('./middlewares/errorNotFound.middleware');

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/orders', require('./routes/order.route'));
app.use('/reports', require('./routes/report.route'));
app.use('/employees', require('./routes/employee.route'));
app.use('/customers', require('./routes/customer.route'));
app.use('/ingredients', require('./routes/ingredient.route'));
app.use('/menu', require('./routes/menu.route'));
app.use(
  '/ingredient-categories',
  require('./routes/ingredient-categories.route'),
);
app.use('/uploads', require('./routes/upload.route'));
app.use('/auth', require('./routes/auth.route'));

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend service is operational.',
    serviceName: 'PhufaCafeAPI',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorNotFoundMiddleware);
app.use(errorHandlerMiddleware);

app.listen(port, () => {
  console.log(`Backend service listening on port ${port}`);
});

module.exports = app;
