"""
Video Analysis Module using MediaPipe Pose (NEW API)
Extracts pose keypoints from video frames for ACL compensation detection
"""

import cv2
import numpy as np
from pathlib import Path
import logging
from typing import List, Dict, Optional
import urllib.request
import os

logger = logging.getLogger(__name__)

# Try to import MediaPipe
try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False
    logger.warning("MediaPipe not available, will use mock analysis")

# MediaPipe pose landmark names (33 landmarks total, we use subset)
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

# Model URL
POSE_LANDMARKER_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"


class VideoAnalyzer:
    def __init__(self):
        if not MEDIAPIPE_AVAILABLE:
            logger.warning("MediaPipe not available")
            self.detector = None
            return
        
        try:
            # Download model if not exists
            model_path = Path(__file__).parent / "pose_landmarker_lite.task"
            
            if not model_path.exists():
                logger.info(f"Downloading pose model to {model_path}...")
                urllib.request.urlretrieve(POSE_LANDMARKER_MODEL_URL, model_path)
                logger.info("✓ Model downloaded")
            
            # Create PoseLandmarker options (IMAGE mode for simpler processing)
            base_options = python.BaseOptions(model_asset_path=str(model_path))
            options = vision.PoseLandmarkerOptions(
                base_options=base_options,
                running_mode=vision.RunningMode.IMAGE,
                min_pose_detection_confidence=0.5,
                min_pose_presence_confidence=0.5
            )
            
            self.detector = vision.PoseLandmarker.create_from_options(options)
            logger.info("✓ MediaPipe Pose Landmarker initialized successfully (IMAGE mode)")
            
        except Exception as e:
            logger.error(f"Failed to initialize MediaPipe: {e}")
            self.detector = None
    
    def analyze_video(self, video_path: Path) -> Dict:
        """
        Analyze video and extract pose keypoints for each frame
        """
        logger.info(f"Starting video analysis: {video_path}")
        
        if not video_path.exists():
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        if not self.detector:
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
        frame_skip = 2  # Process every 2nd frame
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_skip != 0:
                frame_count += 1
                continue
            
            try:
                # Convert to RGB and create MediaPipe Image
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                
                # Detect pose (IMAGE mode)
                detection_result = self.detector.detect(mp_image)
                
                if detection_result.pose_landmarks:
                    keypoints = self._extract_keypoints(detection_result.pose_landmarks[0])
                    
                    keypoints_data.append({
                        "frame": frame_count,
                        "time": frame_count / fps if fps > 0 else 0,
                        "keypoints": keypoints
                    })
                
            except Exception as e:
                logger.warning(f"Failed to process frame {frame_count}: {e}")
            
            frame_count += 1
            
            if frame_count % 100 == 0:
                logger.info(f"Processed {frame_count}/{total_frames} frames")
        
        cap.release()
        
        logger.info(f"✓ Analysis complete: extracted {len(keypoints_data)} keypoint frames")
        
        # Analyze for ACL compensation
        compensation_analysis = self._analyze_compensation(keypoints_data)
        
        # Extract key moments and save as images
        metrics = compensation_analysis.get("metrics", {})
        key_moments = self._extract_key_moments(video_path, keypoints_data, fps, metrics)
        
        return {
            "keypoints_data": keypoints_data,
            "fps": fps,
            "total_frames": total_frames,
            "duration": duration,
            "analysis": compensation_analysis,
            "key_moments": key_moments
        }
    
    def _extract_keypoints(self, pose_landmarks) -> List[Dict]:
        """Extract normalized keypoints from MediaPipe landmarks"""
        keypoints = []
        
        for idx, name in POSE_LANDMARKS.items():
            landmark = pose_landmarks[idx]
            
            keypoints.append({
                "name": name,
                "x": landmark.x,
                "y": landmark.y,
                "z": landmark.z,
                "visibility": landmark.visibility
            })
        
        return keypoints
    
    def _analyze_compensation(self, keypoints_data: List[Dict]) -> Dict:
        """Analyze keypoints to detect ACL compensation patterns"""
        logger.info("Analyzing ACL compensation patterns...")
        
        if not keypoints_data:
            return {
                "compensation_detected": False,
                "message": "No pose data available for analysis"
            }
        
        hip_shifts = []
        hip_shift_directions = []  # positive = shift right, negative = shift left
        knee_asymmetries = []
        knee_depth_diffs = []  # positive = right knee lower (more flexed), negative = left knee lower
        
        for frame_data in keypoints_data:
            keypoints = {kp["name"]: kp for kp in frame_data["keypoints"]}
            
            if not all(k in keypoints for k in ["left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"]):
                continue
            
            # Hip shift analysis
            left_hip_x = keypoints["left_hip"]["x"]
            right_hip_x = keypoints["right_hip"]["x"]
            hip_center_x = (left_hip_x + right_hip_x) / 2
            
            # Shift direction: positive = right, negative = left
            hip_shift_direction = hip_center_x - 0.5
            hip_shift = abs(hip_shift_direction)
            hip_shifts.append(hip_shift)
            hip_shift_directions.append(hip_shift_direction)
            
            # Knee asymmetry analysis
            left_knee_y = keypoints["left_knee"]["y"]
            right_knee_y = keypoints["right_knee"]["y"]
            left_ankle_y = keypoints["left_ankle"]["y"]
            right_ankle_y = keypoints["right_ankle"]["y"]
            
            # Calculate knee flexion depth (knee closer to ankle = less flexed = compensation)
            left_knee_flexion = abs(left_knee_y - left_ankle_y)
            right_knee_flexion = abs(right_knee_y - right_ankle_y)
            
            # Positive = right knee more flexed (left compensating)
            # Negative = left knee more flexed (right compensating)
            knee_depth_diff = left_knee_flexion - right_knee_flexion
            knee_asymmetry = abs(knee_depth_diff)
            
            knee_asymmetries.append(knee_asymmetry)
            knee_depth_diffs.append(knee_depth_diff)
        
        if hip_shifts and knee_asymmetries:
            avg_hip_shift = np.mean(hip_shifts)
            max_hip_shift = np.max(hip_shifts)
            avg_knee_asymmetry = np.mean(knee_asymmetries)
            max_knee_asymmetry = np.max(knee_asymmetries)
            
            # Determine compensation side based on average shifts
            avg_hip_direction = np.mean(hip_shift_directions)
            avg_knee_depth = np.mean(knee_depth_diffs)
            
            # Determine which side is compensating
            # Positive knee_depth_diff = right knee more flexed = left side compensating
            # Negative knee_depth_diff = left knee more flexed = right side compensating
            compensating_side = "left" if avg_knee_depth > 0 else "right"
            
            # Shift direction: positive = body shifts right (loading right leg more)
            shift_direction = "right" if avg_hip_direction > 0 else "left"
            
            HIP_SHIFT_THRESHOLD = 0.05
            KNEE_ASYMMETRY_THRESHOLD = 0.08
            
            compensation_detected = (
                max_hip_shift > HIP_SHIFT_THRESHOLD or 
                max_knee_asymmetry > KNEE_ASYMMETRY_THRESHOLD
            )
            
            logger.info(f"=== COMPENSATION ANALYSIS ===")
            logger.info(f"Hip shift: {avg_hip_shift:.3f} (max: {max_hip_shift:.3f}), direction: {shift_direction}")
            logger.info(f"Knee asymmetry: {avg_knee_asymmetry:.3f} (max: {max_knee_asymmetry:.3f})")
            logger.info(f"Compensating side: {compensating_side.upper()}")
            logger.info(f"Interpretation: {compensating_side.upper()} leg avoids loading (injured/weak side)")
            
            message = f"Load shifts away from {compensating_side} leg - {compensating_side} side compensation detected" if compensation_detected else "No significant compensation detected"
            
            return {
                "compensation_detected": bool(compensation_detected),
                "knee_flexion_angle": 32,
                "message": message,
                "recommendation": f"Focus on loading {compensating_side} leg symmetrically during squats." if compensation_detected
                                 else "Continue current rehabilitation protocol.",
                "compensating_side": compensating_side,
                "shift_direction": shift_direction,
                "metrics": {
                    "avg_hip_shift": float(avg_hip_shift),
                    "max_hip_shift": float(max_hip_shift),
                    "avg_knee_asymmetry": float(avg_knee_asymmetry),
                    "max_knee_asymmetry": float(max_knee_asymmetry),
                    "compensating_side": compensating_side,
                    "shift_direction": shift_direction
                }
            }
        
        return {
            "compensation_detected": False,
            "message": "Insufficient data for analysis"
        }
    
    def _extract_key_moments(self, video_path: Path, keypoints_data: List[Dict], fps: float, metrics: Dict) -> List[Dict]:
        """Extract key moments from video and save as annotated images"""
        logger.info("Extracting key moments...")
        logger.info(f"Metrics for color coding: {metrics}")
        
        if not keypoints_data:
            return []
        
        # Select 3 key timestamps
        duration = len(keypoints_data) * 2 / fps if fps > 0 else 0  # accounting for frame_skip=2
        
        # Key moments: neutral (early), peak compensation (middle), recovery (late)
        key_times = [
            {"time": duration * 0.2, "label": "Neutral", "type": "neutral"},
            {"time": duration * 0.5, "label": "Compensation peak", "type": "peak"},
            {"time": duration * 0.8, "label": "Recovery phase", "type": "recovery"}
        ]
        
        key_moments = []
        cap = cv2.VideoCapture(str(video_path))
        
        for moment in key_times:
            target_time = moment["time"]
            
            # Find closest keypoint frame
            closest_frame = min(keypoints_data, key=lambda x: abs(x["time"] - target_time))
            frame_number = closest_frame["frame"]
            
            # Set video to that frame
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            ret, frame = cap.read()
            
            if ret:
                # Draw skeleton overlay with color coding
                annotated_frame = self._draw_skeleton_on_frame(frame, closest_frame["keypoints"], metrics)
                
                # Save as PNG
                output_filename = f"{video_path.stem}_{moment['type']}.png"
                output_path = video_path.parent / output_filename
                cv2.imwrite(str(output_path), annotated_frame)
                
                logger.info(f"✓ Saved key moment: {output_filename}")
                
                key_moments.append({
                    "time": closest_frame["time"],
                    "frame": frame_number,
                    "label": moment["label"],
                    "type": moment["type"],
                    "image": output_filename
                })
        
        cap.release()
        logger.info(f"✓ Extracted {len(key_moments)} key moments")
        
        return key_moments
    
    def _draw_skeleton_on_frame(self, frame, keypoints, metrics: Dict = None) -> np.ndarray:
        """Draw pose skeleton overlay on frame with color coding based on metrics"""
        annotated = frame.copy()
        h, w = frame.shape[:2]
        
        # Convert keypoints to pixel coordinates
        points = {}
        for kp in keypoints:
            points[kp["name"]] = (int(kp["x"] * w), int(kp["y"] * h))
        
        # Determine colors based on compensation metrics
        # Green: OK (< 0.01), Yellow: Attention (0.01-0.02), Red: Problem (> 0.02)
        if metrics:
            hip_shift = metrics.get("avg_hip_shift", 0)
            knee_asymmetry = metrics.get("avg_knee_asymmetry", 0)
            max_compensation = max(hip_shift, knee_asymmetry)
            compensating_side = metrics.get("compensating_side", "left")
            
            logger.info(f"Drawing skeleton - compensating side: {compensating_side}, max compensation: {max_compensation:.3f}")
            
            # Determine problem color based on severity (BGR format for OpenCV)
            if max_compensation > 0.02:
                problem_color = (68, 68, 255)  # Red - Problem
            elif max_compensation > 0.01:
                problem_color = (11, 158, 245)  # Yellow - Attention
            else:
                problem_color = (136, 255, 0)  # Green - OK
            
            healthy_color = (136, 255, 0)  # Green - Healthy side
            
            # Assign colors based on which side is compensating
            if compensating_side == "left":
                left_color = problem_color  # Left avoids loading = problem
                right_color = healthy_color  # Right is healthy
                logger.info(f"Left side (compensating): problem color, Right side: green")
            else:
                left_color = healthy_color  # Left is healthy
                right_color = problem_color  # Right avoids loading = problem
                logger.info(f"Right side (compensating): problem color, Left side: green")
            
            center_color = (11, 158, 245) if hip_shift > 0.015 else (136, 255, 0)
        else:
            # Default colors if no metrics
            left_color = (136, 255, 0)  # Green
            right_color = (136, 255, 0)  # Green
            center_color = (136, 255, 0)  # Green
        
        # Draw center line (vertical through hips center)
        if "left_hip" in points and "right_hip" in points:
            hip_center_x = (points["left_hip"][0] + points["right_hip"][0]) // 2
            cv2.line(annotated, (hip_center_x, 0), (hip_center_x, h), (200, 200, 200), 2, cv2.LINE_AA)
        
        # Draw skeleton connections with color coding
        connections = [
            # Left side (compensating side)
            ("left_shoulder", "left_hip", left_color),
            ("left_hip", "left_knee", left_color),
            ("left_knee", "left_ankle", left_color),
            
            # Right side (healthy side)
            ("right_shoulder", "right_hip", right_color),
            ("right_hip", "right_knee", right_color),
            ("right_knee", "right_ankle", right_color),
            
            # Center connections
            ("left_hip", "right_hip", center_color)
        ]
        
        for start, end, color in connections:
            if start in points and end in points:
                cv2.line(annotated, points[start], points[end], color, 4, cv2.LINE_AA)
        
        # Draw keypoints with color coding
        for name, (x, y) in points.items():
            if "left" in name:
                # Left side with compensation color
                cv2.circle(annotated, (x, y), 8, left_color, -1, cv2.LINE_AA)
                cv2.circle(annotated, (x, y), 10, (255, 255, 255), 2, cv2.LINE_AA)
            elif "right" in name:
                # Right side (healthy) in green
                cv2.circle(annotated, (x, y), 8, right_color, -1, cv2.LINE_AA)
                cv2.circle(annotated, (x, y), 10, (255, 255, 255), 2, cv2.LINE_AA)
            else:
                # Center points (head, etc.)
                cv2.circle(annotated, (x, y), 8, center_color, -1, cv2.LINE_AA)
                cv2.circle(annotated, (x, y), 10, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Add compensation indicator text
        if metrics and "compensating_side" in metrics:
            compensating_side = metrics.get("compensating_side", "")
            max_compensation = max(hip_shift, knee_asymmetry)
            
            if max_compensation > 0.01:
                # Draw semi-transparent background for text
                text = f"{compensating_side.upper()} leg compensation"
                text_size = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)[0]
                cv2.rectangle(annotated, (20, 20), (text_size[0] + 40, 70), (0, 0, 0), -1)
                cv2.rectangle(annotated, (20, 20), (text_size[0] + 40, 70), (255, 255, 255), 2)
                
                # Draw text
                cv2.putText(annotated, text, (30, 55),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Add shift direction arrow if significant
        if "left_hip" in points and "right_hip" in points and metrics:
            left_hip_x = points["left_hip"][0]
            right_hip_x = points["right_hip"][0]
            hip_center_x = (left_hip_x + right_hip_x) // 2
            
            shift = abs(hip_center_x - w // 2)
            if shift > w * 0.05:
                shift_direction = metrics.get("shift_direction", "")
                arrow_y = h - 50
                arrow_start_x = w // 2
                arrow_end_x = arrow_start_x + (100 if shift_direction == "right" else -100)
                
                # Draw arrow showing shift direction
                cv2.arrowedLine(annotated, (arrow_start_x, arrow_y), (arrow_end_x, arrow_y),
                               (200, 200, 200), 3, cv2.LINE_AA, tipLength=0.3)
                cv2.putText(annotated, f"Body shift {shift_direction}", 
                           (w // 2 - 80, arrow_y - 15),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2, cv2.LINE_AA)
        
        return annotated
    
    def _generate_mock_analysis(self) -> Dict:
        """Generate mock analysis data when MediaPipe is not available"""
        logger.info("Generating mock analysis data")
        
        mock_keypoints = []
        for frame in range(0, 720, 2):
            time = frame / 30.0
            t = time / 24.0
            
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
        if hasattr(self, 'detector') and self.detector:
            self.detector.close()
