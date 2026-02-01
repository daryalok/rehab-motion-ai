# 🏥 InsideMotion — AI Rehab Inside the Body

## 🦵 Post-ACL Knee Rehabilitation with Real Feedback at Home

We help physiotherapists see invisible ACL compensations during home rehabilitation using AI and a simple camera.

<img width="1536" height="1024" alt="rehab" src="https://github.com/user-attachments/assets/2f6fc218-9f5e-4bfb-be46-8a0a212d0d51" />

---

## 🚀 Quick Start

### Option 1: Using Make (Recommended)

```bash
make run
```

Then open: **http://localhost:8000**

### Option 2: Using Docker

```bash
docker-compose up --build
```

Then open: **http://localhost:8000**

### Option 3: Manual Setup

```bash
cd apps/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Available Make Commands

```bash
make help       # Show all available commands
make install    # Install dependencies
make dev        # Start development server
make run        # Install + run (one command)
make test       # Run tests
make clean      # Clean build artifacts
```

### Docker Commands

```bash
docker-compose up           # Start services
docker-compose up -d        # Start in background
docker-compose down         # Stop services
docker-compose logs -f      # View logs
```

### Requirements
- **Python:** 3.10+ (local run)
- **Docker:** 20.10+ (Docker run)
- **Disk:** ~500MB (dependencies + AI models)
- **RAM:** 2GB minimum

### Usage
1. Upload patient squat video (MP4, MOV, AVI)
2. Wait ~5-15 seconds for AI analysis
3. View results with compensation detection + key moments

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
React, Next.js, Tailwind
```

### ⚙️ Backend
```
Python, FastAPI
```

### 🤖 AI / CV
```
Pose Estimation, Biomechanical Feature Extraction
```

### 🧮 Logic
```
Rule-based + lightweight ML for compensation detection
```

### ☁️ Hosting
```
Vercel / Railway
```

---

## 📞 Contact & Support

For more information, please reach on Discord klimb_d 
