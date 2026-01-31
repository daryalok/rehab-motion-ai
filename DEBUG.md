# Debugging Guide

## Checking Backend Logs

Backend logs will show detailed information about each upload:

```bash
# Check if backend is running
curl http://localhost:8000/health

# Watch backend logs in real-time
tail -f /path/to/backend/logs
```

## Checking Frontend Logs

Open browser DevTools (F12 or Cmd+Option+I):
- Go to **Console** tab
- Look for messages starting with `===`
- Check for any red errors

## Common Issues

### 1. Backend not running
**Symptom:** `NetworkError when attempting to fetch resource`

**Solution:**
```bash
cd apps/backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 2. CORS errors
**Symptom:** Console shows CORS policy errors

**Solution:** Backend already has CORS configured for `*`, should work

### 3. File not uploading
**Check:**
- File type must be `video/*`
- File size < 200MB
- Backend logs show the request

### 4. Analysis not showing
**Check:**
- Browser console for response data
- Look for `data.analysis` in console logs
- Backend logs show "Analysis complete"

## Test Upload via curl

```bash
# Create test video
echo "test content" > /tmp/test.mp4

# Upload it
curl -X POST http://localhost:8000/upload \
  -F "file=@/tmp/test.mp4;type=video/mp4" \
  -v

# Should return JSON with analysis
```

## Expected Flow

1. **Frontend Console:**
   ```
   === UPLOAD BUTTON CLICKED ===
   File details: ...
   FormData created, sending to: http://localhost:8000/upload
   Response received: 200 OK
   ✓ Upload successful, response data: {...}
   Analysis result: {...}
   === UPLOAD COMPLETE ===
   ```

2. **Backend Logs:**
   ```
   === UPLOAD REQUEST RECEIVED ===
   Filename: video.mp4
   Content-Type: video/mp4
   File size: 1234567 bytes (1.18 MB)
   ✓ File saved successfully: 20260131_163000_video.mp4
   ✓ Analysis complete: {...}
   === UPLOAD COMPLETE ===
   ```

## File Locations

- Uploaded videos: `data/uploads/`
- Backend code: `apps/backend/app/main.py`
- Frontend code: `apps/frontend/main.js`
