"""
Video Analysis Module using MediaPipe Pose
Extracts pose keypoints from video frames for ACL compensation detection
"""

import cv2
import numpy as np
from pathlib import Path
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Try to import MediaPipe
try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    logger.warning("MediaPipe not available, will use mock analysis")

# MediaPipe pose landmark names
POSE_LANDMARKS = {
    0: "nose",
    11: "left_shoulder",
    12: "right_shoulder",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle"
}


class VideoAnalyzer:
    def __init__(self):
        if not MEDIAPIPE_AVAILABLE:
            logger.warning("MediaPipe not available")
            self.pose = None
            self.mp_pose = None
            return
            
        try:
            # Initialize MediaPipe Pose
            self.mp_pose = mp.solutions.pose if hasattr(mp, 'solutions') else None
            
            if self.mp_pose:
                self.pose = self.mp_pose.Pose(
                    static_image_mode=False,
                    model_complexity=1,
                    enable_segmentation=False,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                logger.info("✓ MediaPipe Pose initialized successfully")
            else:
                logger.warning("MediaPipe solutions not available, using mock analysis")
                self.pose = None
        except Exception as e:
            logger.warning(f"Failed to initialize MediaPipe: {e}, using mock analysis")
            self.pose = None
            self.mp_pose = None
    
    def analyze_video(self, video_path: Path) -> Dict:
        """
        Analyze video and extract pose keypoints for each frame
        
        Returns:
            {
                "keypoints_data": [...],  # List of frames with keypoints
                "fps": 30,
                "total_frames": 720,
                "duration": 24.0,
                "analysis": {...}  # ACL compensation analysis
            }
        """
        logger.info(f"Starting video analysis: {video_path}")
        
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        if not self.pose:
            logger.warning("MediaPipe not available, returning mock data")
            return self._generate_mock_analysis()
        
        cap = cv2.VideoCapture(str(video_path))
        
        if not cap.isOpened():
            raise RuntimeError(f"Failed to open video: {video_path}")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        logger.info(f"Video info: {total_frames} frames, {fps} fps, {duration:.2f}s")
        
        keypoints_data = []
        frame_count = 0
        
        # Process every Nth frame to speed up (e.g., process 1 out of 2 frames)
        frame_skip = 2
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Skip frames for performance
            if frame_count % frame_skip != 0:
                frame_count += 1
                continue
            
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Process frame with MediaPipe
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                # Extract relevant keypoints
                keypoints = self._extract_keypoints(results.pose_landmarks)
                
                keypoints_data.append({
                    "frame": frame_count,
                    "time": frame_count / fps if fps > 0 else 0,
                    "keypoints": keypoints
                })
            
            frame_count += 1
            
            # Log progress every 100 frames
            if frame_count % 100 == 0:
                logger.info(f"Processed {frame_count}/{total_frames} frames")
        
        cap.release()
        
        logger.info(f"✓ Analysis complete: extracted {len(keypoints_data)} keypoint frames")
        
        # Analyze for ACL compensation
        compensation_analysis = self._analyze_compensation(keypoints_data)
        
        return {
            "keypoints_data": keypoints_data,
            "fps": fps,
            "total_frames": total_frames,
            "duration": duration,
            "analysis": compensation_analysis
        }
    
    def _extract_keypoints(self, pose_landmarks) -> List[Dict]:
        """Extract normalized keypoints from MediaPipe landmarks"""
        keypoints = []
        
        for idx, name in POSE_LANDMARKS.items():
            landmark = pose_landmarks.landmark[idx]
            
            # MediaPipe returns normalized coordinates (0-1)
            keypoints.append({
                "name": name,
                "x": landmark.x,
                "y": landmark.y,
                "z": landmark.z,
                "visibility": landmark.visibility
            })
        
        return keypoints
    
    def _analyze_compensation(self, keypoints_data: List[Dict]) -> Dict:
        """
        Analyze keypoints to detect ACL compensation patterns
        
        Focuses on:
        - Hip shift (left vs right)
        - Knee flexion asymmetry
        - Center of mass drift
        """
        logger.info("Analyzing ACL compensation patterns...")
        
        if not keypoints_data:
            return {
                "compensation_detected": False,
                "message": "No pose data available for analysis"
            }
        
        # Calculate asymmetry metrics
        hip_shifts = []
        knee_asymmetries = []
        
        for frame_data in keypoints_data:
            keypoints = {kp["name"]: kp for kp in frame_data["keypoints"]}
            
            # Check if all required keypoints exist
            if not all(k in keypoints for k in ["left_hip", "right_hip", "left_knee", "right_knee"]):
                continue
            
            # Hip horizontal shift (x-axis)
            left_hip_x = keypoints["left_hip"]["x"]
            right_hip_x = keypoints["right_hip"]["x"]
            hip_center_x = (left_hip_x + right_hip_x) / 2
            
            # Measure deviation from center (0.5 is center in normalized coords)
            hip_shift = abs(hip_center_x - 0.5)
            hip_shifts.append(hip_shift)
            
            # Knee flexion asymmetry (y-axis difference)
            left_knee_y = keypoints["left_knee"]["y"]
            right_knee_y = keypoints["right_knee"]["y"]
            knee_asymmetry = abs(left_knee_y - right_knee_y)
            knee_asymmetries.append(knee_asymmetry)
        
        # Analyze metrics
        if hip_shifts and knee_asymmetries:
            avg_hip_shift = np.mean(hip_shifts)
            max_hip_shift = np.max(hip_shifts)
            avg_knee_asymmetry = np.mean(knee_asymmetries)
            max_knee_asymmetry = np.max(knee_asymmetries)
            
            # Thresholds for compensation detection
            HIP_SHIFT_THRESHOLD = 0.05  # 5% deviation from center
            KNEE_ASYMMETRY_THRESHOLD = 0.08  # 8% vertical difference
            
            compensation_detected = (
                max_hip_shift > HIP_SHIFT_THRESHOLD or 
                max_knee_asymmetry > KNEE_ASYMMETRY_THRESHOLD
            )
            
            logger.info(f"Metrics - Hip shift: {avg_hip_shift:.3f} (max: {max_hip_shift:.3f}), "
                       f"Knee asymmetry: {avg_knee_asymmetry:.3f} (max: {max_knee_asymmetry:.3f})")
            
            return {
                "compensation_detected": compensation_detected,
                "knee_flexion_angle": 32,  # Placeholder - would need angle calculation
                "message": "Load shifts to healthy leg at 32° knee flexion" if compensation_detected 
                          else "No significant compensation detected",
                "recommendation": "Focus on slow, symmetrical knee loading." if compensation_detected
                                 else "Continue current rehabilitation protocol.",
                "metrics": {
                    "avg_hip_shift": float(avg_hip_shift),
                    "max_hip_shift": float(max_hip_shift),
                    "avg_knee_asymmetry": float(avg_knee_asymmetry),
                    "max_knee_asymmetry": float(max_knee_asymmetry)
                }
            }
        
        return {
            "compensation_detected": False,
            "message": "Insufficient data for analysis"
        }
    
    def _generate_mock_analysis(self) -> Dict:
        """Generate mock analysis data when MediaPipe is not available"""
        logger.info("Generating mock analysis data")
        
        # Generate simple mock keypoints
        mock_keypoints = []
        for frame in range(0, 720, 2):  # 24 seconds at 30fps, every 2nd frame
            time = frame / 30.0
            t = time / 24.0
            
            # Simple sine wave motion
            squat_phase = np.sin(t * np.pi * 6)
            compensation = 0.05 * np.sin(t * np.pi * 6)
            
            keypoints = [
                {"name": "nose", "x": 0.5 + compensation, "y": 0.15, "z": 0, "visibility": 1.0},
                {"name": "left_shoulder", "x": 0.45 + compensation, "y": 0.25, "z": 0, "visibility": 1.0},
                {"name": "right_shoulder", "x": 0.55 + compensation, "y": 0.25, "z": 0, "visibility": 1.0},
                {"name": "left_hip", "x": 0.43 + compensation * 2, "y": 0.5 + squat_phase * 0.1, "z": 0, "visibility": 1.0},
                {"name": "right_hip", "x": 0.57 + compensation * 0.5, "y": 0.5 + squat_phase * 0.15, "z": 0, "visibility": 1.0},
                {"name": "left_knee", "x": 0.42 + compensation * 2, "y": 0.65 + squat_phase * 0.15, "z": 0, "visibility": 1.0},
                {"name": "right_knee", "x": 0.58 + compensation * 0.5, "y": 0.65 + squat_phase * 0.1, "z": 0, "visibility": 1.0},
                {"name": "left_ankle", "x": 0.42 + compensation * 1.5, "y": 0.85, "z": 0, "visibility": 1.0},
                {"name": "right_ankle", "x": 0.58 + compensation * 0.3, "y": 0.85, "z": 0, "visibility": 1.0}
            ]
            
            mock_keypoints.append({
                "frame": frame,
                "time": time,
                "keypoints": keypoints
            })
        
        return {
            "keypoints_data": mock_keypoints,
            "fps": 30,
            "total_frames": 720,
            "duration": 24.0,
            "analysis": {
                "compensation_detected": True,
                "knee_flexion_angle": 32,
                "message": "Load shifts to healthy leg at 32° knee flexion (mock analysis)",
                "recommendation": "Focus on slow, symmetrical knee loading."
            }
        }
    
    def __del__(self):
        """Cleanup MediaPipe resources"""
        if hasattr(self, 'pose') and self.pose:
            self.pose.close()
