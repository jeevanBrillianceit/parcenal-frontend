const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Check if build/index.html exists and log result
const indexPath = path.join(__dirname, '../build/index.html');
fs.access(indexPath, fs.constants.F_OK, (err) => {
  if (err) {
    console.error('index.html NOT found at:', indexPath);
  } else {
    console.log('index.html found at:', indexPath);
  }
});

app.use(express.static(path.join(__dirname, '../build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});