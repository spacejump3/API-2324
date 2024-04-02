const express = require('express');
const app = express();
const port = 3000;
const ejs = require('ejs');

app.set('view-engine', 'ejs');

app.set('views', 'views');

app.get('/', (req, res) => {
  res.render('index.ejs', { title: 'home' });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// function renderTemplate (filename, data) {
//     ejs.renderFile(filename, data, {}, function (err, str){
//         return str;
//     });
// }