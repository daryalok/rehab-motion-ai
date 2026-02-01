console.log("Therapist dashboard UI loaded");

const videoInput = document.getElementById("videoInput");
const uploadButton = document.getElementById("uploadButton");
const fileName = document.getElementById("fileName");
const dropzone = document.getElementById("dropzone");
const uploadStatus = document.getElementById("uploadStatus");

const API_BASE_URL = "http://localhost:8000";
let isUploading = false;

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

  if (!file.type.startsWith("video/")) {
    fileName.textContent = "Please select a video file";
    uploadStatus.textContent = "Only video files are supported.";
    uploadStatus.className = "upload-status error";
    return;
  }

  fileName.textContent = `Selected: ${file.name}`;
  uploadStatus.textContent = "Ready to upload.";
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
      uploadStatus.textContent = `Upload error: ${error.message}`;
      uploadStatus.className = "upload-status error";
    })
    .finally(() => {
      uploadButton.textContent = "Upload video";
      uploadButton.disabled = false;
      isUploading = false;
      console.log("Upload process finished");
    });
});
