"""
Individual Tiger Re-Identification Decision Engine.
Implements the 3-tier calibrated policy:
  - AUTO_MATCH: Cosine Similarity >= 0.78
  - REVIEW_REQUIRED: 0.58 <= Cosine Similarity < 0.78
  - NEW_INDIVIDUAL: Cosine Similarity < 0.58
"""

import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from config import settings
from db_manager import DatabaseManager
from db_models import Tiger

logger = logging.getLogger("TigerTrace.IdentityService")


@dataclass
class ReIDDecision:
    decision: str  # "AUTO_MATCH", "REVIEW_REQUIRED", "NEW_INDIVIDUAL"
    tiger_id: uuid.UUID
    tiger_code: str
    tiger_name: Optional[str]
    similarity_score: float
    verification_status: str  # "AUTO", "REVIEW_REQUIRED"
    is_new_tiger: bool
    top_candidates: List[Dict[str, Any]]
    decision_reason: str


class IdentityService:
    """Orchestrates candidate retrieval, similarity scoring, and Re-ID policy execution."""

    def __init__(
        self,
        db_manager: DatabaseManager,
        auto_match_threshold: float = settings.AUTO_MATCH_THRESHOLD,
        review_threshold: float = settings.REVIEW_THRESHOLD,
        new_individual_threshold: float = settings.NEW_INDIVIDUAL_THRESHOLD,
    ):
        self.db = db_manager
        self.auto_match_threshold = auto_match_threshold
        self.review_threshold = review_threshold
        self.new_individual_threshold = new_individual_threshold

    def evaluate_identity(
        self,
        query_embedding: np.ndarray,
        flank_crop_id: Optional[uuid.UUID] = None,
        flank_side: str = "UNKNOWN",
        crop_quality: float = 1.0,
        representative_image_id: Optional[uuid.UUID] = None,
    ) -> ReIDDecision:
        """
        Match 512-D query embedding against pgvector reference embeddings
        and apply the 3-tier decision policy.
        """
        emb_list = query_embedding.tolist() if isinstance(query_embedding, np.ndarray) else query_embedding

        # Query top-5 candidates using pgvector cosine distance
        candidates = self.db.query_top_k_reid_candidates(emb_list, top_k=5)

        top_candidates_meta = []
        for tiger, sim, emb_id in candidates:
            top_candidates_meta.append({
                "tiger_id": str(tiger.id),
                "public_code": tiger.public_code,
                "name": tiger.name,
                "similarity": round(sim, 4),
                "embedding_id": str(emb_id),
            })

        # Scenario 1: No tigers in database yet
        if not candidates:
            new_tiger = self.db.enroll_new_tiger(
                sex="UNKNOWN",
                initial_confidence=0.80,
                representative_image_id=representative_image_id,
                metadata={"enrolled_reason": "INITIAL_CATALOGUE_ENTRY"},
            )
            # Store initial reference embedding
            self.db.persist_tiger_embedding(
                tiger_id=new_tiger.id,
                embedding=emb_list,
                flank_crop_id=flank_crop_id,
                is_reference=True,
                quality_score=crop_quality,
            )

            return ReIDDecision(
                decision="NEW_INDIVIDUAL",
                tiger_id=new_tiger.id,
                tiger_code=new_tiger.public_code,
                tiger_name=new_tiger.name,
                similarity_score=1.0,
                verification_status="AUTO",
                is_new_tiger=True,
                top_candidates=[],
                decision_reason="First catalogued individual enrolled into clean database.",
            )

        best_tiger, best_similarity, best_emb_id = candidates[0]

        # Scenario 2: High Confidence Match -> AUTO_MATCH
        if best_similarity >= self.auto_match_threshold:
            # Add embedding to existing tiger's profile
            self.db.persist_tiger_embedding(
                tiger_id=best_tiger.id,
                embedding=emb_list,
                flank_crop_id=flank_crop_id,
                is_reference=False,
                quality_score=crop_quality,
            )

            return ReIDDecision(
                decision="AUTO_MATCH",
                tiger_id=best_tiger.id,
                tiger_code=best_tiger.public_code,
                tiger_name=best_tiger.name,
                similarity_score=round(best_similarity, 4),
                verification_status="AUTO",
                is_new_tiger=False,
                top_candidates=top_candidates_meta,
                decision_reason=(
                    f"Strong cosine similarity ({best_similarity:.3f} >= {self.auto_match_threshold:.2f}) "
                    f"with verified individual {best_tiger.public_code}."
                ),
            )

        # Scenario 3: Borderline Match -> REVIEW_REQUIRED
        elif best_similarity >= self.review_threshold:
            # Associate tentatively with top candidate but queue for human review
            task_meta = {
                "top_candidate_code": best_tiger.public_code,
                "top_candidate_id": str(best_tiger.id),
                "similarity_score": round(best_similarity, 4),
                "flank_side": flank_side,
                "all_candidates": top_candidates_meta,
            }
            if flank_crop_id:
                self.db.create_review_task(
                    task_type="TIGER_MATCH",
                    entity_id=flank_crop_id,
                    metadata=task_meta,
                )

            return ReIDDecision(
                decision="REVIEW_REQUIRED",
                tiger_id=best_tiger.id,
                tiger_code=best_tiger.public_code,
                tiger_name=best_tiger.name,
                similarity_score=round(best_similarity, 4),
                verification_status="REVIEW_REQUIRED",
                is_new_tiger=False,
                top_candidates=top_candidates_meta,
                decision_reason=(
                    f"Borderline similarity ({best_similarity:.3f} between {self.review_threshold:.2f} "
                    f"and {self.auto_match_threshold:.2f}) requiring expert biologist verification."
                ),
            )

        # Scenario 4: Low Similarity to all known tigers -> NEW_INDIVIDUAL
        else:
            new_tiger = self.db.enroll_new_tiger(
                sex="UNKNOWN",
                initial_confidence=0.85,
                representative_image_id=representative_image_id,
                metadata={
                    "enrolled_reason": "LOW_SIMILARITY_TO_EXISTING_CATALOGUE",
                    "highest_seen_similarity": round(best_similarity, 4),
                    "closest_candidate": best_tiger.public_code,
                },
            )
            # Store initial reference embedding
            self.db.persist_tiger_embedding(
                tiger_id=new_tiger.id,
                embedding=emb_list,
                flank_crop_id=flank_crop_id,
                is_reference=True,
                quality_score=crop_quality,
            )

            return ReIDDecision(
                decision="NEW_INDIVIDUAL",
                tiger_id=new_tiger.id,
                tiger_code=new_tiger.public_code,
                tiger_name=new_tiger.name,
                similarity_score=round(best_similarity, 4),
                verification_status="AUTO",
                is_new_tiger=True,
                top_candidates=top_candidates_meta,
                decision_reason=(
                    f"Distinctive stripe pattern; top match {best_tiger.public_code} similarity "
                    f"({best_similarity:.3f}) below threshold ({self.new_individual_threshold:.2f}). "
                    f"Auto-enrolled as new candidate {new_tiger.public_code}."
                ),
            )
