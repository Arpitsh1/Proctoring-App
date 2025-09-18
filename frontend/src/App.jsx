import React, { useEffect, useRef, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { FaceMesh } from "@mediapipe/face_mesh";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

export default function ProctoringApp() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const lastFaceTime = useRef(Date.now());
  const lastForwardTime = useRef(Date.now());
  const lookingAway = useRef(false);
  const modelRef = useRef(null);
  const sessionStartTime = useRef(Date.now());

  const [alerts, setAlerts] = useState([]);
  const [recording, setRecording] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [logEvents, setLogEvents] = useState({
    absence: 0,
    lookingAway: 0,
    phone: 0,
    book: 0,
    drowsiness: 0,
    audio: 0, // 🔹 added
  });

  // 🔹 WebSocket
  const ws = useRef(null);
  useEffect(() => {
    function connectWS() {
      ws.current = new WebSocket("ws://localhost:5000");
      ws.current.onopen = () => console.log("✅ Connected to backend WebSocket");
      ws.current.onclose = () => {
        console.log("❌ WebSocket closed. Reconnecting in 3s...");
        setTimeout(connectWS, 3000);
      };
      ws.current.onerror = (err) => {
        console.error("⚠️ WebSocket error:", err);
        ws.current.close();
      };
    }
    connectWS();
    return () => ws.current?.close();
  }, []);

  function sendLogToBackend(data) {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      console.log("📤 Sent to backend:", data);
    }
  }

  function addAlert(msg) {
    setAlerts((prev) => [...prev, msg].slice(-5));
  }

  const logEvent = (type) => {
    setLogEvents((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    addAlert(`⚠️ ${type} detected!`);

    // 🔹 Send instant alerts for interviewer
    sendLogToBackend({
      candidateName,
      type,
      timestamp: new Date().toISOString(),
      event: "ALERT",
    });
  };

  // 🔹 Final report
  const buildFinalReport = () => {
    const duration = ((Date.now() - sessionStartTime.current) / 1000).toFixed(1);
    let deductions =
      logEvents.absence * 5 +
      logEvents.lookingAway * 2 +
      logEvents.phone * 5 +
      logEvents.book * 5 +
      logEvents.drowsiness * 5 +
      logEvents.audio * 5; // 🔹 penalty for audio
    const integrityScore = Math.max(0, 100 - deductions);

    return {
      candidateName,
      duration,
      logEvents,
      integrityScore,
      timestamp: new Date().toISOString(),
    };
  };

  useEffect(() => {
    let camera;

    // 🔹 Eye aspect ratio calculation for drowsiness
    const EAR_THRESHOLD = 0.25;
    const EAR_CONSEC_FRAMES = 10;
    let earCounter = 0;

    function getEAR(landmarks, eyeIdx) {
      const p2 = landmarks[eyeIdx[1]];
      const p6 = landmarks[eyeIdx[5]];
      const p3 = landmarks[eyeIdx[2]];
      const p5 = landmarks[eyeIdx[4]];
      const p1 = landmarks[eyeIdx[0]];
      const p4 = landmarks[eyeIdx[3]];
      const vertical1 = Math.hypot(p2.x - p6.x, p2.y - p6.y);
      const vertical2 = Math.hypot(p3.x - p5.x, p3.y - p5.y);
      const horizontal = Math.hypot(p1.x - p4.x, p1.y - p4.y);
      return (vertical1 + vertical2) / (2.0 * horizontal);
    }

    const onFaceResults = (results) => {
      const now = Date.now();
      if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
        if (now - lastFaceTime.current > 10000) {
          logEvent("absence");
          lastFaceTime.current = now;
        }
        return;
      }

      lastFaceTime.current = now;
      const landmarks = results.multiFaceLandmarks[0];

      // 🔹 Drowsiness detection
      const leftEyeIdx = [33, 160, 158, 133, 153, 144];
      const rightEyeIdx = [362, 385, 387, 263, 373, 380];
      const leftEAR = getEAR(landmarks, leftEyeIdx);
      const rightEAR = getEAR(landmarks, rightEyeIdx);
      const avgEAR = (leftEAR + rightEAR) / 2.0;

      if (avgEAR < EAR_THRESHOLD) {
        earCounter += 1;
        if (earCounter >= EAR_CONSEC_FRAMES) {
          logEvent("drowsiness");
          earCounter = 0;
        }
      } else earCounter = 0;

      // 🔹 Looking away detection
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const dx = rightEye.x - leftEye.x;
      const dz = rightEye.z - leftEye.z;
      const yaw = Math.atan2(dz, dx);
      const threshold = 0.35;
      if (Math.abs(yaw) > threshold) {
        if (!lookingAway.current && now - lastForwardTime.current > 5000) {
          logEvent("lookingAway");
          lookingAway.current = true;
        }
      } else {
        lastForwardTime.current = now;
        lookingAway.current = false;
      }
    };

    const runObjectDetection = async () => {
      if (!modelRef.current || !videoRef.current) return;
      const predictions = await modelRef.current.detect(videoRef.current);
      predictions.forEach((p) => {
        const { class: label, score } = p;
        if (score > 0.7) {
          if (label === "cell phone") logEvent("phone");
          if (label === "book") logEvent("book");
        }
      });
    };

    const init = async () => {
      modelRef.current = await cocoSsd.load();
      addAlert("✅ COCO-SSD loaded");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await new Promise((resolve) => (videoRef.current.onloadedmetadata = resolve));
      await videoRef.current.play();

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        recordedChunksRef.current = [];
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "candidate_recording.webm";
        a.click();
        URL.revokeObjectURL(url);
        addAlert("✅ Video saved!");
      };

      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      faceMesh.onResults(onFaceResults);

      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current });
          await runObjectDetection();
        },
        width: 640,
        height: 480,
      });
      camera.start();

      // 🔹 Audio detection
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);
        source.connect(analyser);
        analyser.fftSize = 2048;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudio = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const val = (dataArray[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          if (rms > 0.08) logEvent("audio"); // 🔹 adjust sensitivity
          requestAnimationFrame(checkAudio);
        };
        checkAudio();
      } catch (err) {
        console.warn("⚠️ Audio detection not allowed:", err);
      }
    };

    init();
    return () => camera?.stop();
  }, []);

  const startRecording = () => {
    if (!candidateName) return alert("Enter candidate name first!");
    mediaRecorderRef.current?.start();
    setRecording(true);
    addAlert("🔴 Recording started");
    sessionStartTime.current = Date.now();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    addAlert("🛑 Recording stopped");

    const report = buildFinalReport();
    sendLogToBackend(report);
  };

  const downloadReport = () => {
    const report = buildFinalReport();

    const headers = [
      "Candidate Name",
      "Interview Duration (sec)",
      "No. of times face absent",
      "No. of times looking away",
      "Phone detections",
      "Book detections",
      "Drowsiness detections",
      "Audio detections", // 🔹 added
      "Integrity Score",
    ];
    const values = [
      report.candidateName,
      report.duration,
      report.logEvents.absence,
      report.logEvents.lookingAway,
      report.logEvents.phone,
      report.logEvents.book,
      report.logEvents.drowsiness,
      report.logEvents.audio, // 🔹 added
      report.integrityScore,
    ];

    const csvContent = [headers.join(","), values.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "proctoring_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    addAlert("📄 CSV Report downloaded!");

    sendLogToBackend(report);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>Proctoring App</h2>

      <input
        type="text"
        placeholder="Enter Candidate Name"
        value={candidateName}
        onChange={(e) => setCandidateName(e.target.value)}
        style={{ marginBottom: "10px", padding: "5px" }}
      />

      <video
        ref={videoRef}
        autoPlay
        playsInline
        width="640"
        height="480"
        style={{ border: "2px solid black", borderRadius: "8px" }}
      />

      <div style={{ marginTop: "10px" }}>
        {!recording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
        <button onClick={downloadReport} style={{ marginLeft: "10px" }}>
          Download CSV Report
        </button>
      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#111",
          color: "white",
          width: "640px",
          margin: "20px auto",
          borderRadius: "8px",
          textAlign: "left",
        }}
      >
        <h3>Alerts</h3>
        <ul>{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
      </div>
    </div>
  );
}
