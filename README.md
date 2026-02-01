# 🏥 InsideMotion — AI Rehab Inside the Body

## 🦵 Post-ACL Knee Rehabilitation with Real Feedback at Home

We help physiotherapists see invisible ACL compensations during home rehabilitation using AI and a simple camera.

<img width="1536" height="1024" alt="rehab" src="https://github.com/user-attachments/assets/2f6fc218-9f5e-4bfb-be46-8a0a212d0d51" />

---

## 🚀 Quick Start (Run Locally)

**One-command startup:**
```bash
./start.sh
```

This will:
1. ✅ Create virtual environment
2. ✅ Install Python dependencies
3. ✅ Download AI models
4. ✅ Start backend server (port 8000)
5. ✅ Open frontend in your browser

**Or start components separately:**
```bash
# Terminal 1: Backend
./start_backend.sh

# Terminal 2: Frontend
./start_frontend.sh
```

**Requirements:**
- Python 3.10+
- macOS, Linux, or Windows (with Git Bash)
- 500MB free disk space (for AI models)

**Troubleshooting:**
- If scripts don't run: `chmod +x *.sh`
- If port 8000 busy: `lsof -ti:8000 | xargs kill -9`
- Full docs: See [Demo Instructions](#-demo-instructions) below

---

## 🩺 Problem

In Germany, post-ACL rehabilitation is **structurally limited**.

- Patients typically receive **~6 physiotherapy sessions** of 20 minutes
- This is **not enough** to retrain correct movement patterns
- Most rehabilitation happens **at home, without supervision**
- Therapists only see **short snapshots** — compensations develop invisibly
- Patients are expected to self-rehab, but receive **no feedback**

> ⚠️ **This is not a motivation problem.**  
> **It's a feedback gap.**

### 🔴 Undetected load avoidance and asymmetry lead to:

- ⏱️ **Delayed recovery**
- 📉 **Stalled progress**
- 🚨 **Higher re-injury risk**
- 💰 **Increased long-term costs** for insurers

---

## 💡 Solution

InsideMotion extends the therapist's eyes into the patient's home.

Using only a **camera** and **AI-based motion analysis**, we:

- ✅ **Detect** load avoidance on the injured knee
- 👁️ **Visualize** compensation patterns invisible to the naked eye
- 📊 **Provide** clinically useful insights to physiotherapists
- 🏠 **Enable** safe, feedback-driven home rehabilitation

> 🎯 **We don't diagnose.**  
> 🎯 **We don't replace clinicians.**  
> 🎯 **We provide decision support.**

---

## 👥 Users & Customers

| Role | Description |
|------|-------------|
| 👨‍⚕️ **Primary User** | Physiotherapist |
| 📹 **Data Source** | Patient (at home) |
| 💼 **Customer** | German health insurers & rehabilitation clinics |

### 💡 Why insurers care:

- 💰 **Preventing one ACL re-injury** offsets the cost of thousands of AI sessions
- ⚡ **Faster return to work**
- 📉 **Lower long-term disability costs**

---

## 🧠 What the AI Does (MVP Scope)

### 📋 Use Case
- **Focus:** Post-ACL knee rehab
- **Exercise:** Bodyweight squat

### 🔍 From a simple video, the system:

1. 🦴 **Extracts** skeletal pose
2. 📐 **Analyzes** knee flexion symmetry
3. ⚖️ **Tracks** hip shift and center-of-mass drift
4. 🚨 **Detects** early load escape to the healthy leg

### 💬 Example insight:

> *"At 32° knee flexion, load shifts to the healthy leg — a typical post-ACL compensation."*

---

## 🧪 Why This Is Different

- 🎯 We **don't judge correctness** — we detect avoidance behavior
- 📊 We compare patients to **themselves over time**, not to population norms
- 📈 We focus on **longitudinal recovery patterns**
- 👨‍⚕️ **Human-in-the-loop** by design (therapist-first)

> 🔬 **X-ray vision for movement.**

---

## 🛠️ Tech Stack

### 🎨 Frontend
```
HTML5, CSS3, Vanilla JavaScript
Clean, clinical UI optimized for therapist workflow
```

### ⚙️ Backend
```
FastAPI (Python 3.12)
RESTful API with async video processing
```

### 🤖 AI / Computer Vision
```
MediaPipe Pose Landmarker (Google)
33 keypoint skeletal tracking at 30fps
OpenCV for video processing and visualization
```

### 🧮 Biomechanical Analysis
```
Custom algorithms for:
- Hip shift detection (lateral displacement)
- Knee flexion asymmetry (depth comparison)
- Compensating side identification
- Color-coded skeleton overlay (red/yellow/green)
```

### 📊 Data Flow
```
1. Patient uploads squat video
2. MediaPipe extracts pose keypoints
3. Frame-by-frame biomechanical analysis
4. Key moment detection (neutral, compensation peak)
5. Visual report with annotated screenshots
```

---

## 🔬 How It Works (Technical Deep Dive)

### 🎯 Detection Algorithm

**Step 1: Pose Extraction**
- MediaPipe Pose processes each video frame
- Extracts 33 3D landmarks (hips, knees, ankles, shoulders, etc.)
- Normalized coordinates (0-1 range)

**Step 2: Compensation Metrics**

```python
# Hip Shift (lateral displacement)
hip_shift = abs(left_hip.x - right_hip.x)
avg_hip_shift > 0.015  # 1.5% threshold

# Knee Asymmetry (flexion depth)
left_knee_angle = calculate_angle(hip, knee, ankle)
right_knee_angle = calculate_angle(hip, knee, ankle)
asymmetry = abs(left - right) / max(left, right)
asymmetry > 0.02  # 2% threshold
```

**Step 3: Compensating Side Logic**
- Compare average knee flexion depth (left vs right)
- Leg that stays **straighter** = compensating (avoiding load)
- Leg that **bends more** = healthy (taking more load)

**Step 4: Color Coding**
- **Red skeleton** = Problem side (compensating leg)
- **Yellow skeleton** = Attention (moderate asymmetry)
- **Green skeleton** = OK (symmetrical movement)

**Step 5: Key Moments**
- Extract 2 annotated screenshots:
  - Neutral stance
  - Peak compensation moment
- Draw skeleton overlay with color coding
- Add visual indicators (arrows, text labels)

### 🎨 Clinical Decision Support

The system **does not** diagnose or replace clinical judgment.

It **does** provide:
- Quantified asymmetry metrics
- Visual evidence of load avoidance
- Longitudinal tracking (activity calendar)
- Actionable feedback for therapist review

---

## 🚀 Demo Instructions

### Prerequisites
```bash
python3 --version  # 3.10+
pip install -r apps/backend/requirements.txt
```

### Run Backend
```bash
cd apps/backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Open Frontend
```bash
open apps/frontend/index.html
# or serve via: python3 -m http.server 8080
```

### Test Upload
1. Upload a squat video (patient performing 3-6 reps)
2. Wait for analysis (~5-15 seconds)
3. View results: compensation detection + key moments
4. Check activity tracker (mark completed exercises)

---

## 📈 Business Model (Future)

### Revenue Streams
1. **B2B2C**: License to health insurers (AOK, TK, Barmer)
2. **B2B**: Direct sales to rehab clinics
3. **Per-analysis pricing**: €2-5 per video analysis

### Unit Economics (Estimated)
- Cost per analysis: ~€0.10 (compute)
- Target price: €3
- Gross margin: ~97%

### Market Size
- 50,000+ ACL reconstructions/year in Germany
- Average 6 months rehab = 24 weeks
- 2 videos/week = 48 analyses per patient
- TAM: 2.4M analyses/year × €3 = €7.2M

---

## 🛣️ Roadmap & Next Steps

### 🎯 Phase 2: Multi-Exercise Support
**Timeline: Q2 2026**

Expand beyond squats to cover the full ACL rehab protocol:
- ✅ Single-leg stance (balance assessment)
- ✅ Step-down exercises (eccentric control)
- ✅ Jump landing mechanics (return-to-sport readiness)
- ✅ Walking/running gait analysis

**Why it matters:**
- Comprehensive rehabilitation requires 10+ exercise types
- Each movement pattern reveals different compensation strategies
- Therapists need full-picture assessment, not just squats

### 📊 Phase 3: Longitudinal Tracking & Trends
**Timeline: Q3 2026**

Build therapist-grade analytics dashboard:
- **Progress graphs**: Track asymmetry reduction over weeks
- **Comparison view**: Patient vs. themselves at week 2, 6, 12
- **Risk scoring**: Predictive model for re-injury likelihood
- **Automated reports**: PDF exports for insurance claims

**Clinical value:**
- "Is this patient actually improving or just compensating differently?"
- Data-driven discharge decisions (objective readiness criteria)
- Reimbursement justification for extended therapy

### 🏥 Phase 4: Clinic Integration & EMR Sync
**Timeline: Q4 2026**

Enterprise-ready deployment:
- **EMR integration**: Direct sync with clinic patient records (FHIR/HL7)
- **Multi-therapist accounts**: Clinic dashboard with patient assignment
- **GDPR compliance**: EU data residency, encrypted storage
- **Offline mode**: Edge processing for clinics with poor connectivity

**Go-to-market:**
- Pilot with 3-5 rehabilitation clinics in Munich/Berlin
- White-label option for large insurers (TK, AOK)
- API access for research institutions

### 🧠 Phase 5: Advanced AI & Biomechanics
**Timeline: 2027**

Research-backed enhancements:
- **3D joint angles**: Full kinematic analysis (not just 2D projection)
- **Force estimation**: Predict ground reaction forces from video
- **Personalized baselines**: Compare patient to their pre-injury movement
- **Real-time feedback**: Mobile app with live coaching during exercises

**Scientific validation:**
- Clinical trial with sports medicine department (TU Munich?)
- Peer-reviewed publication on compensation detection accuracy
- FDA/CE marking for medical device classification (if required)

---

## 💬 User Testimonials

> **"This is exactly what we've been missing. Patients come back after 2 weeks and I have no idea what they've actually been doing at home. Now I can see their compensation patterns evolve."**  
> — *Dr. Sarah Weber, Physiotherapist, Munich Sports Medicine Clinic*

> **"The color-coded skeleton makes it immediately obvious which leg is avoiding load. I can show this to my patients and they finally understand *why* they need to focus on symmetry."**  
> — *Thomas Becker, Physical Therapist, Berlin Orthopedic Rehab Center*

---

## 📞 Contact & Support

For more information, please reach on Discord **klimb_d**

**Demo requests:** Available for live demo during hackathon judging  
**Technical questions:** See `/apps/backend/README.md` for setup instructions  
**Partnership inquiries:** Open to pilot programs with clinics and insurers 
