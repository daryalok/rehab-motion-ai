console.log("Therapist dashboard UI loaded");

const videoInput = document.getElementById("videoInput");
const uploadButton = document.getElementById("uploadButton");
const fileName = document.getElementById("fileName");
const dropzone = document.getElementById("dropzone");
const uploadStatus = document.getElementById("uploadStatus");

const API_BASE_URL = "http://localhost:8000";
let isUploading = false;

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
  if (isUploading) {
    return;
  }

  const [file] = videoInput.files;
  if (!file) {
    videoInput.click();
    return;
  }

  isUploading = true;
  uploadButton.disabled = true;
  uploadButton.textContent = "Uploading...";
  uploadStatus.textContent = "Uploading to server...";
  uploadStatus.className = "upload-status";

  const formData = new FormData();
  formData.append("file", file);

  fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Upload failed");
      }
      return response.json();
    })
    .then((data) => {
      uploadStatus.textContent = `Uploaded: ${data.filename} (${data.size_bytes} bytes)`;
      uploadStatus.className = "upload-status success";
      setSelectedFile(null);
      videoInput.value = "";
    })
    .catch((error) => {
      uploadStatus.textContent = `Upload error: ${error.message}`;
      uploadStatus.className = "upload-status error";
    })
    .finally(() => {
      uploadButton.textContent = "Upload video";
      uploadButton.disabled = false;
      isUploading = false;
    });
});
