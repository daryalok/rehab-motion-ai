console.log("Analysis result UI loaded");

const API_BASE_URL = "http://localhost:8000";

const video = document.getElementById("analysisVideo");
const canvas = document.getElementById("skeletonCanvas");
const ctx = canvas.getContext("2d");
const durationEl = document.getElementById("videoDuration");

// Load analysis data from sessionStorage
const analysisData = JSON.parse(sessionStorage.getItem('analysisData') || '{}');
console.log("=== ANALYSIS DATA LOADED ===");
console.log("Full data:", analysisData);
console.log("Has key_moments?", !!analysisData.key_moments);
console.log("Key moments count:", analysisData.key_moments?.length || 0);

// Update page with analysis data
if (analysisData.analysis) {
  const resultText = document.querySelector('.result-text');
  const recommendationText = document.querySelector('.recommendation');
  
  if (resultText) {
    resultText.textContent = analysisData.analysis.message;
  }
  
  if (recommendationText) {
    recommendationText.textContent = analysisData.analysis.recommendation;
  }
  
  // Display metrics if available
  if (analysisData.analysis.metrics) {
    const metrics = analysisData.analysis.metrics;
    
    document.getElementById('metricHipShift').textContent = 
      (metrics.avg_hip_shift * 100).toFixed(1) + '%';
    document.getElementById('metricMaxHipShift').textContent = 
      (metrics.max_hip_shift * 100).toFixed(1) + '%';
    document.getElementById('metricKneeAsymmetry').textContent = 
      (metrics.avg_knee_asymmetry * 100).toFixed(1) + '%';
    document.getElementById('metricMaxAsymmetry').textContent = 
      (metrics.max_knee_asymmetry * 100).toFixed(1) + '%';
  }
}

// Load and display key moments
console.log("=== KEY MOMENTS SECTION ===");
console.log("Checking key_moments:", analysisData.key_moments);

if (analysisData.key_moments && analysisData.key_moments.length > 0) {
  console.log('✓ Loading key moments:', analysisData.key_moments);
  
  const grid = document.getElementById('keyMomentsGrid');
  
  if (grid) {
    grid.innerHTML = '';
    
    analysisData.key_moments.forEach((moment, index) => {
      console.log(`Creating card for moment ${index}:`, moment);
      
      const card = document.createElement('div');
      card.className = 'moment-card';
      
      const imageUrl = `${API_BASE_URL}/image/${moment.image}`;
      console.log(`Image URL: ${imageUrl}`);
      
      card.innerHTML = `
        <img src="${imageUrl}" alt="${moment.label}" class="moment-image" 
             onerror="console.error('Failed to load image:', '${imageUrl}'); this.style.display='none';"
             onload="console.log('✓ Image loaded:', '${moment.image}')">
        <div class="moment-info">
          <div class="moment-label">${moment.label}</div>
        </div>
      `;
      
      grid.appendChild(card);
    });
    
    console.log(`✓ Created ${analysisData.key_moments.length} moment cards`);
  } else {
    console.error("✗ keyMomentsGrid element not found!");
  }
} else {
  console.warn("✗ No key moments available in data");
  
  const grid = document.getElementById('keyMomentsGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="moment-placeholder">
        <div class="moment-image-placeholder"></div>
        <div class="moment-label">No key moments available</div>
        <div style="font-size: 0.85rem; color: #6b7280; margin-top: 0.5rem;">
          Upload a new video to generate key moment frames.
        </div>
      </div>
    `;
  }
}

// Update video source if available
if (analysisData.saved_as) {
  console.log("Loading video:", analysisData.saved_as);
  const videoUrl = `http://localhost:8000/video/${analysisData.saved_as}`;
  video.src = videoUrl;
  console.log("Video URL set to:", videoUrl);
} else {
  console.warn("No video file available, using demo video");
  video.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
}

// Load keypoints from backend (real AI analysis)
let keypointsData = [];

// Load real keypoints if available
if (analysisData.keypoints_file) {
  console.log("Loading real keypoints:", analysisData.keypoints_file);
  fetch(`${API_BASE_URL}/keypoints/${analysisData.keypoints_file}`)
    .then(res => res.json())
    .then(data => {
      keypointsData = data;
      console.log(`✓ Loaded ${keypointsData.length} keypoint frames from AI analysis`);
    })
    .catch(err => {
      console.error("Failed to load keypoints, using mock data:", err);
      keypointsData = generateMockKeypoints();
    });
} else {
  console.warn("No keypoints file available, using mock data");
  keypointsData = generateMockKeypoints();
}

function generateMockKeypoints() {
  const data = [];
  const fps = 30;
  const duration = 24; // seconds
  const totalFrames = fps * duration;
  
  for (let frame = 0; frame < totalFrames; frame++) {
    const t = frame / totalFrames;
    
    // Simulate squat motion with compensation
    const squatPhase = Math.sin(t * Math.PI * 6); // 6 reps
    const compensation = 0.05 * Math.sin(t * Math.PI * 6); // shift to left
    
    data.push({
      time: t * duration,
      keypoints: [
        // Head
        { x: 0.5 + compensation, y: 0.15, name: "head" },
        // Shoulders
        { x: 0.45 + compensation, y: 0.25, name: "left_shoulder" },
        { x: 0.55 + compensation, y: 0.25, name: "right_shoulder" },
        // Hips (compensation visible here)
        { x: 0.43 + compensation * 2, y: 0.5 + squatPhase * 0.1, name: "left_hip" },
        { x: 0.57 + compensation * 0.5, y: 0.5 + squatPhase * 0.15, name: "right_hip" },
        // Knees (asymmetry)
        { x: 0.42 + compensation * 2, y: 0.65 + squatPhase * 0.15, name: "left_knee" },
        { x: 0.58 + compensation * 0.5, y: 0.65 + squatPhase * 0.1, name: "right_knee" },
        // Ankles
        { x: 0.42 + compensation * 1.5, y: 0.85, name: "left_ankle" },
        { x: 0.58 + compensation * 0.3, y: 0.85, name: "right_ankle" }
      ]
    });
  }
  
  return data;
}

function resizeCanvas() {
  const rect = video.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

function drawSkeleton(keypoints) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!keypoints || keypoints.length === 0) return;
  
  const w = canvas.width;
  const h = canvas.height;
  
  // Convert normalized coordinates to canvas pixels
  const points = {};
  keypoints.forEach(kp => {
    points[kp.name] = {
      x: kp.x * w,
      y: kp.y * h
    };
  });
  
  // Draw skeleton connections
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  
  const connections = [
    ["head", "left_shoulder"],
    ["head", "right_shoulder"],
    ["left_shoulder", "right_shoulder"],
    ["left_shoulder", "left_hip"],
    ["right_shoulder", "right_hip"],
    ["left_hip", "right_hip"],
    ["left_hip", "left_knee"],
    ["right_hip", "right_knee"],
    ["left_knee", "left_ankle"],
    ["right_knee", "right_ankle"]
  ];
  
  connections.forEach(([start, end]) => {
    if (points[start] && points[end]) {
      ctx.beginPath();
      ctx.moveTo(points[start].x, points[start].y);
      ctx.lineTo(points[end].x, points[end].y);
      ctx.stroke();
    }
  });
  
  // Draw keypoints
  keypoints.forEach(kp => {
    const px = kp.x * w;
    const py = kp.y * h;
    
    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight compensation (right knee - injured)
    if (kp.name === "right_knee") {
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  
  // Draw angle indicator at 32° detection point
  if (video.currentTime > 8 && video.currentTime < 12) {
    ctx.fillStyle = "rgba(255, 68, 68, 0.9)";
    ctx.font = "14px 'Inter', sans-serif";
    ctx.fillText("⚠ Compensation at 32°", 20, 30);
  }
}

video.addEventListener("loadedmetadata", () => {
  const mins = Math.floor(video.duration / 60);
  const secs = Math.floor(video.duration % 60);
  durationEl.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  
  resizeCanvas();
});

video.addEventListener("timeupdate", () => {
  const currentTime = video.currentTime;
  
  if (!keypointsData || keypointsData.length === 0) {
    return;
  }
  
  // Find nearest keypoints frame
  const frame = keypointsData.find(
    (f, i) => {
      const next = keypointsData[i + 1];
      const frameTime = f.time || 0;
      const nextTime = next ? (next.time || 0) : Infinity;
      return currentTime >= frameTime && currentTime < nextTime;
    }
  );
  
  if (frame && frame.keypoints) {
    drawSkeleton(frame.keypoints);
  }
});

video.addEventListener("play", () => {
  resizeCanvas();
});

video.addEventListener("pause", () => {
  // Keep skeleton visible when paused
});

window.addEventListener("resize", resizeCanvas);

// Initial render
resizeCanvas();

// ========================================
// Activity Tracker
// ========================================

function generateActivityTracker() {
  console.log("=== GENERATING ACTIVITY TRACKER ===");
  
  const activityGrid = document.getElementById("activityGrid");
  if (!activityGrid) {
    console.error("Activity grid element not found");
    return;
  }
  
  // Generate mock data for last 30 days
  const today = new Date();
  const activityData = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Mock data: random completion with ~70% completion rate
    // Higher probability of completion in recent days
    const isCompleted = i === 0 ? true : Math.random() < (0.6 + (30 - i) * 0.01);
    
    activityData.push({
      date: date,
      completed: isCompleted,
      isToday: i === 0
    });
  }
  
  // Render activity days
  activityGrid.innerHTML = '';
  
  activityData.forEach((day) => {
    const dayElement = document.createElement('div');
    dayElement.className = 'activity-day';
    
    if (day.isToday) {
      dayElement.classList.add('today');
    } else if (day.completed) {
      dayElement.classList.add('completed');
    } else {
      dayElement.classList.add('missed');
    }
    
    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'activity-day-tooltip';
    const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    tooltip.textContent = `${dateStr}: ${day.isToday ? 'Today' : day.completed ? 'Completed' : 'Missed'}`;
    
    dayElement.appendChild(tooltip);
    activityGrid.appendChild(dayElement);
  });
  
  // Calculate stats
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let completedDays = 0;
  
  // Calculate current streak (from today backwards)
  for (let i = activityData.length - 1; i >= 0; i--) {
    if (activityData[i].completed) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate longest streak and completion rate
  activityData.forEach((day) => {
    if (day.completed) {
      completedDays++;
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });
  
  const completionRate = Math.round((completedDays / activityData.length) * 100);
  
  // Update stats display
  document.getElementById('currentStreak').textContent = currentStreak;
  document.getElementById('longestStreak').textContent = longestStreak;
  document.getElementById('completionRate').textContent = `${completionRate}%`;
  
  console.log(`✓ Activity tracker generated`);
  console.log(`Current streak: ${currentStreak}, Longest: ${longestStreak}, Rate: ${completionRate}%`);
}

// Generate tracker on page load
generateActivityTracker();
