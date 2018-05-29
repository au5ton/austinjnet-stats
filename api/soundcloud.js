
const express = require('express');
var router = express.Router();
const fetch = require('node-fetch');

const soundcloud_client_id = process.env.SOUNDCLOUD_CLIENT_ID;

router.get('/', (req, res) => {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'methods':[
        '/likes'
    ]});
});

router.get('/likes', (request, response) => {
    response.set('Access-Control-Allow-Origin','*');
    console.log('GET /api/soundcloud/likes ', response.statusCode, request.query);
    var count = request.query.count;
    if(count === undefined) {
        count = 8;
    }

    fetch('https://api.soundcloud.com/users/44304060/favorites?client_id='+soundcloud_client_id)
    .then(res => res.json())
    .catch(err => console.log)
	.then(results => {
        response.json(generateSoundcloudLikes(results, count));
    })
    .catch(err => console.log);

});


const generateSoundcloudLikes = (data, count) => {

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
