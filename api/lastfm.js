'use strict';

var express = require('express');
var router = express.Router();
var https = require('https');

const lastfm_api_key = process.env.LASTFM_API_KEY;

router.get('/', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'methods':[
        '/recent'
    ]});
});

router.get('/recent', function(request, response){
    response.set('Access-Control-Allow-Origin','*');
    console.log('GET /api/lastfm/recent ', response.statusCode, request.query);
    var count = request.query.count;
    if(count === undefined) {
        count = 8;
    }

    https.get('https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=au5ton&api_key='+lastfm_api_key+'&format=json&extended=1', function(res) {
        console.log('Got response: ' + res.statusCode);
        var response_body = '';
        res.on('data', function(chunk){
            response_body += chunk;
        });
        res.on('end', function(){
            //logger.log(JSON.parse(response_body));
            response.json(generateLastfmRecents(JSON.parse(response_body), count));
        });

    }).on('error', function(e) {
        console.log('Got error: ' + e.message);
    });

});

function generateLastfmRecents(data, count) {
    //things to return: cover_art, permalink, song_title, song_artist
    var arr = [];
    if(count > data['recenttracks']['track'].length) {
        count = data['recenttracks']['track'].length;
    }
    for(let i = 0; i < data['recenttracks']['track'].length; i++) {

        /*
        song is clear for showing on website:
        if the song has album art, show the artists image. if the artist doesn't have an image, song is not clear. if it's not already in the array.
        */
        var track = data['recenttracks']['track'][i];

        if(arr.length < count) {
            //if the largest image size for the track is there
            if(track['image'][track['image'].length-1]['#text'] !== '') {
                if(duplicateFound(arr,track['url']) === false) {
                    arr.push({
                        cover_art: track['image'][track['image'].length-1]['#text'],
                        permalink: track['url'],
                        song_title: track['name'],
                        song_artist: track['artist']['name']
                    });
                    //logger.success('Added: ', track['name']);
                }
                else {
                    //unfortunately, we don't want duplicate songs. that looks silly!
                    //logger.error('Skipped (duplicate): ', track['name']);
                    continue;
                }
            } //if the largest image size for the artist is there
            else if(track['artist']['image'][track['artist']['image'].length-1]['#text'] !== ''){
                if(duplicateFound(arr,track['url']) === false) {
                    arr.push({
                        cover_art: track['artist']['image'][track['artist']['image'].length-1]['#text'],
                        permalink: track['url'],
                        song_title: track['name'],
                        song_artist: track['artist']['name']
                    });
                    //logger.success('Added: ', track['name']);
                }
                else {
                    //unfortunately, we don't want duplicate songs. that looks silly!
                    //logger.error('Skipped (duplicate): ', track['name']);
                    continue;
                }
            }
            else {
                //unfortunately, skip the song. we want pretty pictures!
                //A song couldn't be added, so we want to iterate over something else
                //logger.error('Skipped (no_media): ', track['name']);
                continue;
            }
        }
        else {
            //gotta break, we have exactly the amount we need
            //logger.warn('Broken loop (arr.length: ', arr.length, ', count: ', count, ')');
            break;
        }
    }
    return arr;
}

function duplicateFound(arr,url) {
    for(let i = 0; i < arr.length; i++) {
        if(arr[i]['permalink'] === url) {
            return true;
        }
    }
    return false;
}


module.exports = router;
