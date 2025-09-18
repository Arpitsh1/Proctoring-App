import React, { useRef, useEffect } from "react";

const VideoFeed = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch(err => console.error("Error accessing webcam:", err));
  }, []);

  return (
    <div>
      <video ref={videoRef} width="640" height="480" />
    </div>
  );
};

export default VideoFeed;
