/**
 * Created by hubbard on 12/26/15.
 */

var reloadInfo = function() {
    console.log('Reloading info');
    // Cache buster - see http://stackoverflow.com/questions/2104949/how-to-reload-refresh-an-elementimage-in-jquery
    d = new Date();
    $('#coverArt').removeAttr('src').attr('src', 'http://thor.phfactor.net:8181/artwork?' + d.getTime());

    // jsonp to get player status as json
    // Note - had to modify the itunes-api code on thor using the cors plugin for this to work
    // http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-node-js
    $.getJSON('http://thor.phfactor.net:8181/now_playing', null, function(data) {
        console.log(data);
        var state = data['player_state'];

        if (state === 'stopped'){
            $('#nowPlayingText').text('Stopped');
            $('#PlayPauseBtn').text('Play');
            $('#PlayPauseBtn').hide();
        }
        if (state === 'playing') {
            $('#nowPlayingText').text('"' + data['name'] + '" by ' + data['artist']);
            $('#PlayPauseBtn').text('Pause');
            $('#PlayPauseBtn').show();
        }

        if (state === 'paused') {
            $('#nowPlayingText').text('Paused, "' + data['name'] + '" by ' + data['artist']);
            $('#PlayPauseBtn').text('Play');
            $('#PlayPauseBtn').show();
        }
    });


};

var pbControl = function(verb) {
    console.log(verb);
    $.ajax({
        url: 'http://thor.phfactor.net:8181/' + verb,
        method: 'PUT'});
    setTimeout(reloadInfo, 2000);
};

var playPauseToggleFn = function() {
    pbControl('playpause');
};

var playFn = function() {
    pbControl('play');
};

var stopBfn = function() {
    pbControl('stop');
};

var prevFn = function() {
    pbControl('previous');
};

var nextFn = function() {
    pbControl('next');
};

var setSinglePlaylist = function(pl_id) {
    console.log('Selecting playlist id ' + pl_id);
    $.ajax({
        url: 'http://thor.phfactor.net:8181/playlists/' + pl_id + '/play',
        method: 'PUT'
    });
};

var setPlaylist = function(pl_name) {

    console.log('Playlist ' + pl_name);
    $.getJSON('http://thor.phfactor.net:8181/playlists', null, function(data) {
        console.log('Got playlists');
        data['playlists'].forEach(function(item, index) {
            if (item['name'] === pl_name) {
                setSinglePlaylist(item['id']);
                return;
            }
        });
        console.error('Playlist ' + pl_name + ' not found!');
    });
};

var setSingleDevice = function(speaker_id, active) {
    var s_url = 'http://thor.phfactor.net:8181/airplay_devices/' + speaker_id + '/' + active;
    console.log(s_url);

    $.ajax({
        url: s_url,
        method: 'PUT'});
};

// http://stackoverflow.com/questions/3273350/jquerys-click-pass-parameters-to-user-function#9467172
var setDeviceFromMenu = function(event){
    setSingleDevice(event.data.param1, event.data.param2);
};

var setSpeakers = function(sp_list) {
    console.log('Getting list of devices...');
    $.get('http://thor.phfactor.net:8181/airplay_devices', null, function(data) {
        console.log('Speakers...');
       data['airplay_devices'].forEach(function(item, index) {
           if (item['name'] === sp_list[0]) {
               setSingleDevice(item['id'], 'on');
           }
           else {
               setSingleDevice(item['id'], 'off');
           }
       });
    });
};

var setVolume = function(percentage) {

    console.log('setting volume to ' + percentage);
    $.ajax({
        url: 'http://thor.phfactor.net:8181/volume',
        data: {level: percentage},
        method: 'PUT'});
};

var setQuiet = function() {
    setVolume(35);
};

var setLoud = function() {
    setVolume(55);
};

var presetDemo = function() {

    console.log('Demo preset');
    stopBfn();
    setPlaylist('Demo');
    setLoud();
    setSpeakers(['Kitchen']);
    playFn();
};

var presetGarage = function() {

    console.log('Garage');
    stopBfn();
    setPlaylist('Basic rock');
    setLoud();
    setSpeakers(['Garage']);
    playFn();
};

var presetRandomChoral = function() {
    console.log('Choral preset');
    stopBfn();
    var plists = ['B Minor mass', 'Bach: St. Matthew Passion', 'Berlioz - Requiem', 'Magnificat', 'Messiah'];
    var pl = plists[Math.floor(Math.random()*plists.length)];
    setPlaylist(pl);
    setSpeakers(['Kitchen']);
    setTimeout(playFn, 2000);
//    playFn();
};


// Populate the menu dropdown with names of airplay devices. Incomplete.
// FIXME - need to reload this now and then, so need ability to rewrite and not just append
var fillDeviceMenu = function() {
    $.getJSON('http://thor.phfactor.net:8181/airplay_devices', function(data) {
        console.log('device menu fill');
        $.each(data['airplay_devices'], function(index, item) {
            console.log(item['name']);

            // Create a menu element with a unique id and attach a click handler to it
            var dom_id = 'spkr-menu-' + item['id'];
            console.log(dom_id);
            $('#deviceMenu').append('<li><a href="#" id="' + dom_id + '">' + item['name'] + "</a></li>");
            // http://stackoverflow.com/questions/3273350/jquerys-click-pass-parameters-to-user-function#9467172
            $('#' + dom_id).click({param1: item['id'], param2: 'on'}, setDeviceFromMenu);

        })
    });
};

// Reload the cover art on a simple recurring timer. Hook is window load completion.
$(window).load(function() {
    console.log('Doing initial data load');
    fillDeviceMenu();
    reloadInfo();
    console.log('Starting reloader');
    setInterval(reloadInfo, 15000);


    console.log('Enabling buttons');
    $('#PlayPauseBtn').click(playPauseToggleFn);

    $('#setLoud').click(setLoud);
    $('#setQuiet').click(setQuiet);

    $('#prevBtn').click(prevFn);
    $('#nextBtn').click(nextFn);

    $('#demoKitchen').click(presetDemo);
    $('#presetGarage').click(presetGarage);
    $('#presetChoral').click(presetRandomChoral);
});