// Vercel serverless function entry point
// This wraps the Express app for Vercel's serverless environment

let app;

// Lazy load the Express app
function getApp() {
  if (!app) {
    try {
      // Try to load the Express app
      app = require('../server/api/index.js');
    } catch (error) {
      console.error('Error loading Express app:', error);
      throw error;
    }
  }
  return app;
}

// Export handler for Vercel
module.exports = async (req, res) => {
  try {
    const expressApp = getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

