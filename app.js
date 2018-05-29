
const express = require('express');
const logger = require('au5ton-logger');

// Routes
const github = require('./api/github');
const soundcloud = require('./api/soundcloud');
const lastfm = require('./api/lastfm');

var app = express();

app.use('/api/github', github);
app.use('/api/soundcloud', soundcloud);
app.use('/api/lastfm', lastfm);

app.get('/', (req, res) => {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'response':'Check out /api/'});
});

app.get('/api', (req, res) => {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'services':[
        '/github',
        '/soundcloud',
        '/lastfm'
    ]});
});

var server = app.listen(process.env.PORT || 3000, () => {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});

const isEmptyObject = (obj) => {
    return !Object.keys(obj).length;
}