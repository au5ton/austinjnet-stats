'use strict';

var express = require('express');
var router = express.Router();
var https = require('https');

const soundcloud_client_id = process.env.SOUNDCLOUD_CLIENT_ID;

router.get('/', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'methods':[
        '/likes'
    ]});
});

router.get('/likes', function(request, response){
    response.set('Access-Control-Allow-Origin','*');
    console.log('GET /api/soundcloud/likes ', response.statusCode, request.query);
    var count = request.query.count;
    if(count === undefined) {
        count = 8;
    }

    https.get('https://api.soundcloud.com/users/44304060/favorites?client_id='+soundcloud_client_id, function(res) {
        console.log('Got response: ' + res.statusCode);
        var response_body = '';
        res.on('data', function(chunk){
            response_body += chunk;
        });
        res.on('end', function(){
            response.json(generateSoundcloudLikes(JSON.parse(response_body), count));
        });

    }).on('error', function(e) {
        console.log('Got error: ' + e.message);
    });

});


function generateSoundcloudLikes(data, count) {

    //things to return: cover_art, permalink, song_title
    var arr = [];
    var limit;
    if(count > data.length) {
        limit = data.length;
    }
    else {
        limit = count;
    }
    for(var i = 0; i < limit; i++) {
        if(data[i]['artwork_url'] === null) {
            arr.push({
                cover_art: data[i]['user']['avatar_url'].replace('-large', '-t300x300'),
                permalink: data[i]['permalink_url'],
                song_title: data[i]['title'],
                song_artist: data[i]['user']['username']
            });
        }
        else {
            arr.push({
                cover_art: data[i]['artwork_url'].replace('-large', '-t300x300'),
                permalink: data[i]['permalink_url'],
                song_title: data[i]['title'],
                song_artist: data[i]['user']['username']
            });
        }
    }
    return arr;
}


module.exports = router;
