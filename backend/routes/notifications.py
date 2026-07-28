from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from database.mongodb import get_database
from routes.auth import current_patient

router = APIRouter(prefix="/notifications", tags=["notifications"])

def serialize_notif(item: dict) -> dict:
    item["id"] = str(item.pop("_id"))
    item["patient_id"] = str(item.get("patient_id", ""))
    if isinstance(item.get("createdAt"), datetime):
        item["createdAt"] = item["createdAt"].isoformat()
    return item

def create_patient_notification(patient_id: str | ObjectId, title: str, message: str, notif_type: str = "info"):
    """
    Helper function to insert a notification into MongoDB for a patient.
    """
    try:
        pid = ObjectId(patient_id) if isinstance(patient_id, str) else patient_id
        doc = {
            "patient_id": pid,
            "title": title,
            "message": message,
            "type": notif_type,
            "unread": True,
            "createdAt": datetime.now(timezone.utc)
        }
        get_database().notifications.insert_one(doc)
    except Exception as e:
        print(f"Failed to create notification for patient {patient_id}: {e}")

@router.get("")
def list_notifications(authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    records = get_database().notifications.find({"patient_id": patient["_id"]}).sort("createdAt", -1).limit(20)
    return [serialize_notif(r) for r in records]

@router.patch("/{notification_id}/read")
def mark_read(notification_id: str, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    try:
        oid = ObjectId(notification_id)
    except Exception as exc:
        raise HTTPException(400, "Invalid notification id.") from exc
        
    res = get_database().notifications.update_one(
        {"_id": oid, "patient_id": patient["_id"]},
        {"$set": {"unread": False}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Notification not found.")
    return {"success": True}

@router.post("/mark-all-read")
def mark_all_read(authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    get_database().notifications.update_many(
        {"patient_id": patient["_id"], "unread": True},
        {"$set": {"unread": False}}
    )
    return {"success": True}
