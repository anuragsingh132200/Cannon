"""
Face Scan Agent
High-level interface for face analysis
"""

from typing import Optional
from models.scan import ScanAnalysis
from agents.langgraph_workflow import run_face_analysis_pipeline


class FaceScanAgent:
    """Agent for performing face scan analysis"""
    
    def __init__(self):
        """Initialize the face scan agent"""
        pass
    
    async def analyze(
        self,
        front_image: bytes,
        left_image: bytes,
        right_image: bytes
    ) -> ScanAnalysis:
        """
        Analyze face images and return comprehensive results
        
        Args:
            front_image: Front-facing photo bytes
            left_image: Left profile photo bytes
            right_image: Right profile photo bytes
            
        Returns:
            ScanAnalysis with all metrics, improvements, and recommendations
        """
        return await run_face_analysis_pipeline(front_image, left_image, right_image)

    async def analyze_video(self, video_data: bytes) -> ScanAnalysis:
        """
        Analyze a face video by extracting frames and running analysis
        
        Args:
            video_data: Video file bytes
            
        Returns:
            ScanAnalysis with complete face metrics
        """
        from agents.langgraph_workflow import run_video_analysis_pipeline
        return await run_video_analysis_pipeline(video_data)


# Singleton instance
face_scan_agent = FaceScanAgent()
