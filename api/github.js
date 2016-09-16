'use strict';

var express = require('express');
var router = express.Router();
var github = require('octonode');
var fs = require('fs');

const access_token = process.env.GITHUB_TOKEN; //Your personal access token (github)
var client = github.client(access_token);
var github_colors = {};

fs.readFile('colors.json', 'utf8', function(err,data){
    if(err) throw err;
    github_colors = JSON.parse(data);
});

router.get('/', function (req, res) {
    res.set('Access-Control-Allow-Origin','*');
    res.json({'methods':[
        '/popular',
        '/languages'
    ]});
});

var mostPopularRepos = [];

router.get('/popular', function(req, res) {
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

router.get('/languages', function (req, res) {
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

module.exports = router;
