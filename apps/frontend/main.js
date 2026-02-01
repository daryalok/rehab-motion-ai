console.log("Therapist dashboard UI loaded");

const videoInput = document.getElementById("videoInput");
const uploadButton = document.getElementById("uploadButton");
const fileName = document.getElementById("fileName");
const dropzone = document.getElementById("dropzone");
const uploadStatus = document.getElementById("uploadStatus");

const API_BASE_URL = "http://localhost:8000";
let isUploading = false;

// File validation
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi'];
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

function validateFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected" };
  }
  
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Please upload MP4, MOV, or AVI video. You uploaded: ${file.type || 'unknown type'}` 
    };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `File is too large (${sizeMB}MB). Maximum size is 200MB.` 
    };
  }
  
  return { valid: true };
}

// Progress bar functions
const updateProgress = (percent, statusText) => {
  const progressContainer = document.getElementById("progressContainer");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const uploadStatus = document.getElementById("uploadStatus");
  
  progressContainer.style.display = "flex";
  progressFill.style.width = `${percent}%`;
  progressText.textContent = `${Math.round(percent)}%`;
  
  if (statusText) {
    uploadStatus.textContent = statusText;
  }
};

const hideProgress = () => {
  const progressContainer = document.getElementById("progressContainer");
  progressContainer.style.display = "none";
};

const simulateAnalysisProgress = (startPercent, endPercent, durationMs) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const currentPercent = startPercent + (endPercent - startPercent) * progress;
      
      updateProgress(currentPercent, "Analyzing video with AI...");
      
      if (progress >= 1) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
};

const setSelectedFile = (file) => {
  if (!file) {
    fileName.textContent = "No file selected";
    uploadStatus.textContent = "Connect to the API and upload the selected file.";
    uploadStatus.className = "upload-status";
    return;
  }

  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    fileName.textContent = "Invalid file";
    uploadStatus.textContent = `⚠️ ${validation.error}`;
    uploadStatus.className = "upload-status error";
    return;
  }

  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  fileName.textContent = `Selected: ${file.name} (${sizeMB}MB)`;
  uploadStatus.textContent = "✓ File validated. Ready to upload.";
  uploadStatus.className = "upload-status";
};

videoInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  setSelectedFile(file);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("active");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("active");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("active");
  const [file] = event.dataTransfer.files;
  if (file) {
    videoInput.files = event.dataTransfer.files;
    setSelectedFile(file);
  }
});

uploadButton.addEventListener("click", () => {
  console.log("=== UPLOAD BUTTON CLICKED ===");
  
  if (isUploading) {
    console.log("Already uploading, ignoring click");
    return;
  }

  const [file] = videoInput.files;
  console.log("Selected file:", file);
  
  if (!file) {
    console.log("No file selected, opening file picker");
    videoInput.click();
    return;
  }

  console.log(`File details:
    Name: ${file.name}
    Type: ${file.type}
    Size: ${file.size} bytes (${(file.size / (1024*1024)).toFixed(2)} MB)
  `);

  isUploading = true;
  uploadButton.disabled = true;
  uploadButton.textContent = "Uploading...";
  uploadStatus.textContent = "Uploading to server...";
  uploadStatus.className = "upload-status";

  // Reset and show initial progress
  hideProgress();
  setTimeout(() => updateProgress(0, "Uploading to server..."), 10);

  const formData = new FormData();
  formData.append("file", file);
  
  console.log("FormData created, sending to:", `${API_BASE_URL}/upload`);

  // Simulate upload progress
  const uploadProgressInterval = setInterval(() => {
    const currentWidth = parseFloat(document.getElementById("progressFill").style.width) || 0;
    if (currentWidth < 30) {
      updateProgress(currentWidth + 3, "Uploading to server...");
    }
  }, 200);

  fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      clearInterval(uploadProgressInterval);
      updateProgress(30, "Upload complete, starting analysis...");
      
      // Start analysis progress simulation
      simulateAnalysisProgress(30, 90, 3000);
      
      console.log("Response received:", response.status, response.statusText);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("Upload failed:", error);
        throw new Error(error.detail || "Upload failed");
      }
      return response.json();
    })
    .then((data) => {
      console.log("✓ Upload successful, response data:", data);
      
      // Complete progress to 100%
      updateProgress(100, "✓ Analysis complete!");
      
      uploadStatus.textContent = `✓ Uploaded and analyzed: ${data.filename}`;
      uploadStatus.className = "upload-status success";
      
      // Show analysis result
      if (data.analysis) {
        console.log("Analysis result:", data.analysis);
        
        const analysisInfo = document.createElement("div");
        analysisInfo.className = "analysis-result";
        analysisInfo.innerHTML = `
          <strong>Analysis Result:</strong><br>
          ${data.analysis.message}<br>
          <em>${data.analysis.recommendation}</em><br><br>
          Redirecting to detailed analysis...
        `;
        uploadStatus.appendChild(analysisInfo);
        
        console.log("Analysis result displayed in UI");
        
        // Save analysis data to sessionStorage for result page
        console.log("=== SAVING TO SESSION STORAGE ===");
        console.log("Data to save:", data);
        console.log("Key moments in data:", data.key_moments);
        
        sessionStorage.setItem('analysisData', JSON.stringify(data));
        
        // Verify saved
        const saved = sessionStorage.getItem('analysisData');
        console.log("✓ Saved to sessionStorage, length:", saved?.length);
        
        // Redirect to result page after 2 seconds
        setTimeout(() => {
          console.log("Redirecting to result.html");
          window.location.href = 'result.html';
        }, 2000);
      } else {
        console.warn("No analysis data in response");
      }
      
      setSelectedFile(null);
      videoInput.value = "";
      console.log("=== UPLOAD COMPLETE ===");
    })
    .catch((error) => {
      console.error("Upload error:", error);
      clearInterval(uploadProgressInterval);
      hideProgress();
      
      // Better error messages for common issues
      let errorMessage = error.message;
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        errorMessage = "⚠️ Backend server is not running. Please start the server and try again.";
      } else if (error.message.includes("413")) {
        errorMessage = "⚠️ File is too large. Please upload a video smaller than 100MB.";
      } else if (error.message.includes("415")) {
        errorMessage = "⚠️ Invalid file type. Please upload an MP4, AVI, or MOV video.";
      } else {
        errorMessage = `⚠️ ${error.message}`;
      }
      
      uploadStatus.textContent = errorMessage;
      uploadStatus.className = "upload-status error";
    })
    .finally(() => {
      uploadButton.textContent = "Upload video";
      uploadButton.disabled = false;
      isUploading = false;
      console.log("Upload process finished");
    });
});
