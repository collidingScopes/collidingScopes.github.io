// This example gets a video stream from a canvas on which we will draw
// black and white noise, and captures it to a video
//
// The relevant functions in use are:
//
// requestAnimationFrame -> to create a render loop (better than setTimeout)
// canvas.captureStream -> to get a stream from a canvas
// context.getImageData -> to get access to the canvas pixels
// URL.createObjectURL -> to create a URL from a stream so we can use it as src

var finishedBlob;
var downloadButton = document.getElementById("downloadButton");
downloadButton.addEventListener("click",downloadBlob);

var recordButton = document.getElementById("recordButton");
recordButton.addEventListener("click",startRecording);
var videoDuration = 10000; //milliseconds

var canvas = document.getElementById('canvas');
var width = canvas.width;
var height = canvas.height;
var capturing = false;

// We need the 2D context to individually manipulate pixel data
var ctx = canvas.getContext('2d');

// Start with a black background
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, width, height);

// Since we're continuously accessing and overwriting the pixels
// object, we'll request it once and reuse it across calls to draw()
// for best performance (we don't need to create ImageData objects
// on every frame)
var pixels = ctx.getImageData(0, 0, width, height);
var data = pixels.data;
var numPixels = data.length;

var fps = 24;
var stream = canvas.captureStream(fps);
var recorder = new MediaRecorder(stream, { 'type': 'video/mp4' });
recorder.addEventListener('dataavailable', finishCapturing);

//main method
draw();

function startRecording(){
    recorder.start(); //moved here
    capturing = true;

    setTimeout(function() {
        recorder.stop();
    }, videoDuration);
}

function finishCapturing(e) {
    //capturing = false;
    var videoData = [ e.data ];
    finishedBlob = new Blob(videoData, { 'type': 'video/mp4' });
    console.log(finishedBlob);
    downloadBlob(finishedBlob);
    //var videoURL = URL.createObjectURL(finishedBlob);
    //video.src = videoURL;
    //video.play();
    //downloadBlob(finishedBlob);
}

function draw() {
    // We don't want to render again if we're not capturing
    //requestAnimationFrame(draw);
    setInterval(drawWhiteNoise,1000/fps);
    //drawWhiteNoise();
}


function drawWhiteNoise() {
    
    var offset = 0;
    for(var i = 0; i < numPixels; i++) {
    var grey = Math.round(Math.random() * 255);
        data[offset++] = grey;
        data[offset++] = grey;
        data[offset++] = grey;
        offset++;
    }

    // And tell the context to draw the updated pixels in the canvas
    ctx.putImageData(pixels, 0, 0);
}


function downloadBlob() {
    let url = window.URL.createObjectURL(finishedBlob);
    let a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    const date = new Date();
    const filename = `video_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.mp4`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}