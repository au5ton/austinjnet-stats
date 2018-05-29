
const express = require('express');
var router = express.Router();
const fetch = require('node-fetch')

const lastfm_api_key = process.env.LASTFM_API_KEY;

router.get('/', (req, res) => {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'methods':[
        '/recent'
    ]});
});

router.get('/recent', (request, response) => {
    response.set('Access-Control-Allow-Origin','*');
    console.log('GET /api/lastfm/recent ', response.statusCode, request.query);
    var count = request.query.count;
    if(count === undefined) {
        count = 8;
    }

    fetch('https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=au5ton&api_key='+lastfm_api_key+'&format=json&extended=1')
    .then(res => res.json())
    .catch(err => console.log)
	.then(results => {
        response.json(generateLastfmRecents(results, count));
    })
    .catch(err => console.log);

});

const generateLastfmRecents = (data, count) => {
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

const duplicateFound = (arr,url) => {
    for(let i = 0; i < arr.length; i++) {
        if(arr[i]['permalink'] === url) {
            return true;
        }
    }
    return false;
}


module.exports = router;
