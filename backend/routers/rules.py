"""
Rules Router - CRUD operations for fraud detection rules
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, List, Optional, Any
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from business_rules import ConfigManager

# Initialize router
router = APIRouter()

# Initialize config manager
config_path = Path(__file__).parent.parent.parent / "config"
config_mgr = ConfigManager(str(config_path))

@router.get("/rules")
async def list_rules(version: str = Query(default="v1", description="Config version")):
    """
    Get all rules from the specified config version

    Returns list of rule dictionaries with id, name, conditions, logic, outcome
    """
    try:
        config = config_mgr.load_rules(version=version)
        return {
            "version": config.get("version"),
            "domain": config.get("domain"),
            "created_at": config.get("created_at"),
            "features": config.get("features", {}),
            "rules": config.get("rules", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load rules: {str(e)}")

@router.get("/rules/{rule_id}")
async def get_rule(rule_id: str, version: str = Query(default="v1")):
    """Get a specific rule by ID"""
    try:
        config = config_mgr.load_rules(version=version)
        rules = config.get("rules", [])

        rule = next((r for r in rules if r.get("id") == rule_id), None)
        if not rule:
            raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")

        return rule
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rules")
async def create_rule(
    rule: Dict[str, Any],
    version: str = Query(default="v1"),
    position: Optional[int] = Query(default=None, description="Insert position (None = append)")
):
    """
    Create a new rule

    Request body should contain:
    - id: str
    - name: str
    - conditions: list of {field, operator, value}
    - logic: 'AND' | 'OR' | 'ALWAYS'
    - outcome: {risk_score, decision, reason}
    """
    try:
        # Validate rule structure
        errors = config_mgr.validate_rule(rule)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        # Add rule
        config_mgr.add_rule(rule, position=position, version=version)

        return {
            "status": "created",
            "rule_id": rule.get("id"),
            "message": f"Rule {rule.get('id')} created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/rules/{rule_id}")
async def update_rule(
    rule_id: str,
    updated_rule: Dict[str, Any],
    version: str = Query(default="v1")
):
    """
    Update an existing rule

    The rule_id in the path must match the id in the request body
    """
    try:
        # Ensure IDs match
        if updated_rule.get("id") != rule_id:
            raise HTTPException(
                status_code=400,
                detail=f"Rule ID mismatch: path={rule_id}, body={updated_rule.get('id')}"
            )

        # Validate updated rule
        errors = config_mgr.validate_rule(updated_rule)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        # Update rule
        success = config_mgr.update_rule(rule_id, updated_rule, version=version)

        if not success:
            raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")

        return {
            "status": "updated",
            "rule_id": rule_id,
            "message": f"Rule {rule_id} updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: str,
    version: str = Query(default="v1")
):
    """
    Delete a rule by ID

    Note: Cannot delete the DEFAULT rule (logic: ALWAYS)
    """
    try:
        # Check if it's the DEFAULT rule
        config = config_mgr.load_rules(version=version)
        rule = next((r for r in config.get("rules", []) if r.get("id") == rule_id), None)

        if rule and rule.get("logic") == "ALWAYS":
            raise HTTPException(
                status_code=400,
                detail="Cannot delete DEFAULT rule (logic: ALWAYS)"
            )

        # Delete rule
        success = config_mgr.delete_rule(rule_id, version=version)

        if not success:
            raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")

        return {
            "status": "deleted",
            "rule_id": rule_id,
            "message": f"Rule {rule_id} deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rules/reorder")
async def reorder_rules(
    rule_ids: List[str],
    version: str = Query(default="v1")
):
    """
    Reorder rules by providing ordered list of rule IDs

    The DEFAULT rule (logic: ALWAYS) must be last in the list
    """
    try:
        config = config_mgr.load_rules(version=version)
        existing_rules = config.get("rules", [])

        # Validate all IDs exist
        existing_ids = {r.get("id") for r in existing_rules}
        provided_ids = set(rule_ids)

        if existing_ids != provided_ids:
            missing = existing_ids - provided_ids
            extra = provided_ids - existing_ids
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Rule ID mismatch",
                    "missing": list(missing) if missing else None,
                    "extra": list(extra) if extra else None
                }
            )

        # Check DEFAULT rule is last
        last_rule = next(r for r in existing_rules if r.get("id") == rule_ids[-1])
        if last_rule.get("logic") != "ALWAYS":
            raise HTTPException(
                status_code=400,
                detail="DEFAULT rule (logic: ALWAYS) must be last in the order"
            )

        # Reorder
        config_mgr.reorder_rules(rule_ids, version=version)

        return {
            "status": "reordered",
            "rule_count": len(rule_ids),
            "message": "Rules reordered successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rules/validate")
async def validate_rule_endpoint(rule: Dict[str, Any]):
    """
    Validate a rule without saving it

    Returns list of validation errors (empty if valid)
    """
    try:
        errors = config_mgr.validate_rule(rule)
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules/metadata/next-id")
async def get_next_rule_id(version: str = Query(default="v1")):
    """Get the next available rule ID"""
    try:
        config = config_mgr.load_rules(version=version)
        next_id = config_mgr.get_next_rule_id(config)
        return {"next_id": next_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
