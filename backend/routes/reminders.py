from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from bson import ObjectId

from database.mongodb import get_database
from routes.auth import current_patient

router = APIRouter(prefix="/reminders", tags=["reminders"])

class ReminderCreate(BaseModel):
    medicine: str = Field(min_length=1, max_length=200)
    time: str = Field(min_length=1, max_length=50)

def serialize_reminder(item: dict) -> dict:
    item["id"] = str(item.pop("_id"))
    item["patient_id"] = str(item.get("patient_id", ""))
    if isinstance(item.get("createdAt"), datetime):
        item["createdAt"] = item["createdAt"].isoformat()
    return item

@router.get("")
def list_reminders(authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    records = get_database().medication_reminders.find({"patient_id": patient["_id"]}).sort("createdAt", -1)
    results = [serialize_reminder(r) for r in records]
    
    # If new patient with 0 reminders, seed initial default reminders
    if len(results) == 0:
        default_items = [
            {"medicine": "Cetirizine 10mg", "time": "9:00 PM", "done": False},
            {"medicine": "Multivitamin", "time": "8:00 AM", "done": True},
            {"medicine": "Fluticasone Nasal Spray", "time": "9:30 PM", "done": False},
        ]
        seeded = []
        for item in default_items:
            doc = {
                "patient_id": patient["_id"],
                "medicine": item["medicine"],
                "time": item["time"],
                "done": item["done"],
                "createdAt": datetime.now(timezone.utc)
            }
            res = get_database().medication_reminders.insert_one(doc)
            doc["_id"] = res.inserted_id
            seeded.append(serialize_reminder(doc))
        return seeded
        
    return results

@router.post("")
def create_reminder(payload: ReminderCreate, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    doc = {
        "patient_id": patient["_id"],
        "medicine": payload.medicine.strip(),
        "time": payload.time.strip(),
        "done": False,
        "createdAt": datetime.now(timezone.utc)
    }
    res = get_database().medication_reminders.insert_one(doc)
    doc["_id"] = res.inserted_id
    return serialize_reminder(doc)

@router.patch("/{reminder_id}/toggle")
def toggle_reminder(reminder_id: str, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    try:
        oid = ObjectId(reminder_id)
    except Exception as exc:
        raise HTTPException(400, "Invalid reminder id.") from exc
        
    record = get_database().medication_reminders.find_one({"_id": oid, "patient_id": patient["_id"]})
    if not record:
        raise HTTPException(404, "Reminder not found.")
        
    new_done = not record.get("done", False)
    get_database().medication_reminders.update_one({"_id": oid}, {"$set": {"done": new_done}})
    record["done"] = new_done
    return serialize_reminder(record)

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: str, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    try:
        oid = ObjectId(reminder_id)
    except Exception as exc:
        raise HTTPException(400, "Invalid reminder id.") from exc
        
    res = get_database().medication_reminders.delete_one({"_id": oid, "patient_id": patient["_id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Reminder not found.")
    return {"success": True}
