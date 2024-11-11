// express-server.js
const express = require('express');
const path = require('path');

const expressApp = express();
let staticPath;

// Determine static path based on environment
if (process.env.IS_PACKAGED) {
  staticPath = path.join(process.resourcesPath, 'static');
} else {
  staticPath = path.join(__dirname, 'static');
}

expressApp.use('/static', express.static(staticPath));

expressApp.listen(3000, () => {
  console.log('Local server is running on http://localhost:3000');
});

module.exports = expressApp;