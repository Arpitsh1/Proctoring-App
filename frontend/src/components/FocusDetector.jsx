import React, { useEffect, useRef, useState } from "react";
import * as faceMesh from "@mediapipe/face_mesh";
import { Camera } from "@mediapipe/camera_utils";

const FocusDetector = () => {
  const videoRef = useRef(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const faceMeshModel = new faceMesh.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMeshModel.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMeshModel.onResults(results => {
      if (!results.multiFaceLandmarks.length) {
        setEvents(prev => [...prev, { type: "No Face", timestamp: Date.now() }]);
      } else {
        // Optional: check gaze direction here for looking away
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => { await faceMeshModel.send({ image: videoRef.current }); },
      width: 640,
      height: 480
    });
    camera.start();
  }, []);

  return (
    <div>
      <video ref={videoRef} width="640" height="480" style={{ display: "none" }} />
      <div>
        <h3>Focus Events:</h3>
        <ul>
          {events.map((e, i) => <li key={i}>{e.type} at {new Date(e.timestamp).toLocaleTimeString()}</li>)}
        </ul>
      </div>
    </div>
  );
};

export default FocusDetector;
