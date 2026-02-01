console.log("Analysis result UI loaded");

const API_BASE_URL = "http://localhost:8000";

const video = document.getElementById("analysisVideo");
// Canvas skeleton overlay removed - skeleton now on key moment images only
// const canvas = document.getElementById("skeletonCanvas");
// const ctx = canvas.getContext("2d");
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
    
    // Determine and log compensation severity
    const hipShift = metrics.avg_hip_shift || 0;
    const kneeAsymmetry = metrics.avg_knee_asymmetry || 0;
    const maxCompensation = Math.max(hipShift, kneeAsymmetry);
    
    let severity = 'OK';
    if (maxCompensation > 0.02) severity = 'Problem';
    else if (maxCompensation > 0.01) severity = 'Attention';
    
    console.log(`Compensation severity: ${severity} (hip: ${(hipShift * 100).toFixed(1)}%, knee: ${(kneeAsymmetry * 100).toFixed(1)}%)`);
    console.log(`Color coding: Left side (compensating) will be ${severity === 'Problem' ? 'RED' : severity === 'Attention' ? 'YELLOW' : 'GREEN'}`);
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

// Canvas skeleton overlay removed - skeleton now visible only on key moment screenshots below
// All skeleton rendering code removed (was drawSkeleton, resizeCanvas, generateMockKeypoints)

video.addEventListener("loadedmetadata", () => {
  const mins = Math.floor(video.duration / 60);
  const secs = Math.floor(video.duration % 60);
  durationEl.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
});

// All canvas/skeleton rendering event listeners removed
// Skeleton is now only visible on key moment screenshots below the video

// ========================================
// Activity Tracker
// ========================================

// LocalStorage key for activity data
const ACTIVITY_STORAGE_KEY = 'rehab_activity_data';

// Get stored activity data or generate mock data
function getActivityData() {
  const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
  
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log("Loaded activity data from localStorage:", parsed);
      return parsed;
    } catch (e) {
      console.error("Error parsing stored activity data:", e);
    }
  }
  
  // Generate mock data for first-time users
  console.log("Generating initial mock activity data");
  const mockData = {};
  const today = new Date();
  
  for (let i = 29; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    
    // Mock data: random completion with ~70% completion rate
    mockData[dateKey] = Math.random() < 0.7;
  }
  
  // Today starts as incomplete
  const todayKey = today.toISOString().split('T')[0];
  mockData[todayKey] = false;
  
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(mockData));
  return mockData;
}

// Save activity data
function saveActivityData(data) {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(data));
  console.log("Activity data saved to localStorage");
}

// Mark today as completed
function markTodayCompleted() {
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  
  console.log(`=== MARKING TODAY AS COMPLETED ===`);
  console.log(`Today key: ${todayKey}`);
  
  const activityData = getActivityData();
  console.log(`Activity data before:`, activityData[todayKey]);
  
  activityData[todayKey] = true;
  saveActivityData(activityData);
  
  console.log(`Activity data after:`, activityData[todayKey]);
  console.log(`✓ Marked ${todayKey} as completed`);
  
  // Regenerate tracker
  generateActivityTracker();
  
  // Update button state
  updateMarkCompleteButton();
  
  // Show success feedback
  showCompletionFeedback();
}

// Update button state based on today's completion
function updateMarkCompleteButton() {
  const btn = document.getElementById('markCompleteBtn');
  if (!btn) return;
  
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const activityData = getActivityData();
  
  if (activityData[todayKey]) {
    btn.textContent = '✓ Completed today';
    btn.classList.add('completed');
    btn.disabled = false;
  } else {
    btn.textContent = '✓ Mark today as completed';
    btn.classList.remove('completed');
    btn.disabled = false;
  }
}

// Show success feedback
function showCompletionFeedback() {
  const btn = document.getElementById('markCompleteBtn');
  if (!btn) return;
  
  const originalText = btn.textContent;
  btn.textContent = '✓ Great job!';
  btn.style.background = '#059669';
  
  setTimeout(() => {
    btn.textContent = '✓ Completed today';
  }, 2000);
}

function generateActivityTracker() {
  console.log("=== GENERATING ACTIVITY TRACKER ===");
  
  const activityGrid = document.getElementById("activityGrid");
  if (!activityGrid) {
    console.error("Activity grid element not found");
    return;
  }
  
  // Get activity data from localStorage
  const storedData = getActivityData();
  console.log("Loaded activity data:", storedData);
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const activityData = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const isToday = i === 0;
    const completed = storedData[dateKey] || false;
    
    activityData.push({
      date: date,
      completed: completed,
      isToday: isToday
    });
    
    if (isToday) {
      console.log(`Today (${dateKey}): completed=${completed}, stored value=${storedData[dateKey]}`);
    }
  }
  
  // Render activity days
  activityGrid.innerHTML = '';
  
  activityData.forEach((day) => {
    const dayElement = document.createElement('div');
    dayElement.className = 'activity-day';
    
    // Apply classes based on day status
    if (day.isToday && day.completed) {
      // Today AND completed - show both
      dayElement.classList.add('today');
      dayElement.classList.add('completed');
    } else if (day.isToday) {
      // Today but not completed yet
      dayElement.classList.add('today');
    } else if (day.completed) {
      // Past day completed
      dayElement.classList.add('completed');
    } else {
      // Past day missed
      dayElement.classList.add('missed');
    }
    
    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'activity-day-tooltip';
    const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    tooltip.textContent = `${dateStr}: ${day.isToday && day.completed ? 'Today (Completed)' : day.isToday ? 'Today' : day.completed ? 'Completed' : 'Missed'}`;
    
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
      // Stop counting streak if we hit a missed day
      break;
    }
  }
  
  console.log(`Current streak calculation: checked ${activityData.length} days, streak = ${currentStreak}`);
  
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

// Update button state on page load
updateMarkCompleteButton();

// Add click handler for mark complete button
const markCompleteBtn = document.getElementById('markCompleteBtn');
if (markCompleteBtn) {
  markCompleteBtn.addEventListener('click', () => {
    console.log("Mark complete button clicked");
    markTodayCompleted();
  });
}
