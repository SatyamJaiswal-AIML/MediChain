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
    date: Optional[str] = ""
    time: Optional[str] = "09:00 AM"

def serialize_reminder(item: dict) -> dict:
    item["id"] = str(item.pop("_id"))
    item["patient_id"] = str(item.get("patient_id", ""))
    if isinstance(item.get("createdAt"), datetime):
        item["createdAt"] = item["createdAt"].isoformat()
    return item

@router.get("")
def list_reminders(authorization: str | None = Header(default=None)):
    try:
        patient = current_patient(authorization)
    except HTTPException:
        return []
        
    records = get_database().medication_reminders.find({"patient_id": patient["_id"]}).sort("createdAt", -1)
    results = [serialize_reminder(r) for r in records]
    
    # Seed default initial reminders for new patients
    if len(results) == 0:
        today_str = datetime.now().strftime("%Y-%m-%d")
        default_items = [
            {"medicine": "Cetirizine 10mg", "date": today_str, "time": "09:00 PM", "done": False},
            {"medicine": "Multivitamin", "date": today_str, "time": "08:00 AM", "done": True},
            {"medicine": "Fluticasone Nasal Spray", "date": today_str, "time": "09:30 PM", "done": False},
        ]
        seeded = []
        for item in default_items:
            doc = {
                "patient_id": patient["_id"],
                "medicine": item["medicine"],
                "date": item["date"],
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
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    doc = {
        "patient_id": patient["_id"],
        "medicine": payload.medicine.strip(),
        "date": payload.date.strip() if payload.date else today_str,
        "time": payload.time.strip() if payload.time else "09:00 AM",
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
