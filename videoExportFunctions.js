function chooseRecordingFunction() {
  if(isIOS || isAndroid || isFirefox) {
      startMobileRecording();
  } else {
      recordVideoMuxer();
  }
}

//record html canvas element and export as mp4 video
//source: https://devtails.xyz/adam/how-to-save-html-canvas-to-mp4-using-web-codecs-api
async function recordVideoMuxer() {
  console.log("start muxer video recording");
  var videoWidth = Math.floor(animation.width/2)*2;
  var videoHeight = Math.floor(animation.height/8)*8; //force a number which is divisible by 8
  console.log("Video dimensions: "+videoWidth+", "+videoHeight);

  //hide input table and display user message
  document.getElementById("inputTable").classList.add("hidden");
  recordingMessageCountdown(videoDuration);
  recordingMessageDiv.classList.remove("hidden");
  
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
      width: videoWidth,
      height: videoHeight,
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
    codec: "avc1.42003e",
    width: videoWidth,
    height: videoHeight,
    bitrate: 7_200_000,
    bitrateMode: "constant",
  });
  //NEW codec: "avc1.42003e",
  //ORIGINAL codec: "avc1.42001f",

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
      console.log("finalize muxer video");
      recordVideoState = false;
      clearInterval(videoRecordInterval);
      // Forces all pending encodes to complete
      await videoEncoder.flush();
      muxer.finalize();
      let buffer = muxer.target.buffer;
      finishedBlob = new Blob([buffer]); 
      downloadBlob(new Blob([buffer]));

      //hide user message, show download button
      recordingMessageDiv.classList.add("hidden");
      document.getElementById("inputTable").classList.remove("hidden");

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
}

//record and download videos on mobile devices
function startMobileRecording(){
  
  var stream = animation.captureStream(fps);
  var recorder = new MediaRecorder(stream, { 'type': 'video/mp4' });
  recorder.addEventListener('dataavailable', finishMobileRecording);

  console.log("start simple video recording");
  console.log("Video dimensions: "+animation.width+", "+animation.height);

  //hide input table and display user message
  document.getElementById("inputTable").classList.add("hidden");
  recordingMessageCountdown(videoDuration);
  recordingMessageDiv.classList.remove("hidden");
  
  recorder.start();

  setTimeout(function() {
      recorder.stop();
  }, 1000*videoDuration+200);
}

function finishMobileRecording(e) {
  setTimeout(function(){
      console.log("finish simple video recording");
      var videoData = [ e.data ];
      finishedBlob = new Blob(videoData, { 'type': 'video/mp4' });
      downloadBlob(finishedBlob);
      
      //hide user message, show download button
      recordingMessageDiv.classList.add("hidden");
      document.getElementById("inputTable").classList.remove("hidden");

  },500);

}

function recordingMessageCountdown(duration){
  
  var secondsLeft = Math.ceil(duration);

  var countdownInterval = setInterval(function(){
      secondsLeft--;
      recordingMessageDiv.innerHTML = 
      "Video recording underway. The video will be saved to your downloads folder in <span id=\"secondsLeft\">"+secondsLeft+"</span> seconds.<br><br>This feature can be a bit buggy on Mobile -- if it doesn't work, please try on Desktop instead.";  
      
      if(secondsLeft <= 0){
          console.log("clear countdown interval");
          clearInterval(countdownInterval);
      }
  },1000);
}