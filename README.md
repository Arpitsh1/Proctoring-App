# Proctoring App

A real-time proctoring application built with **React**, **MediaPipe Face Mesh**, and **TensorFlow COCO-SSD** for object detection. It monitors candidate behavior during online exams and provides instant alerts for the interviewer.

---

## Features

- ✅ Face detection and absence monitoring  
- ✅ Look-away detection (triggered after 5 seconds)  
- ✅ Eye closure/drowsiness detection  
- ✅ Object detection: Cell phone, books  
- ✅ Real-time audio detection for suspicious sounds  
- ✅ Instant alerts sent to the interviewer via WebSocket  
- ✅ Video recording of the session  
- ✅ Downloadable CSV report with session logs  

---

## Project Structure

proctoring-app/
├─ frontend/ # React app
│ ├─ public/
│ └─ src/
│ └─ ProctoringApp.jsx
├─ backend/ # Node.js/Express backend
│ ├─ models/
│ │ └─ log.js
│ ├─ routes/
│ │ └─ logs.js
│ └─ server.js
├─ README.md
└─ package.json

---

## Setup

Backend

1. Navigate to backend:

cd backend

2. Install dependencies:

npm install


3. Start the server:

node server.js

Frontend

1. Navigate to frontend:

cd frontend


2. Install dependencies:

npm install


3. Start the React app:

npm start


Usage

1. Open the frontend in your browser (http://localhost:3000).

2. Enter the candidate’s name and start the session.

3. The app will monitor:

Face presence

Look-away behavior

Drowsiness

Phone or book detection

Audio alerts

4.Stop the recording to save the video and download the CSV report.


Technologies Used

React.js

MediaPipe Face Mesh

TensorFlow.js (COCO-SSD)

Node.js + Express

WebSocket for real-time alerts


LICENSE

Copyright (c) 2025 Arpit Sharma

You are free to:

- Use this software for any purpose.
- Copy, modify, merge, publish, or share it.
- Give or sell it to others.

You must:

- Include this notice in all copies or important parts of the software.

I provide this software “as is,” without any warranty. I am not responsible for any problems, damages, or losses caused by using this software.
