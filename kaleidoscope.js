/*
To do list:
add embedded ig posts to show example gallery?
Site logo or Gradient banner at the top?
Add user input options -- control animation length, width of animation
*/

//image upload variables
var animation = document.getElementById("animation");
var imageInput = document.getElementById('imageInput');
imageInput.addEventListener('change', readSourceImage);
var isImageLoaded = false;
var imageContainer = document.getElementById('imageContainer');
var newImageContainer = document.getElementById('newImageContainer');

var actualWidth = 400; //dimensions of default image
var actualHeight = 533;

var scaledWidth = 400;
var scaledHeight = 533;
var widthScalingRatio = 1;
var maxImageWidth = 450;

var SqrtOf3_4 = Math.sqrt(3)/2;

//cover loading screen
var loadingScreen = document.getElementById("coverScreen");

/*
var pauseButton = document.getElementById('pauseAnimationButton');
pauseButton.addEventListener('click', pausePlayAnimation);
var playAnimationToggle = false;
*/

//video recording function
var recordBtn = document.getElementById("recordVideoButton");
var recording = false;
var mediaRecorder;
var recordedChunks;
recordBtn.addEventListener('click', recordVideoMuxer);

//video duration input
var videoDurationInput = document.getElementById("videoDurationInput");
videoDurationInput.addEventListener('change', getUserInputs);
var videoDuration = Math.max(1,Math.min(120,Number(videoDurationInput.value)));

//Save and export the new image in png format
var saveButton = document.getElementById('save-image-button');
/*
saveButton.addEventListener('click', () => {
    saveImage();
});
*/

var finishedBlob;
var downloadButton = document.getElementById("downloadButton");
downloadButton.addEventListener("click",downloadBlob);

//user control sliders
var animationSpeedInput = document.getElementById('speedInput');
animationSpeedInput.addEventListener('change', getUserInputs);

//animation variables
var animationLength = 600; //larger value give longer animation before restarting loop
var animationSpeed = 2000; //larger value gives slower animation
var counter = animationSpeed*0.5; //animation start point
var fps = 15; //animation frames per second
var patDim = 400;
var animationWidth = 800;
var animationStep = 1.5; //larger values give larger movement between animation frames;
var animationInterval;

//MAIN METHOD
//this runs the default image animation at startup
getUserInputs();
setTimeout(createAnimation, 2000);


function getUserInputs(){
    var speedInputValue = Number(animationSpeedInput.value);
    animationSpeed = 8000/speedInputValue; //larger value gives slower animation
    console.log("animation speed: "+animationSpeed);
    videoDuration = Math.max(1,Math.min(60,Number(videoDurationInput.value)));
    console.log("video record duration (seconds): "+videoDuration);
}

//read and accept user input image
function readSourceImage(){

    //remove any existing images
    while (imageContainer.firstChild) {
        imageContainer.removeChild(imageContainer.firstChild);
    }

    while (newImageContainer.firstChild) {
        newImageContainer.removeChild(newImageContainer.firstChild);
    }

    if(playAnimationToggle == true){
        clearInterval(animationInterval);
    }

    loadingScreen.classList.remove("hidden");
    loadingScreen.classList.add("lockOn");

    counter = animationSpeed*0.5; //reset to default animation start point
        
    //read image file      
    var file = imageInput.files[0];
    var reader = new FileReader();
    reader.onload = (event) => {
        var imageData = event.target.result;
        var image = new Image();
        image.src = imageData;
        image.onload = () => {
          
            actualWidth = image.width;
            actualHeight = image.height;

            //image scaling
            if(actualWidth > maxImageWidth){
                scaledWidth = maxImageWidth;
                widthScalingRatio = scaledWidth / actualWidth;
                scaledHeight = actualHeight * widthScalingRatio;
            } else{
                scaledWidth = actualWidth;
                widthScalingRatio = 1;
                scaledHeight = actualHeight;
            }

            patDim = scaledWidth;
            animationWidth = patDim*2;

            //resize the src variable of the original image
            var newCanvas = document.createElement('canvas');
            newCanvas.width = scaledWidth;
            newCanvas.height = scaledHeight;
            var ctx = newCanvas.getContext('2d');
            ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);
        
            var resizedImgSrc = newCanvas.toDataURL();
    
            //draw the resized image onto the page
            var originalImg = document.createElement('img');
            originalImg.setAttribute("id", "originalImg");
            originalImg.src = resizedImgSrc;
            originalImg.width = scaledWidth;
            originalImg.height = scaledHeight;
            imageContainer.appendChild(originalImg);

            setTimeout(generateFlippedImage, 1000); //wait a second for image creation before next function
   
        };
    };
      
    reader.readAsDataURL(file);
    isImageLoaded = true;
    
}

//flip input image horizontally
function generateFlippedImage(){
    console.log("generate flipped image");
    var originalImg = document.getElementById('originalImg');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    canvas.width = originalImg.width;
    canvas.height = originalImg.height;

    ctx.drawImage(originalImg, 0, 0, originalImg.width, originalImg.height);
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, -originalImg.width, 0, originalImg.width, originalImg.height);

    var flippedImg = new Image();
    flippedImg.setAttribute("id", "flippedImg");
    flippedImg.src = canvas.toDataURL();
    newImageContainer.appendChild(flippedImg);

    setTimeout(createAnimation, 1000); //wait a second for image creation before next function

}

//based on Luke Hannam's work: https://www.pepperoni.blog/canvas-kaleidoscope/
function createAnimation(){
    
    loadingScreen.classList.add("hidden");
    loadingScreen.classList.remove("lockOn");

    getUserInputs();
    playAnimationToggle = true;

    console.log("create animation");

    //load images
    animation.width = animationWidth;
    animation.height = animationWidth;
    var baseImg = document.getElementById("originalImg");
    var baseRImg = document.getElementById("flippedImg");
    var ctx = animation.getContext("2d", { willReadFrequently: true }); //added willReadFrequently
    var pat = ctx.createPattern(baseImg, "repeat");
    var patR = ctx.createPattern(baseRImg, "repeat");
        
    //height of triangle side given side length of 150 is:
    var height =  SqrtOf3_4 * patDim;
    var offset = 0;
    ctx.translate(-0.5*patDim, 0);
    
    var fn = function(alternateMode){

        //offset = (offset - 1) % 1024
        offset = Math.sin(counter/animationSpeed*Math.PI)*animationLength; //makes animation go forward then backwards
        counter++;
        var i = 0;

        //draw kaleidoscope first row.
        ctx.save();
        ctx.fillStyle=pat;
        ctx.translate(0, offset);
        while(i <= 3){
            ctx.beginPath();
            ctx.moveTo(0,-offset);
            ctx.lineTo(patDim, -offset);
            ctx.lineTo(0.5*patDim, height-offset);
            ctx.closePath();
            //ctx.stroke();	//stroke included here helps with illustrating the draw
            ctx.fill();
            if(i%3==0){
                ctx.translate(patDim,-offset);
                ctx.rotate(-120*Math.PI/180);
                ctx.translate(-patDim,offset);
            }
            else if(i%3==1){
                if(alternateMode){
                ctx.rotate(120*Math.PI/180);
                ctx.translate(-3*patDim, 0);
                ctx.rotate(-120*Math.PI/180);
                }
                ctx.translate(0.5*patDim, height-offset);
                ctx.rotate(-120*Math.PI/180);
                ctx.translate(-0.5*patDim, -height+offset);
            }
            else if(i%3==2){
                ctx.translate(0,-offset);
                ctx.rotate(-120*Math.PI/180);
                ctx.translate(0,offset);
            }
            i++;
        }
        
        ctx.restore();
        ctx.save();
        ctx.scale(-1,-1);
        ctx.fillStyle=patR;
        ctx.translate((-i+(i%3==0?0.5:i%3==1?1.5:-0.5))*patDim, -height+offset);
        ctx.translate(0, -offset);
        ctx.rotate(120*Math.PI/180);
        ctx.translate(0, offset);
        
        var j=0;
        while(j < i+1){
            ctx.beginPath();
            if(j>0||!alternateMode){
                ctx.moveTo(0,-offset);
                ctx.lineTo(patDim, -offset);
                ctx.lineTo(0.5*patDim, height-offset);
                ctx.closePath();
                ctx.fill();
            }
            if(j%3==1){
                ctx.translate(patDim,-offset);
                ctx.rotate(-120*Math.PI/180);
                ctx.translate(-patDim,offset);
            }
            else if(j%3==2){
                ctx.translate(0.5*patDim, height-offset);
                ctx.rotate(-120*Math.PI/180);
                ctx.translate(-0.5*patDim, -height+offset);
            }
            else if(j%3==0){
                ctx.translate(0,-offset);
                ctx.rotate(-120*Math.PI/180);
                ctx.translate(0,offset);
            }
            j++;
        }

        ctx.restore();
        
    };

    var patternHeight = Math.floor(SqrtOf3_4*patDim*2);

    //tile function makes the animation fill up the whole canvas width/height
    var tile = function(){
        var rowData = ctx.getImageData(0,0,patDim*3,patternHeight);
        for(var i=0; patternHeight*i<animationWidth+SqrtOf3_4*patDim; i++){
            for(var j = 0; j*patDim<animationWidth+patDim; j+=3){
            ctx.putImageData(rowData,j*patDim,i*patternHeight);
            }
        }
    }

    //this creates the animation by calling the functions again and again every x miliseconds
    animationInterval = setInterval(
        function(){
            if(playAnimationToggle == true){
                fn(false);
                ctx.translate(animationStep*patDim, height);
                fn(true);
                ctx.translate(animationStep*-1*patDim, -height);
                tile();
            }

        } , 1000/fps);


}

//start or stop animation
function pausePlayAnimation(){
    if(playAnimationToggle == true){
        playAnimationToggle = false;
        clearInterval(animationInterval);
    } else {
        playAnimationToggle = true;
        createAnimation();
    }
}

//take screenshot of canvas at current position, export as png
function saveImage(){
    const link = document.createElement('a');
    link.href = animation.toDataURL();

    const date = new Date();
    const filename = `kaleidoscope_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.png`;
    link.download = filename;
    link.click();
}

//shortcut hotkey presses
document.addEventListener('keydown', function(event) {
    if (event.key === 'p') {
        pausePlayAnimation();
    } else if (event.key === 's') {
        saveImage();
    }  else if (event.key === 'r') {
        recordVideoMuxer();
    }
});

//record html canvas element and export as mp4 video
//source: https://devtails.xyz/adam/how-to-save-html-canvas-to-mp4-using-web-codecs-api
async function recordVideoMuxer() {
    console.log("start video recording");
    console.log("Video dimensions: "+animation.width+", "+animation.height);

    //hide input table and display user message
    document.getElementById("inputTable").classList.add("hidden");
    document.getElementById("videoRecordingMessageDiv").innerHTML = 
    "Video recording underway. A download button will be shown in "+videoDuration+" seconds.<br><br>This feature does not currently work on Mobile -- please try on Desktop instead.";
    document.getElementById("videoRecordingMessageDiv").classList.remove("hidden");
    
    var recordVideoState = true;
    const ctx = animation.getContext("2d", {
      // This forces the use of a software (instead of hardware accelerated) 2D canvas
      // This isn't necessary, but produces quicker results
      willReadFrequently: true,
      // Desynchronizes the canvas paint cycle from the event loop
      // Should be less necessary with OffscreenCanvas, but with a real canvas you will want this
      desynchronized: true,
    });
  
    let muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
  
      video: {
        // If you change this, make sure to change the VideoEncoder codec as well
        codec: "avc",
        width: animation.width,
        height: animation.height,
      },
  
      // mp4-muxer docs claim you should always use this with ArrayBufferTarget
      fastStart: "in-memory",
    });
  
    let videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error(e),
    });
  
    // This codec should work in most browsers
    // See https://dmnsgn.github.io/media-codecs for list of codecs and see if your browser supports
    videoEncoder.configure({
      codec: "avc1.42001f",
      width: animation.width,
      height: animation.height,
      bitrate: 7_200_000,
      bitrateMode: "constant",
    });
    //codec: "avc1.42003e",

    var recordVideoState = true;
    var frameNumber = 0;
    setTimeout(finalizeVideo,1000*videoDuration+200); //finish and export video after x seconds
    
    //take a snapshot of the canvas every x miliseconds and encode to video
    var videoRecordInterval = setInterval(
        function(){
            if(recordVideoState == true){
                renderCanvasToVideoFrameAndEncode({
                    animation,
                    videoEncoder,
                    frameNumber,
                    fps
                })
                frameNumber++;
            }
        } , 1000/fps);

    //finish and export video after x seconds
    async function finalizeVideo(){
        console.log("finalize video");
        recordVideoState = false;
        clearInterval(videoRecordInterval);
        // Forces all pending encodes to complete
        await videoEncoder.flush();
        muxer.finalize();
        let buffer = muxer.target.buffer;
        finishedBlob = new Blob([buffer]); 
        //downloadBlob(new Blob([buffer]));

        //hide user message, show download button
        document.getElementById("videoRecordingMessageDiv").classList.add("hidden");
        downloadButton.classList.remove("hidden");

    }

}
  
async function renderCanvasToVideoFrameAndEncode({
    canvas,
    videoEncoder,
    frameNumber,
    fps,
}) {
    let frame = new VideoFrame(animation, {
        // Equally spaces frames out depending on frames per second
        timestamp: (frameNumber * 1e6) / fps,
    });

    // The encode() method of the VideoEncoder interface asynchronously encodes a VideoFrame
    videoEncoder.encode(frame);

    // The close() method of the VideoFrame interface clears all states and releases the reference to the media resource.
    frame.close();
}
  
function downloadBlob() {
    console.log("download video");
    let url = window.URL.createObjectURL(finishedBlob);
    let a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    const date = new Date();
    const filename = `kaleidoscope_${date.toLocaleDateString()}_${date.toLocaleTimeString()}.mp4`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    //hide download button, show user menu
    downloadButton.classList.add("hidden");
    document.getElementById("inputTable").classList.remove("hidden");

}
  
