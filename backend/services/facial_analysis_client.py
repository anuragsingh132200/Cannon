"""
Facial Analysis Client
Direct HTTP client for the cannon_facial_analysis microservice.
No LangGraph, no Gemini — pure HTTP proxy.
"""

import httpx
import base64
import time
import io
from typing import List, Dict, Any, Optional
from config import settings
from models.scan import (
    ScanAnalysis, FaceMetrics, JawlineMetrics, CheekbonesMetrics,
    EyeAreaMetrics, NoseMetrics, LipsMetrics, ForeheadMetrics,
    SkinMetrics, FacialProportions, ProfileMetrics, HairMetrics,
    BodyFatIndicators, ImprovementSuggestion, ImprovementPriority
)


class FacialAnalysisClient:
    """
    HTTP client for the cannon_facial_analysis service.

    Supports two call modes:
      1. upload_video(video_bytes)  → POST /scan/upload-video  (multipart)
      2. analyze_frames(frames)    → POST /scan/analyze        (JSON base64)
    """

    def __init__(self):
        self.base_url = settings.facial_analysis_api_url  # e.g. http://localhost:8001/api
        self.timeout = 120.0  # video analysis can take a while

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def upload_video(self, video_bytes: bytes, filename: str = "scan.mp4") -> ScanAnalysis:
        """
        Send a raw video file to /scan/upload-video and return a ScanAnalysis.
        This is the primary endpoint used by the mobile app flow.
        """
        url = f"{self.base_url}/scan/upload-video"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                files = {"file": (filename, io.BytesIO(video_bytes), "video/mp4")}
                response = await client.post(url, files=files)
                response.raise_for_status()
                return self._map_to_scan_analysis(response.json())
            except httpx.HTTPStatusError as e:
                detail = e.response.text if e.response else str(e)
                print(f"[FacialAnalysisClient] HTTP error from analysis service: {detail}")
                return self._create_error_analysis(f"Analysis service returned {e.response.status_code}: {detail}")
            except Exception as e:
                print(f"[FacialAnalysisClient] Error calling analysis service: {e}")
                return self._create_error_analysis(str(e))

    async def analyze_frames(self, frames_data: List[bytes]) -> ScanAnalysis:
        """
        Send a list of JPEG frame bytes to /scan/analyze (JSON payload).
        Used when frames have already been extracted from a video.
        """
        url = f"{self.base_url}/scan/analyze"

        frames = []
        for i, frame_bytes in enumerate(frames_data):
            b64 = base64.b64encode(frame_bytes).decode("utf-8")
            frames.append({
                "image": f"data:image/jpeg;base64,{b64}",
                "timestamp": time.time() + (i * 0.1)
            })

        payload = {"frames": frames, "config": {}}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return self._map_to_scan_analysis(response.json())
            except httpx.HTTPStatusError as e:
                detail = e.response.text if e.response else str(e)
                print(f"[FacialAnalysisClient] HTTP error from analysis service: {detail}")
                return self._create_error_analysis(f"Analysis service returned {e.response.status_code}: {detail}")
            except Exception as e:
                print(f"[FacialAnalysisClient] Error calling analysis service: {e}")
                return self._create_error_analysis(str(e))

    async def health_check(self) -> bool:
        """Returns True if the cannon_facial_analysis service is reachable."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.base_url}/health")
                return resp.status_code == 200
        except Exception:
            return False

    # ------------------------------------------------------------------
    # Response mapping
    # ------------------------------------------------------------------

    def _map_to_scan_analysis(self, data: Dict[str, Any]) -> ScanAnalysis:
        """
        Map the cannon_facial_analysis JSON response to the backend ScanAnalysis model.

        Response shape (from API_REFERENCE.md):
        {
          "success": true,
          "scan_summary": { "overall_score": 8.5, "frames_by_angle": {...} },
          "measurements": {
            "front_view": {
              "canthal_tilt_left":  { "value": 6.5, "score": 9.0, "rating": "Ideal" },
              "symmetry_score":     { "value": 85.0 },
              ...
            },
            "profile_view": {
              "gonial_angle":       { "value": 125.0, "score": 8.0 },
              ...
            }
          },
          "golden_ratio_analysis": { "average_score": 8.5, "scores": {...} },
          "ai_recommendations": {
            "summary": "...",
            "strengths": [...],
            "recommendations": [{"title": "...", "description": "..."}]
          }
        }
        """
        measurements = data.get("measurements", {})
        front = measurements.get("front_view", {})
        profile = measurements.get("profile_view", {})
        summary = data.get("scan_summary", {})
        golden = data.get("golden_ratio_analysis", {})
        ai_recs = data.get("ai_recommendations") or {}

        overall_score = max(0.0, min(10.0, float(summary.get("overall_score") or golden.get("average_score") or 5.0)))

        def val(view: dict, key: str, default: float = 5.0) -> float:
            """
            Extract a 0-10 score from a measurement dict entry.
            - Prefers the 'score' field (cannon always puts 0-10 scores there).
            - Falls back to 'value' only when 'score' is absent, then clamps to 0-10.
            - Raw measurement values (angles, mm, ratios) can be >> 10, so we clamp.
            """
            item = view.get(key)
            if item is None:
                return default
            if isinstance(item, dict):
                # 'score' is always on 0-10 scale when present
                score = item.get("score")
                if score is not None:
                    return max(0.0, min(10.0, float(score)))
                # 'value' is a raw measurement — clamp to 0-10
                value = item.get("value")
                if value is not None:
                    return max(0.0, min(10.0, float(value)))
                return default
            # Bare numeric — clamp
            return max(0.0, min(10.0, float(item)))

        # ---- Build FaceMetrics from the measurements ----
        metrics = FaceMetrics(
            overall_score=overall_score,
            harmony_score=val(front, "symmetry_score", overall_score),
            jawline=JawlineMetrics(
                definition_score=val(front, "jaw_cheek_ratio", 5.0),
                symmetry_score=val(front, "symmetry_score", 5.0),
                masseter_development=5.0,
                chin_projection=val(profile, "chin_projection", 5.0),
                ramus_length=5.0,
                chin_shape="average"
            ),
            cheekbones=CheekbonesMetrics(
                prominence_score=5.0,
                width_score=val(front, "face_width_height_ratio", 5.0),
                hollowness_below=5.0,
                symmetry_score=val(front, "symmetry_score", 5.0)
            ),
            eye_area=EyeAreaMetrics(
                canthal_tilt="positive" if val(front, "canthal_tilt_left", 0) > 0 else "neutral",
                canthal_tilt_degrees=val(front, "canthal_tilt_left", None),
                interpupillary_distance="average",
                eye_spacing_ratio=val(front, "esr", None),
                upper_eyelid_exposure=val(front, "ear_left", 5.0),
                palpebral_fissure_height=val(front, "ear_right", 5.0),
                eye_shape="almond",
                under_eye_area=5.0,
                eyebrow_position="neutral",
                eyebrow_shape="natural",
                brow_bone_prominence=5.0,
                orbital_rim_support=5.0,
                symmetry_score=val(front, "symmetry_score", 5.0)
            ),
            nose=NoseMetrics(
                bridge_height=5.0,
                tip_projection=val(profile, "nasolabial_angle", 5.0),
                nostril_symmetry=val(front, "nose_width_ratio", 5.0),
                overall_harmony=5.0
            ),
            lips=LipsMetrics(
                upper_lip_volume=5.0,
                lower_lip_volume=5.0,
                cupids_bow_definition=5.0,
                vermillion_border=5.0,
                philtrum_definition=val(front, "philtrum_length_mm", 5.0),
                lip_symmetry=5.0
            ),
            forehead=ForeheadMetrics(
                brow_bone_projection=5.0,
                temple_hollowing=5.0,
                forehead_symmetry=val(front, "symmetry_score", 5.0),
                skin_texture=5.0
            ),
            skin=SkinMetrics(
                overall_quality=5.0,
                texture_score=5.0,
                clarity_score=5.0,
                tone_evenness=5.0,
                hydration_appearance=5.0,
                pore_visibility=5.0,
                under_eye_darkness=5.0
            ),
            proportions=FacialProportions(
                face_shape="oval",
                facial_thirds_balance=val(front, "midface_ratio", 5.0),
                upper_third_score=val(front, "facial_third_upper_mm", 5.0),
                middle_third_score=val(front, "facial_third_mid_mm", 5.0),
                lower_third_score=val(front, "facial_third_lower_mm", 5.0),
                horizontal_fifths_balance=val(front, "esr", 5.0),
                overall_symmetry=val(front, "symmetry_score", 5.0),
                facial_convexity=val(profile, "facial_convexity", 5.0),
                golden_ratio_adherence=max(0.0, min(10.0, float(golden.get("average_score") or 5.0)))
            ),
            profile=ProfileMetrics(
                forehead_projection=5.0,
                nose_projection=val(profile, "nasolabial_angle", 5.0),
                lip_projection=val(profile, "mentolabial_angle", 5.0),
                chin_projection=val(profile, "chin_projection", 5.0),
                submental_area=5.0,
                ramus_visibility=5.0,
                profile_harmony=val(profile, "facial_convexity", 5.0)
            ),
            hair=HairMetrics(density=5.0, hairline_health=5.0, hair_quality=5.0),
            body_fat=BodyFatIndicators(facial_leanness=5.0, definition_potential=5.0),
            confidence_score=0.9,
            image_quality_front=8.0,
            image_quality_left=8.0,
            image_quality_right=8.0
        )

        # ---- Build improvement suggestions from AI recommendations ----
        improvements: List[ImprovementSuggestion] = []
        raw_recs = ai_recs.get("recommendations", []) if isinstance(ai_recs, dict) else []
        for rec in raw_recs:
            if not isinstance(rec, dict):
                continue
            improvements.append(ImprovementSuggestion(
                area=rec.get("title", "General"),
                priority=ImprovementPriority.MEDIUM,
                current_score=5.0,
                potential_score=7.0,
                suggestion=rec.get("description", rec.get("suggestion", "")),
                exercises=[],
                products=[],
                timeframe="3 months"
            ))

        strengths = ai_recs.get("strengths", []) if isinstance(ai_recs, dict) else []
        summary_text = ai_recs.get("summary", "Analysis complete.") if isinstance(ai_recs, dict) else "Analysis complete."

        return ScanAnalysis(
            metrics=metrics,
            improvements=improvements,
            top_strengths=strengths if isinstance(strengths, list) else [],
            focus_areas=[],
            recommended_courses=[],
            personalized_summary=summary_text,
            estimated_potential=min(10.0, overall_score + 1.0)
        )

    def _create_error_analysis(self, error_msg: str) -> ScanAnalysis:
        """Return a minimal valid ScanAnalysis when the service call fails."""
        def zero_jawline():
            return JawlineMetrics(definition_score=0, symmetry_score=0, masseter_development=0, chin_projection=0, ramus_length=0)

        return ScanAnalysis(
            metrics=FaceMetrics(
                overall_score=0.0,
                harmony_score=0.0,
                jawline=zero_jawline(),
                cheekbones=CheekbonesMetrics(prominence_score=0, width_score=0, hollowness_below=0, symmetry_score=0),
                eye_area=EyeAreaMetrics(symmetry_score=0, upper_eyelid_exposure=0, palpebral_fissure_height=0, under_eye_area=0, brow_bone_prominence=0, orbital_rim_support=0),
                nose=NoseMetrics(bridge_height=0, tip_projection=0, nostril_symmetry=0, overall_harmony=0),
                lips=LipsMetrics(upper_lip_volume=0, lower_lip_volume=0, cupids_bow_definition=0, vermillion_border=0, philtrum_definition=0, lip_symmetry=0),
                forehead=ForeheadMetrics(brow_bone_projection=0, temple_hollowing=0, forehead_symmetry=0, skin_texture=0),
                skin=SkinMetrics(overall_quality=0, texture_score=0, clarity_score=0, tone_evenness=0, hydration_appearance=0, pore_visibility=0, under_eye_darkness=0),
                proportions=FacialProportions(facial_thirds_balance=0, upper_third_score=0, middle_third_score=0, lower_third_score=0, overall_symmetry=0, facial_convexity=0, golden_ratio_adherence=0),
                profile=ProfileMetrics(forehead_projection=0, nose_projection=0, lip_projection=0, chin_projection=0, submental_area=0, ramus_visibility=0, profile_harmony=0),
                hair=HairMetrics(density=0, hairline_health=0, hair_quality=0),
                body_fat=BodyFatIndicators(facial_leanness=0, definition_potential=0),
                confidence_score=0,
                image_quality_front=0,
                image_quality_left=0,
                image_quality_right=0
            ),
            improvements=[],
            top_strengths=[],
            focus_areas=[],
            recommended_courses=[],
            personalized_summary=f"Analysis service unavailable: {error_msg}",
            estimated_potential=0.0
        )


# Singleton
facial_analysis_client = FacialAnalysisClient()
