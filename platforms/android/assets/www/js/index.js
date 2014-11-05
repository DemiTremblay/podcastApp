/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var podcast_list = [];
var currentMedia = {}; //Object that contains data about currently playing podcast
var dataToRemove = {};

var online = true;
var app = {
    podcast: {}, //defines the podcast
    currentTimer: {}, //defines the currentTimer position
    handle: {}, //defines the seekbar in the HTML
    progressBar: {}, //defines the progressBar

    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },

    // Bind Event Listeners
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        console.log("in onDeviceReady");
        //setting up the application environment
        app.receivedEvent('deviceready'); //confirms that the device is ready
        app.setUpButtonListeners(); //sets up the button event listeners for the application
        app.setUpMedia(); //sets up the media player for the application
        app.refreshMetaPOD(); //refreshes the application
        app.setUpProgessBar(); //sets up the progress bar



        //handles the app when the network status is offline
        //should create a queue for podcasts to download if the add button is clicked
        document.addEventListener("offline", function () {
            online = false;
            alert("You are currently offline, any podcast you add will be downloaded when you regain connection");
            app.refreshMetaPOD();

        }, false);

        //handles the app when the network status is offline
        //should create a queue for podcasts to download if the add button is clicked
        document.addEventListener("online", function () {
            online = true;
            app.refreshMetaPOD();
        }, false);
    },

    buildList: function () {
        console.log("In buildList");
        var string = "<ul>";

        if (localStorage.getItem('podcastData')) {

            //Display podcasts
            var retrievedObject = localStorage.getItem('podcastData');
            var podcastObject = JSON.parse(retrievedObject);

            //Iterate through all of the podcasts to create the list
            for (var i = 0; i < podcastObject.episodes.length; i++) {


                string += "<a class='podcastClicked' data-download='" + cordova.file.externalDataDirectory + podcastObject.episodes[i].link + "' data-image='" + cordova.file.externalDataDirectory + podcastObject.episodes[i].image + "' data-title = '" + podcastObject.episodes[i].collection + "' episode-number=" + podcastObject.episodes[i].episodeNumber + ">";
                string += "<li><img class='remoteImage' src='" + cordova.file.externalDataDirectory + podcastObject.episodes[i].image + "'/>";
                string += "<h2>" + podcastObject.episodes[i].episodeTitle + "</h2>";
                string += "<p class='duration'>Duration: " + podcastObject.episodes[i].duration;
                string += "</p></li></a>";

            }

            var list = document.getElementById("podcastList");
            string += "</ul>";
            list.innerHTML = string;

            var podcastClicked = document.getElementsByClassName("podcastClicked");
            for (var i = 0; i < podcastClicked.length; i++) {
                podcastClicked[i].addEventListener("click", function () {

                    app.setUpMedia(this.getAttribute("data-download"))
                    var title = this.getAttribute("data-download").split('/');
                    currentMedia.podcastTitle = title.pop();
                    currentMedia.episodeNumber = this.getAttribute("episode-number");
                    app.goToPlayer(this.getAttribute("data-image"));
                }, true);
            }
        } else {
            var list = document.getElementById("podcastList");
            list.innerHTML = "There are no podcasts detected. Please download some!";
        }
    },

    onResolveSuccess: function (fileEntry) {
        console.log(fileEntry.name);
    },

    //sets up all of the buttons throughout the app with the EventListener they require
    setUpButtonListeners: function () {
        //handles the goOnline event
        var onlineButton = document.getElementById('online');
        onlineButton.addEventListener("click", sim.goOnline);

        //handles the goOffline event
        var offlineButton = document.getElementById('offline');
        offlineButton.addEventListener("click", sim.goOffline);

        //handles the add new podcast button
        var buttonAdd = document.getElementById("addButton");
        buttonAdd.addEventListener("click", function () {
            app.goToAddPage();
        }, true);

        //handles the add podcast button
        var buttonAddToList = document.getElementById("addPodcastButton");
        buttonAddToList.addEventListener("click", function () {
            app.addToList();
        }, true);

        //handles the refresh button
        var buttonRefresh = document.getElementById("refresh");
        buttonRefresh.addEventListener("click", function () {

            app.refreshMetaPOD();

        }, true);

        //handles the back button
        var buttonBack = document.getElementsByClassName("back");
        for (var i = 0; i < buttonBack.length; i++) {
            buttonBack[i].addEventListener("click", function () {
                app.goToMainPage();
                app.refreshMetaPOD();

            }, true);
        }

        //handles the play button
        var buttonPlay = document.getElementById("play");
        buttonPlay.addEventListener("click", function () {
            //sets a Counter
            var counter;
            //Starts the podcast
            app.playPodcast();
            //Create the timer to get the Duration
            var timerDuration = setInterval(function () {
                //goes increases the counter
                counter = counter + 100;
                //if the counter has reached 2000 and hasn't found the duration
                if (counter > 2000) {
                    //stop it
                    clearInterval(timerDuration);
                }
                //get the duration
                var dur = podcast.getDuration();
                //if duration is greater than 0
                if (dur > 0) {
                    //set the Duration by
                    //Getting the hours
                    var durationHours = Math.floor((dur / 60) / 60);

                    //if it is less than 1, set the duration to blank.
                    if (durationHours < 1) {
                        document.getElementById("durationHours").innerHTML = "";
                    }
                    //if it is greater than 1, set the hours to the durationHours variable
                    else {
                        document.getElementById("durationHours").innerHTML = durationHours + ":";
                    }

                    //Gets the Minutes of the duration
                    var durationMinutes = Math.floor(dur / 60);
                    //if the minutes is less than 1
                    if (durationMinutes < 1) {
                        //set the durationMinutes span to 00: to keep it at a 00:00 format
                        document.getElementById("durationMinutes").innerHTML = "00:";
                    } else if (durationMinutes >= 1 && durationMinutes < 10) {
                        //if it is between 1 and 9 add the 0 to keep to the 00:00 format
                        document.getElementById("durationMinutes").innerHTML = "0" + durationMinutes + ":";
                    } else {
                        //otherwise just set it to the durationMinutes
                        document.getElementById("durationMinutes").innerHTML = durationMinutes + ":";
                    }

                    //get the Seconds
                    var durationSeconds = Math.floor(dur % 60);

                    //if duration is less than 10 seconds
                    if (durationSeconds < 10) {
                        //add the 0 to keep to the 00:00 format
                        document.getElementById("durationSeconds").innerHTML = "0" + durationSeconds;
                    } else {
                        //otherwise, just set the duration
                        document.getElementById("durationSeconds").innerHTML = durationSeconds;
                    }

                    //Stop trying to get the duration
                    clearInterval(timerDuration);
                }
            }, 100);

            currentTimer = setInterval(function () {
                podcast.getCurrentPosition(function (position) {
                    //if the position is = -1, just straight up set it to 0 for the seekBar's sake
                    if (position == -1) {
                        position = 0
                    }

                    //formate the time exactly like they did in the duration
                    var progressHours = Math.floor((position / 60) / 60);
                    if (progressHours < 0) {
                        progressHours = 0;
                    }
                    //console.log(progressHours + " hours");

                    if (progressHours < 1) {
                        document.getElementById("progressHours").innerHTML = "";
                    } else {
                        document.getElementById("progressHours").innerHTML = progressHours + ":";
                    }

                    var progressMinutes = Math.floor(position / 60);
                    if (progressMinutes < 0) {
                        progressMinutes = 0;
                    }
                    //console.log(progressMinutes + " minutes");
                    if (progressMinutes == 0) {
                        document.getElementById("progressMinutes").innerHTML = "00:";
                    } else if (progressMinutes >= 1 && progressMinutes < 10) {
                        document.getElementById("progressMinutes").innerHTML = "0" + progressMinutes + ":";
                    } else {
                        document.getElementById("progressMinutes").innerHTML = progressMinutes + ":";
                    }


                    var progressSeconds = Math.floor(position % 60);
                    if (progressSeconds < 0) {
                        progressSeconds = 0;
                    }
                    if (progressSeconds < 10) {
                        document.getElementById("progressSeconds").innerHTML = "0" + progressSeconds;
                    } else {
                        document.getElementById("progressSeconds").innerHTML = progressSeconds;
                    }

                    //figure out the progress by getting the position and converting it to a percentage to fit the
                    //seekbar code
                    var progress = position / podcast.getDuration();
                    progress = Math.round(progress * 100);
                    progressBar.style.width = progress + '%';
                    progressBar.setAttribute('aria-valuenow', progress);
                });
            }, 1000);
        }, true);

        //handles the pause button
        var buttonPause = document.getElementById("pause");
        buttonPause.addEventListener("click", function () {
            app.pausePodcast();
        }, true);

        //handles the skip forward 30 seconds button
        var buttonSkip = document.getElementById("skip");
        buttonSkip.addEventListener("click", function () {
            app.skipPodcast();
        }, true);

        //handles the rewind 10 seconds button
        var buttonReverse = document.getElementById("reverse");
        buttonReverse.addEventListener("click", function () {
            app.rewindPodcast();
        }, true);
    },

    //sets up the media aspect using the link received
    setUpMedia: function (link) {
        if (!link) {
            var src = encodeURI("https://dl.dropboxusercontent.com/u/887989/test.mp3");
        } else {
            var src = encodeURI(link);
        }

        //creates new media object for the podcast
        podcast = new Media(src, app.endPodcast);

    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        console.log('Received Event: ' + id);
    },

    //sets up the progress bar in the media player
    setUpProgessBar: function () {
        handle = document.querySelector('.seekbar input[type="range"]');
        progressBar = document.querySelector('.seekbar div[role="progressbar"]');
        handle.addEventListener('input', function () {
            progressBar.style.width = this.value + '%';
            progressBar.setAttribute('aria-valuenow', this.value);
            var dur = podcast.getDuration();
            var position = dur * (this.value / 100);
            podcast.seekTo(position * 1000);
            podcast.getCurrentPosition(function (position) {
                //if the position is = -1, just straight up set it to 0 for the seekBar's sake
                if (position == -1) {
                    position = 0
                }

                //formate the time exactly like they did in the duration
                var progressHours = Math.floor((position / 60) / 60);

                if (progressHours < 1) {
                    document.getElementById("progressHours").innerHTML = "";
                } else {
                    document.getElementById("progressHours").innerHTML = durationHours + ":";
                }

                var progressMinutes = Math.floor(position / 60);
                if (progressMinutes == 0) {
                    document.getElementById("progressMinutes").innerHTML = "00:";
                } else if (progressMinutes >= 1 && progressMinutes < 10) {
                    document.getElementById("progressMinutes").innerHTML = "0" + progressMinutes + ":";
                } else {
                    document.getElementById("progressMinutes").innerHTML = progressMinutes + ":";
                }


                var progressSeconds = Math.floor(position % 60);
                if (progressSeconds < 10) {
                    document.getElementById("progressSeconds").innerHTML = "0" + progressSeconds;
                } else {
                    document.getElementById("progressSeconds").innerHTML = progressSeconds;
                }


                //figure out the progress by getting the position and converting it to a percentage to fit the
                //seekbar code
                var progress = position / podcast.getDuration();
                progress = Math.round(progress * 100);

                progressBar.style.width = progress + '%';
                progressBar.setAttribute('aria-valuenow', progress);
            });
        });
    },

    goToPlayer: function (image) {
        console.log("going to the media player");
        var hidden = document.getElementById("menu");
        var shown = document.getElementById("player");
        hidden.className = "hidden";
        shown.className = "";


        if (!image) {
            image = "../img/appIcon_grey.png";
        } else {

            var backImage = document.getElementById("backImage");
            backImage.setAttribute("src", image);
        }
    },
    goToAddPage: function () {
        var hidden = document.getElementById("menu");
        var shown = document.getElementById("addPage");
        hidden.className = "hidden";
        shown.className = "";
    },

    goToMainPage: function () {
        var hidden = document.getElementById("player");
        var hidden2 = document.getElementById("addPage");
        var shown = document.getElementById("menu");
        hidden.className = "hidden";
        hidden2.className = "hidden";
        shown.className = "";
    },

    addToList: function () {

        textValue = document.getElementById("addPodcastText");

        if (app.checkURLValid(textValue.value)) {
            if (podcast_list.indexOf(textValue.value) == -1) {
                podcast_list.push(textValue.value);
                alert("Podcast Added");
                console.log(textValue.value);
                app.refreshMetaPOD();
            } else {
                alert("That podcast has already been added");
            }
        } else {
            alert("Invalid url. Please ensure that 'http://' is included at the front of the url and that no spaces are present.");
        }
        textValue.setValue = "";
    },

    checkURLValid: function (url) {
        console.log("checking url validity");

        var myRegExp = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
        var urlToValidate = url;
        if (!myRegExp.test(urlToValidate)) {
            return false;
        } else {
            return true;
        }
    },

    playPodcast: function () {
        podcast.play();
    },
    pausePodcast: function () {
        podcast.pause();
        clearInterval(currentTimer);
    },

    skipPodcast: function () {
        podcast.getCurrentPosition(function (position) {
            podcast.seekTo(position * 1000 + 30000);
        });
    },

    rewindPodcast: function () {
        podcast.getCurrentPosition(function (position) {
            podcast.seekTo(position * 1000 - 10000);
        });
    },


    //refreshes the list of podcasts, does the respective XMLHttpRequest if necessary
    refreshMetaPOD: function () {


        app.buildList();

        var properties = {
            podCastCietitle: "",
            episodeTitle: "",
            duration: "",
            image: "",
            link: "",
            collection: ""
        };


        list = document.getElementById("podcastList");
        var string = "";

        if (podcast_list.length >= 1) {

            for (var j = 0; j < podcast_list.length; j++) {

                while (list.hasChildNodes()) {
                    list.removeChild(podcastList.firstChild);
                }
                var request = new XMLHttpRequest();
                request.open("GET", podcast_list[j], false);
                request.onreadystatechange = function () {
                    if (request.readyState == 4) {
                        if (request.status == 200 || request.status == 0) {

                            var podcastXML = request.responseXML;

                            var info = new Object();

                            podcastChannel = podcastXML.getElementsByTagName("channel");
                            podcastInfo = podcastXML.getElementsByTagName("item");

                            var podcastTitle = podcastChannel[0].querySelector("title").textContent;
                            var image = encodeURI(podcastChannel[0].querySelector("image").querySelector("url").textContent);

                            string += "<ul>";


                            if (online) {
                                var locationToPlace = cordova.file.externalDataDirectory;
                                var collectionName = podcastTitle.replace(/ /g, '_');

                                var audioSrc_one = encodeURI(podcastInfo[0].querySelector("link").textContent);
                                var audioSplit_one = audioSrc_one.split("/");
                                var audioName_one = audioSplit_one.pop();

                                var audioSrc_two = encodeURI(podcastInfo[1].querySelector("link").textContent);
                                var audioSplit_two = audioSrc_two.split("/");
                                var audioName_two = audioSplit_two.pop();

                                window.resolveLocalFileSystemURL(locationToPlace, function (foundInfo) {
                                    foundInfo.getFile(audioName_one, {
                                            create: false
                                        }, function () {
                                            console.log("already there");
                                        },
                                        function () {
                                            console.log("downloading");
                                            transfer = new FileTransfer();
                                            transfer.download(audioSrc_one, locationToPlace + audioName_one, app.downloadSuccess, app.downloadError);

                                            var imageSrc = encodeURI(podcastChannel[0].querySelector("image").querySelector("url").textContent);

                                            transfer = new FileTransfer();
                                            transfer.download(imageSrc, locationToPlace + collectionName + "/cover.jpg", app.downloadSuccess, app.downloadError);

                                        });
                                });

                                window.resolveLocalFileSystemURL(locationToPlace, function (foundInfo) {
                                    foundInfo.getFile(audioName_two, {
                                            create: false
                                        }, function () {
                                            console.log("already downloaded");
                                        },
                                        function () {
                                            console.log("downloaded");
                                            transfer = new FileTransfer();
                                            transfer.download(audioSrc_two, locationToPlace + audioName_two, app.downloadSuccess, app.downloadError);

                                            var imageSrc = encodeURI(podcastChannel[0].querySelector("image").querySelector("url").textContent);

                                            transfer = new FileTransfer();
                                            transfer.download(imageSrc, locationToPlace + collectionName + "/cover.jpg", app.downloadSuccess, app.downloadError);
                                        });
                                });
                            } else {
                                alert("Your downloads will begin as soon as you are online");
                            }



                            for (var i = 0; i < 2; i++) { // Go through XML data (max 2 entries)
                                properties.podCastCietitle = podcastTitle;

                                var audioSrc = encodeURI(podcastInfo[i].querySelector("link").textContent);
                                var audioSplit = audioSrc.split("/");
                                var audioName = audioSplit.pop();

                                properties.link = audioName;
                                properties.episodeTitle = podcastInfo[i].querySelector("title").textContent;
                                properties.duration = podcastInfo[i].getElementsByTagNameNS("*", "duration")[0].textContent;

                                properties.image = collectionName + "/cover.jpg";
                                properties.collection = collectionName;
                                properties.episodeNumber = i + 1;

                                var retrievedObject = "";
                                var podcastList = "";

                                //If there is existing data, pull it out, append new data and save it again
                                if (localStorage.getItem('podcastData')) {
                                    retrievedObject = localStorage.getItem('podcastData');
                                    podcastList = JSON.parse(retrievedObject);
                                    var newItem = true;
                                    for (var j = 0; j < podcastList.episodes.length; j++) { // look for item in Local Storage
                                        if (podcastList.episodes[j].episodeTitle == podcastInfo[i].querySelector("title").textContent) {
                                            newItem = false;
                                        }
                                    }
                                    if (newItem == true) { // New item - add to local storage                      
                                        podcastList.episodes.push(properties);
                                    }
                                } else { // No local storage - create a new object to be saved
                                    podcastList = {
                                        episodes: []
                                    };
                                    podcastList.episodes.push(properties);
                                }
                                localStorage.removeItem("podcastData");
                                localStorage.setItem('podcastData', JSON.stringify(podcastList));

                                //podcastProperties.properties[i].push(info);
                                //if(podcastTitle matches Directory Name && linkFolderName matches subfoldername)
                                //then you don't download... alert("This podcast has already been added...
                                //find info and print out
                                //else do the file transfer

                            }
                            var locationToPlace = cordova.file.externalDataDirectory;
                            var audioSplit = audioSrc.split("/");
                            var audioName = audioSplit.pop();
                            retrievedObject = localStorage.getItem('podcastData');
                            podcastList = JSON.parse(retrievedObject);
                            for (var k = 0; k < podcastList.episodes.length; k++) {
                                string += "<a class='podcastClicked' data-download='" + locationToPlace + podcastList.episodes[k].link + "' data-image='" + locationToPlace + podcastList.episodes[k].image + "' data-title = '" + podcastTitle + "' episode-number=" + podcastList.episodes[k].episodeNumber + ">";
                                string += "<li>";
                                string += "<img class='remoteImage' src='" + locationToPlace + podcastList.episodes[k].image + "'/>";
                                string += "<h2>" + podcastList.episodes[k].episodeTitle + "</h2>";
                                string += "<p class='duration'>Duration: " + podcastList.episodes[k].duration;
                                string += "</p></li></a>";
                                currentMedia.podcastTitle = podcastList.episodes[k].link;
                            }
                            string += "</ul>";
                            list.innerHTML = string;
                        }
                    }
                }
            }
            request.send();
        } else {

            podcast_list.push()
        }


        var podcastClicked = document.getElementsByClassName("podcastClicked");

        for (var i = 0; i < podcastClicked.length; i++) {
            podcastClicked[i].addEventListener("click", function () {

                app.setUpMedia(this.getAttribute("data-download"));
                var title = this.getAttribute("data-download").split('/');
                currentMedia.podcastTitle = title.pop();
                currentMedia.episodeNumber = this.getAttribute("episode-number");
                app.goToPlayer(this.getAttribute("data-image"));
            }, true);
        }
    },

    endPodcast: function () {
        app.removeFile(currentMedia.podcastTitle, currentMedia.episodeNumber);

        clearInterval(currentTimer);
    },


    downloadSuccess: function () {
        console.log("Download successful");

    },

    removeFile: function (podcastName, episodeNumber) {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, app.deleteSuccesses, app.deleteFail);
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory + podcastName, app.gotRemoveFileEntry, app.deleteFail);

    },

    downloadError: function (e) {
        alert("Download failed");
        console.log(e);
    },

    gotRemoveFileEntry: function (fileEntry) {
        console.log(fileEntry);
        fileEntry.remove(app.deleteSuccess, app.deleteFail);
    },


    removePodcastData: function (podcastName, episodeNumber) {
        var podIndex;

        if (localStorage.getItem('podcastData')) {
            var retrievedObject = localStorage.getItem('podcastData');
            var podcastObject = JSON.parse(retrievedObject);

            console.log(podcastObject.episodes.length);

            //Loop through to locate the index value of the podcast being removed
            for (var i = 0; i < podcastObject.episodes.length; i++) {
                if (podcastObject.episodes[i].link == podcastName) {
                    console.log("found podcast in data");

                    var removed = podcastObject.episodes.splice(i, 1);
                    i--;
                }
            }
            localStorage.removeItem("podcastData");
            localStorage.setItem("podcastData", JSON.stringify(podcastObject));
        }
        var list = document.getElementById("podcastList");
        list.innerHTML = "";
        app.buildList();

        var hidden = document.getElementById("player");
        var hidden2 = document.getElementById("addPage");
        var shown = document.getElementById("menu");

        hidden.className = "hidden";
        hidden2.className = "hidden";
        shown.className = "";
    },

    deleteSuccesses: function (entry) {
        app.removePodcastData(currentMedia.podcastTitle, currentMedia.episodeNumber);

    },

    deleteFail: function (error) {
        console.log("Error removing file: " + error.code);
    },
};

var handle = document.querySelector('.seekbar input[type="range"]');
var progressBar = document.querySelector('.seekbar div[role="progressbar"]');

handle.addEventListener('input', function () {
    progressBar.style.width = this.value + '%';
    progressBar.setAttribute('aria-valuenow', this.value);
});

app.initialize();