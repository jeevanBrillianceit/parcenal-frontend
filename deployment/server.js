const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Set the directory for static files to the current directory (dist folder)
const staticFilesDir = path.join(__dirname); 

// Check if build/index.html exists and log result (for debugging)
const indexPath = path.join(staticFilesDir, 'index.html'); // Index.html is now directly in the 'dist' folder
fs.access(indexPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.error('index.html NOT found at:', indexPath);
  } else {
    console.log('index.html found at:', indexPath);
  }
});

// Serve static files from the current directory (dist folder)
app.use(express.static(staticFilesDir)); 

app.get('*', (req, res) => {
  res.sendFile(path.join(staticFilesDir, 'index.html')); // Send index.html from the current directory
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});