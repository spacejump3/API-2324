const express = require('express');
const app = express();
const port = 3000;

const { Liquid } = require('liquidjs');
const engine = new Liquid();

engine
    .parseAndRender('{{name | capitalize}}', {name: 'alice'})
    .then(console.log);     // outputs 'Alice'

app.get('/', (req, res) => {
    res.send('Hello World!!!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
