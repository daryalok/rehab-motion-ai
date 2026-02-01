from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import shutil
from datetime import datetime
import logging
import json
from .video_analyzer_v2 import VideoAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="InsideMotion API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
logger.info(f"Upload directory: {UPLOAD_DIR.absolute()}")

# Initialize video analyzer
video_analyzer = VideoAnalyzer()
logger.info("VideoAnalyzer initialized")

# Frontend static files
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"
logger.info(f"Frontend directory: {FRONTEND_DIR.absolute()}")

# Mount static files (CSS, JS, images)
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


# Serve frontend HTML pages
@app.get("/", response_class=HTMLResponse)
def serve_index():
    """Serve the main upload page"""
    index_path = FRONTEND_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend not found")
    return FileResponse(index_path)


@app.get("/result.html", response_class=HTMLResponse)
def serve_result():
    """Serve the result page"""
    result_path = FRONTEND_DIR / "result.html"
    if not result_path.exists():
        raise HTTPException(status_code=404, detail="Result page not found")
    return FileResponse(result_path)


@app.get("/blog.html", response_class=HTMLResponse)
def serve_blog():
    """Serve the blog index page"""
    blog_path = FRONTEND_DIR / "blog.html"
    if not blog_path.exists():
        raise HTTPException(status_code=404, detail="Blog page not found")
    return FileResponse(blog_path)


@app.get("/blog-acl.html", response_class=HTMLResponse)
def serve_blog_acl():
    """Serve the ACL blog article"""
    blog_acl_path = FRONTEND_DIR / "blog-acl.html"
    if not blog_acl_path.exists():
        raise HTTPException(status_code=404, detail="Blog article not found")
    return FileResponse(blog_acl_path)


@app.get("/blog-stoic.html", response_class=HTMLResponse)
def serve_blog_stoic():
    """Serve the Stoic blog article"""
    blog_stoic_path = FRONTEND_DIR / "blog-stoic.html"
    if not blog_stoic_path.exists():
        raise HTTPException(status_code=404, detail="Blog article not found")
    return FileResponse(blog_stoic_path)


@app.get("/health")
def health_check() -> dict:
    logger.info("Health check called")
    return {"status": "ok"}


@app.get("/video/{filename}")
async def get_video(filename: str):
    """Serve uploaded video files"""
    logger.info(f"Video request for: {filename}")
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        logger.error(f"Video not found: {filename}")
        raise HTTPException(status_code=404, detail="Video not found")
    
    logger.info(f"Serving video: {filename}")
    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=filename
    )


@app.get("/keypoints/{filename}")
async def get_keypoints(filename: str):
    """Serve keypoints JSON files"""
    logger.info(f"Keypoints request for: {filename}")
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        logger.error(f"Keypoints file not found: {filename}")
        raise HTTPException(status_code=404, detail="Keypoints file not found")
    
    logger.info(f"Serving keypoints: {filename}")
    return FileResponse(
        path=file_path,
        media_type="application/json",
        filename=filename
    )


@app.get("/image/{filename}")
async def get_image(filename: str):
    """Serve key moment PNG images"""
    logger.info(f"Image request for: {filename}")
    
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        logger.error(f"Image not found: {filename}")
        raise HTTPException(status_code=404, detail="Image not found")
    
    logger.info(f"Serving image: {filename}")
    return FileResponse(
        path=file_path,
        media_type="image/png",
        filename=filename
    )


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)) -> dict:
    logger.info(f"=== UPLOAD REQUEST RECEIVED ===")
    logger.info(f"Filename: {file.filename}")
    logger.info(f"Content-Type: {file.content_type}")
    
    # Validate content type
    if not file.content_type or not file.content_type.startswith("video/"):
        logger.error(f"Invalid content type: {file.content_type}")
        raise HTTPException(status_code=400, detail="Only video files are allowed")
    
    logger.info("Content type validation passed")

    # Read file content
    logger.info("Reading file content...")
    content = await file.read()
    file_size = len(content)
    logger.info(f"File size: {file_size} bytes ({file_size / (1024*1024):.2f} MB)")
    
    if file_size == 0:
        logger.error("Empty file received")
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Check file size (200MB max)
    max_size = 200 * 1024 * 1024  # 200MB in bytes
    if file_size > max_size:
        logger.error(f"File too large: {file_size} bytes > {max_size} bytes")
        raise HTTPException(status_code=400, detail="File too large (max 200MB)")
    
    logger.info("File size validation passed")

    # Save file with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / safe_filename
    
    logger.info(f"Saving file to: {file_path}")
    
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"✓ File saved successfully: {safe_filename}")
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Run AI analysis with MediaPipe
    logger.info("Starting AI video analysis...")
    key_moments = []
    try:
        analysis_data = video_analyzer.analyze_video(file_path)
        analysis_result = analysis_data["analysis"]
        keypoints_data = analysis_data["keypoints_data"]
        key_moments = analysis_data.get("key_moments", [])
        
        # Save keypoints to JSON file
        keypoints_file = file_path.with_suffix('.keypoints.json')
        with open(keypoints_file, 'w') as f:
            json.dump(keypoints_data, f)
        logger.info(f"✓ Keypoints saved to: {keypoints_file.name}")
        
        logger.info(f"✓ Analysis complete: {analysis_result}")
        logger.info(f"✓ Key moments: {len(key_moments)} frames extracted")
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Fallback to demo analysis if real analysis fails
        analysis_result = {
            "compensation_detected": True,
            "knee_flexion_angle": 32,
            "message": "Load shifts to healthy leg at 32° knee flexion (demo mode - analysis failed)",
            "recommendation": "Focus on slow, symmetrical knee loading."
        }
        keypoints_file = None
        key_moments = []

    response = {
        "filename": file.filename,
        "saved_as": safe_filename,
        "content_type": file.content_type,
        "size_bytes": file_size,
        "status": "uploaded",
        "file_path": str(file_path),
        "keypoints_file": keypoints_file.name if keypoints_file else None,
        "analysis": analysis_result,
        "key_moments": key_moments
    }
    
    logger.info(f"=== UPLOAD COMPLETE ===")
    logger.info(f"Response: {response}")
    
    return response
