const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(bodyParser.json({
    extended: false,
}));

const CONFIG = require('../config.js');

function respondWithIndex(req, res) {
    fs.readFile('static/index.html', 'utf8', (err, data) => {
        if (err) {
            throw err;
        }

        res.set('Content-Type', 'text/html');
        res.send(data);
    });
}

app.get('/', respondWithIndex);
app.get('/:guideKey/colors/:base/:secondary/:tertiary', respondWithIndex);

app.use('/static', express.static('static'));

app.listen(
    CONFIG.PORT,
    () => console.log(`Brandish running on :${CONFIG.PORT}`)
);

