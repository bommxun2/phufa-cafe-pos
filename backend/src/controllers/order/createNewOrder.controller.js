module.exports = (request, response, next) => {
  return response.status(200).json({
    status: "ok",
    message: "CreateNew is operational.",
    serviceName: "PhufaCafeAPI",
    timestamp: new Date().toISOString(),
  });
};
