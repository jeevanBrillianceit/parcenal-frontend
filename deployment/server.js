const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, './build')));
console.log('1 Static files served from:', path.join(__dirname, './build'));
console.log('2 Static files served from:', path.join(__dirname, '../build'));
console.log('3 Static files served from:', __dirname);
console.log('4 Static files served from:', path);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './build', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
