const logError = (context, error, additionalData = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    ...additionalData,
  };
  
  console.error(JSON.stringify(errorLog, null, 2));
};

const logInfo = (context, message, additionalData = {}) => {
  const infoLog = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    context,
    message,
    ...additionalData,
  };
  
  console.log(JSON.stringify(infoLog, null, 2));
};

export { logError, logInfo };