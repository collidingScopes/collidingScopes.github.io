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

const SqrtOf3_4 = Math.sqrt(3)/2;

var canvasWidthInput = document.getElementById("canvasWidthInput");
canvasWidthInput.addEventListener("change",changeTiling);
var canvasHeightInput = document.getElementById("canvasHeightInput");
canvasHeightInput.addEventListener("change",changeTiling);

var canvasWidth;
var canvasHeight;
var maxImageWidth;

// Toggle controls visibility
const toggleButton = document.getElementById('toggleControls');
const controls = document.getElementById('stickyTable');
const inputTable = document.getElementById('inputTable');

toggleButton.addEventListener('click', () => {
    inputTable.classList.toggle('hidden');
    console.log("toggle controls");
});

// Add scroll event listener to handle input table visibility
window.addEventListener('scroll', () => {
    const notesDiv = document.getElementById('notesDiv');
    const inputTable = document.getElementById('inputTable');
    
    if (notesDiv && inputTable) {
        const notesDivRect = notesDiv.getBoundingClientRect();
        // Hide input table when notesDiv comes into view
        if (notesDivRect.top <= 100 && notesDivRect.bottom >= 0) {
            inputTable.classList.add('hidden');
        } else {
            inputTable.classList.remove('hidden');
        }
    }
});

//cover loading screen
var loadingScreen = document.getElementById("coverScreen");

//detect user browser
var ua = navigator.userAgent;
var isSafari = false;
var isFirefox = false;
var isIOS = false;
var isAndroid = false;
if(ua.includes("Safari")){
    isSafari = true;
}
if(ua.includes("Firefox")){
    isFirefox = true;
}
if(ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")){
    isIOS = true;
}
if(ua.includes("Android")){
    isAndroid = true;
}
console.log("isSafari: "+isSafari+", isFirefox: "+isFirefox+", isIOS: "+isIOS+", isAndroid: "+isAndroid);


//video recording function
var recordBtn = document.getElementById("recordVideoButton");
var recording = false;
var mediaRecorder;
var recordedChunks;
recordBtn.addEventListener('click', chooseRecordingFunction);
var finishedBlob;
var recordingMessageDiv = document.getElementById("videoRecordingMessageDiv");

//video duration input
var videoDurationInput = document.getElementById("videoDurationInput");
videoDurationInput.addEventListener('change', getUserInputs);
var videoDuration = Math.max(1,Math.min(120,Number(videoDurationInput.value)));

//user control sliders
var animationSpeedInput = document.getElementById('speedInput');
animationSpeedInput.addEventListener('change', getUserInputs);

var userImage;

var numTilesInput = document.getElementById('numTilesInput');
numTilesInput.addEventListener('change', changeTiling);
var numTiles;

//animation variables
var animationLength = 600; //larger value give longer animation before restarting loop
var animationSpeed = 2000; //larger value gives slower animation
var counter = animationSpeed*0.5; //animation start point
var patDim = 400;
var animationWidth = 800;
var animationHeight = 800;
var animationStep = 1.5; //larger values give larger movement between animation frames;
var animationInterval;
var playAnimationToggle = false;
var animationRequest;

const fps = 30; //video record frames per second

function refresh(){
    getUserInputs();
    createAnimation();
}

function getUserInputs(){
    
    canvasWidth = Number(canvasWidthInput.value);
    canvasHeight = Number(canvasHeightInput.value);
    
    numTiles = Number(numTilesInput.value);
    maxImageWidth = Math.ceil(canvasWidth/numTiles); //could be tweaked for custom output dimensions

    speedInputValue = Number(animationSpeedInput.value);
    animationSpeed = 8000/speedInputValue * (numTiles/2.5); //larger value gives slower animation
    console.log("animation speed: "+animationSpeed);
    videoDuration = Math.max(1,Math.min(60,Number(videoDurationInput.value)));
    console.log("video record duration (seconds): "+videoDuration);

}

function changeTiling(){
    getUserInputs();
    resizeImage();
    animation.scrollIntoView({behavior: "smooth", block: "start"});
    createAnimation();
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
        //clearInterval(animationInterval);
        cancelAnimationFrame(animationRequest);
        playAnimationToggle = false;
        console.log("cancel animation");
    }

    loadingScreen.classList.remove("hidden");
    loadingScreen.classList.add("lockOn");

    counter = animationSpeed*0.5; //reset to default animation start point

    //read image file      
    var file = imageInput.files[0];
    var reader = new FileReader();
    reader.onload = (event) => {
        var imageData = event.target.result;
        userImage = new Image();
        userImage.src = imageData;
        userImage.onload = () => {
          
            actualWidth = userImage.width;
            actualHeight = userImage.height;

            resizeImage();

        };
    };
      
    reader.readAsDataURL(file);
    isImageLoaded = true;
    
}

function resizeImage(){
    
    if(isImageLoaded){
        //remove any existing images
        while (imageContainer.firstChild) {
            imageContainer.removeChild(imageContainer.firstChild);
        }

        while (newImageContainer.firstChild) {
            newImageContainer.removeChild(newImageContainer.firstChild);
        }
    }

    //image scaling dimensions
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
    //resize the src variable of the original image
    var newCanvas = document.createElement('canvas');
    newCanvas.width = scaledWidth;
    newCanvas.height = scaledHeight;
    var ctx = newCanvas.getContext('2d');
    ctx.drawImage(userImage, 0, 0, scaledWidth, scaledHeight);

    var resizedImgSrc = newCanvas.toDataURL();

    //draw the resized image onto the page
    var originalImg = document.createElement('img');
    originalImg.setAttribute("id", "originalImg");
    originalImg.src = resizedImgSrc;
    originalImg.width = scaledWidth;
    originalImg.height = scaledHeight;
    imageContainer.appendChild(originalImg);

    setTimeout(generateFlippedImage, 1000); //wait a second for image creation before next function

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
    if(playAnimationToggle == true){
        //clearInterval(animationInterval);
        cancelAnimationFrame(animationRequest);
        playAnimationToggle = false;
        console.log("cancel animation");
    }
    playAnimationToggle = true;

    console.log("create animation");

    //load images
    animationWidth = canvasWidth;
    animationHeight = canvasHeight;
    animation.width = animationWidth;
    animation.height = animationHeight;

    var baseImg = document.getElementById("originalImg");
    var baseRImg = document.getElementById("flippedImg");
    var ctx = animation.getContext("2d", { willReadFrequently: true }); //added willReadFrequently
    var pat = ctx.createPattern(baseImg, "repeat");
    var patR = ctx.createPattern(baseRImg, "repeat");
        
    //height of triangle side given side length of 150 is:
    //patDim = canvasWidth/2;
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
        for(var i=0; patternHeight*i<animationHeight+SqrtOf3_4*patDim; i++){
            for(var j = 0; j*patDim<animationWidth+patDim; j+=3){
            ctx.putImageData(rowData,j*patDim,i*patternHeight);
            }
        }
    }

    function loop(){
        if(playAnimationToggle == true){
            fn(false);
            ctx.translate(animationStep*patDim, height);
            fn(true);
            ctx.translate(animationStep*-1*patDim, -height);
            tile();
        }
        animationRequest = requestAnimationFrame(loop);
    }
    animationRequest = requestAnimationFrame(loop);

}

//HELPER FUNCTIONS BELOW

//start or stop animation
function pausePlayAnimation(){
    if(playAnimationToggle == true){
        playAnimationToggle = false;
        cancelAnimationFrame(animationRequest);
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

//MAIN METHOD
//this runs the default image animation at startup
userImage = document.getElementById("originalImg");
canvasWidthInput.value = window.innerWidth;
canvasHeightInput.value = window.innerHeight;
getUserInputs();
setTimeout(createAnimation, 2000);