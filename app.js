'use strict';

var express = require('express');
var http = require('http');
var https = require('https');

var app = express();

var logger = require('au5ton-logger');

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

// Routes
var github = require('./api/github');
var soundcloud = require('./api/soundcloud');
var lastfm = require('./api/lastfm');
app.use('/api/github', github);
app.use('/api/soundcloud', soundcloud);
app.use('/api/lastfm', lastfm);

app.get('/', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'response':'Check out /api/'});
});

app.get('/api', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'services':[
        '/github',
        '/soundcloud',
        '/lastfm'
    ]});
});

var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});
