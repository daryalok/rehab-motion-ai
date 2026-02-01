# 🚀 Quick Start Guide

## Run InsideMotion Locally in 30 Seconds

### Option 1: One Command (Recommended)

```bash
./start.sh
```

This automatically:
- Creates Python virtual environment
- Installs all dependencies
- Downloads AI models
- Starts backend + frontend
- Opens in your browser

---

### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start_frontend.sh
```

---

## ✅ System Requirements

- **Python:** 3.10 or higher
- **OS:** macOS, Linux, or Windows (Git Bash)
- **Disk:** ~500MB for dependencies + AI models
- **RAM:** 2GB minimum

---

## 📝 First Upload

1. **Wait** for backend to finish starting (~10 seconds)
2. **Browser** should open automatically to the upload page
3. **Upload** a squat video (MP4, MOV, or AVI)
4. **Wait** for analysis (~5-15 seconds depending on video length)
5. **View** results with compensation detection

---

## 🐛 Troubleshooting

### Backend won't start

**Port 8000 already in use:**
```bash
# Kill existing process on port 8000
lsof -ti:8000 | xargs kill -9

# Try again
./start_backend.sh
```

**Python not found:**
```bash
# Check Python version
python3 --version

# Should be 3.10+
# If not installed, download from: https://www.python.org/
```

### Scripts not executable

```bash
# Make scripts executable
chmod +x start.sh start_backend.sh start_frontend.sh
```

### Frontend shows "Backend not running"

**Check backend status:**
```bash
# In your browser, visit:
http://localhost:8000/health

# Should show: {"status": "ok"}
```

**If backend crashed:**
- Check Terminal 1 for error messages
- Try restarting: `./start_backend.sh`

### Upload fails with NetworkError

**Check API connection:**
```bash
# Test backend API
curl http://localhost:8000/health

# If this fails, backend is not running
```

### Video analysis fails

**Check video format:**
- Supported: MP4, MOV, AVI
- Max size: 200MB
- Recommended: 5-30 seconds, 1080p

**Check backend logs:**
- Look for Python errors in Terminal 1
- Common issue: MediaPipe model not downloaded
- Fix: Backend will auto-download on first run

---

## 📂 Project Structure

```
rehab-motion-ai/
├── start.sh              ← Start everything
├── start_backend.sh      ← Backend only
├── start_frontend.sh     ← Frontend only
├── apps/
│   ├── backend/          ← FastAPI + MediaPipe AI
│   └── frontend/         ← HTML/CSS/JS UI
├── data/
│   └── uploads/          ← Uploaded videos (auto-created)
└── README.md             ← Full documentation
```

---

## 🔗 Useful URLs (when running)

- **Frontend:** Opens automatically in browser
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (interactive Swagger UI)
- **Health Check:** http://localhost:8000/health

---

## 🛑 Stopping the Application

**If you used `./start.sh`:**
```bash
# Press Ctrl+C in the terminal
```

**If you started components separately:**
```bash
# Press Ctrl+C in each terminal window
```

**Force kill backend:**
```bash
lsof -ti:8000 | xargs kill -9
```

---

## 📖 Next Steps

- **Full documentation:** See [README.md](README.md)
- **Technical details:** See [apps/backend/README.md](apps/backend/README.md)
- **Pitch deck:** See [PITCH.md](PITCH.md)
- **Report issues:** GitHub Issues

---

## 💡 Tips

1. **First run takes longer** (~30 seconds) due to model download
2. **Subsequent runs are fast** (~3 seconds startup)
3. **Backend logs** show detailed AI analysis metrics
4. **Keep backend running** while using the app
5. **Refresh frontend** (Cmd+Shift+R) if upload button unresponsive

---

## ✅ Success Checklist

- [ ] Backend shows "Application startup complete"
- [ ] Frontend opens in browser automatically
- [ ] Upload page visible with drag-and-drop area
- [ ] Can select video file
- [ ] "Upload video" button clickable
- [ ] After upload, progress bar appears
- [ ] Result page shows video + analysis
- [ ] Key moments display with skeleton overlay

If all checked ✅ — you're ready to go! 🎉

---

**Need help?** See full [README.md](README.md) or [PITCH.md](PITCH.md) for more details.
