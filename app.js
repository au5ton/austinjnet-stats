'use strict';

var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var github = require('octonode');
var app = express();

var logger = require('au5ton-logger');

const access_token = process.env.GITHUB_TOKEN; //Your personal access token (github)
const soundcloud_client_id = process.env.SOUNDCLOUD_CLIENT_ID;
const lastfm_api_key = process.env.LASTFM_API_KEY;

var client = github.client(access_token);
var github_colors = {};

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

app.get('/', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'response':'Check out /api/'});
});

app.get('/api', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'response':[
        '/api/github',
        '/api/soundcloud',
        '/api/lastfm'
    ]});
});

app.get('/api/github', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'response':[
        '/api/github/popular',
        '/api/github/languages'
    ]});
});

app.get('/api/soundcloud', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'response':[
        '/api/soundcloud/likes'
    ]});
});

app.get('/api/lastfm', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'response':[
        '/api/lastfm/recent'
    ]});
});

var mostPopularRepos = [];

app.get('/api/github/popular', function(req, res) {
    res.set('Access-Control-Allow-Origin','*');
    var count = req.query.count;
    var max_repos = req.query.max_repos;
    var verbose = req.query.verbose;
    console.log('GET /api/github/popular ', res.statusCode, req.query);
    if(count === undefined) {
        count = 100;
    }
    else {
        count = JSON.parse(count);
    }
    if(max_repos === undefined) {
        max_repos = 500;
    }
    else {
        max_repos = JSON.parse(max_repos);
    }
    if(verbose === undefined) {
        verbose = false;
    }
    else {
        verbose = JSON.parse(verbose);
    }
    client.me().repos(1, max_repos, function(err, repos) {
        if(err) throw err;

        if(count > repos.length) {
            count = repos.length;
        }

        repos.sort(sortReposByStargazers);
        repos.reverse();

        for(var i = 0; i < count; i++) {
            //console.log(i, repos[i].stargazers_count, repos[i].full_name, new Date(repos[i].updated_at).getFullYear());
            if(verbose === true) {
                mostPopularRepos.push(repos[i]);
            }
            else {
                mostPopularRepos.push({
                    full_name: repos[i].full_name,
                    description: repos[i].description,
                    html_url: repos[i].html_url,
                    updated_at: repos[i].updated_at,
                    stargazers_count: repos[i].stargazers_count,
                    fork: repos[i].fork
                });
            }
        }

        res.json(mostPopularRepos);
        mostPopularRepos = [];

    });
});

var mostUsedLanguages = [];
var languageToll = {};

app.get('/api/github/languages', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    var count = req.query.count;
    var max_repos = req.query.max_repos;
    var truncate = req.query.exclude_languages;
    var include_null = req.query.include_null;
    var include_colors = req.query.include_colors;
    console.log('GET /api/github/languages ', res.statusCode, req.query);
    if(count === undefined) {
        count = 100;
    }
    else {
        count = JSON.parse(count);
    }
    if(max_repos === undefined) {
        max_repos = 500;
    }
    else {
        max_repos = JSON.parse(max_repos);
    }
    if(include_null === undefined) {
        include_null = false;
    }
    else {
        include_null = (include_null.toLowerCase() === 'true');
    }
    if(include_colors === undefined) {
        include_colors = false;
    }
    else {
        include_colors = (include_colors.toLowerCase() === 'true');
    }
    if(truncate !== undefined && typeof truncate === 'string') {
        if(truncate.charAt(truncate.length-1) === '*') {
            truncate = truncate.substring(0,truncate.length-1);
        }
        truncate = truncate.split('*');
    }
    if(truncate === undefined && include_null === false) {
        truncate = ['null'];
    }
    client.me().repos(1, max_repos, function(err, repos) {
        if(err) throw err;

        if(count > repos.length) {
            count = repos.length;
        }

        repos.sort(sortReposByLanguage);

        for(var i = 0; i < count; i++) {

            if(include_colors === true) {
                if(languageToll[repos[i].language] === undefined) {
                    languageToll[repos[i].language] = {
                        color: github_colors[repos[i].language],
                        count: 0
                    };
                }
                languageToll[repos[i].language].count++;
            }
            else {
                if(languageToll[repos[i].language] === undefined) {
                    languageToll[repos[i].language] = 0;
                }
                languageToll[repos[i].language]++;
            }
        }

        if(Array.isArray(truncate)) {
            for(var i = 0; i < truncate.length; i++) {
                if(truncate[i] === 'null' && include_null === true) {
                    //purposely do nothing
                }
                else {
                    delete languageToll[truncate[i]];
                }
            }
        }

        res.json(languageToll);
        mostUsedLanguages = [];
        languageToll = {};

    });
});


function sortReposByStargazers(a,b) {
    if(a['stargazers_count'] < b['stargazers_count']) {
        return -1;
    }
    else if(a['stargazers_count'] > b['stargazers_count']) {
        return 1;
    }
    else {
        var a_date = new Date(a['updated_at']);
        var b_date = new Date(b['updated_at']);
        if(a_date < b_date) {
            return -1;
        }
        else if(a_date > b_date) {
            return 1;
        }
        else {
            return 0;
        }
    }
}

function sortReposByRecentlyUpdated(a,b) {
    var a_date = new Date(a['updated_at']);
    var b_date = new Date(b['updated_at']);
    if(a_date < b_date) {
        return -1;
    }
    else if(a_date > b_date) {
        return 1;
    }
    else {
        return 0;
    }
}

function sortReposByLanguage(a,b) {
    if(a['language'] < b['language']) {
        return -1;
    }
    else if(a['language'] > b['language']) {
        return 1;
    }
    else {
        return 0;
    }
}


app.get('/api/soundcloud/likes', function(request, response){
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

app.get('/api/lastfm/recent', function(request, response){
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

app.get('/api/manual404test', function(request, response){
    response.set('Access-Control-Allow-Origin','*');
    console.log('GET /api/manual404test ', response.statusCode, request.query);
    res.status(404).send('Bad request');
});

var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    fs.readFile('colors.json', 'utf8', function(err,data){
        if(err) throw err;
        github_colors = JSON.parse(data);
    });

    console.log('Example app listening at http://%s:%s', host, port);
});
