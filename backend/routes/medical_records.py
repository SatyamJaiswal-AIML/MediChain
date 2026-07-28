from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from database.mongodb import get_database
from routes.auth import current_patient

router = APIRouter(prefix="/medical-records", tags=["medical-records"])

class MedicalRecordCreate(BaseModel):
    title: Optional[str] = "Medical Examination"
    type: Optional[str] = "Consultation"
    doctor: Optional[str] = "Attending Physician"
    hospital: Optional[str] = "Hospital Network"
    date: Optional[str] = ""
    summary: Optional[str] = ""
    labValues: Optional[List[Dict[str, Any]]] = []
    prescriptionItems: Optional[List[Dict[str, Any]]] = []

def serialize_record(item: dict) -> dict:
    item["id"] = str(item.pop("_id"))
    item["patient_id"] = str(item.get("patient_id", ""))
    if isinstance(item.get("createdAt"), datetime):
        item["createdAt"] = item["createdAt"].isoformat()
    return item

DEFAULT_DEMO_RECORDS = [
    {
        "date": "2026-07-02",
        "type": "Lab Report",
        "title": "Complete Blood Count",
        "doctor": "Dr. Rhea Kapoor",
        "hospital": "Fortis Escorts Heart Institute",
        "summary": "All parameters within normal range.",
        "labValues": [
            {"parameter": "Hemoglobin", "value": "13.8 g/dL", "referenceRange": "13.0–17.0", "flag": "normal"},
            {"parameter": "WBC Count", "value": "7,200 /µL", "referenceRange": "4,000–11,000", "flag": "normal"},
            {"parameter": "Platelet Count", "value": "410,000 /µL", "referenceRange": "150,000–450,000", "flag": "normal"},
        ]
    },
    {
        "date": "2026-06-18",
        "type": "Consultation",
        "title": "General Checkup",
        "doctor": "Dr. Vikram Nair",
        "hospital": "Apollo Hospital, Noida",
        "summary": "Routine follow-up, no concerns raised. Advised to continue current lifestyle and re-check in 6 months."
    },
    {
        "date": "2026-05-27",
        "type": "Prescription",
        "title": "Antihistamine Course",
        "doctor": "Dr. Rhea Kapoor",
        "hospital": "Fortis Escorts Heart Institute",
        "summary": "5-day course prescribed for seasonal allergic rhinitis.",
        "prescriptionItems": [
            {"medicine": "Cetirizine 10mg", "dosage": "1 tablet, once daily (night)", "duration": "5 days"},
            {"medicine": "Fluticasone Nasal Spray", "dosage": "2 sprays each nostril, once daily", "duration": "10 days"}
        ]
    },
    {
        "date": "2026-04-09",
        "type": "Lab Report",
        "title": "Fasting Lipid Profile",
        "doctor": "Dr. Vikram Nair",
        "hospital": "Apollo Hospital, Noida",
        "summary": "LDL cholesterol slightly elevated; dietary adjustment recommended.",
        "labValues": [
            {"parameter": "Total Cholesterol", "value": "198 mg/dL", "referenceRange": "< 200", "flag": "normal"},
            {"parameter": "LDL Cholesterol", "value": "132 mg/dL", "referenceRange": "< 100", "flag": "high"},
            {"parameter": "HDL Cholesterol", "value": "52 mg/dL", "referenceRange": "> 40", "flag": "normal"}
        ]
    },
    {
        "date": "2026-02-21",
        "type": "Procedure",
        "title": "Echocardiogram (2D Echo)",
        "doctor": "Dr. Rhea Kapoor",
        "hospital": "Fortis Escorts Heart Institute",
        "summary": "Ejection fraction normal at 62%. No structural abnormalities detected."
    }
]

def get_patient_identity(authorization: str | None) -> tuple[Any, dict]:
    patient = current_patient(authorization)
    return patient["_id"], {"$or": [{"patient_id": patient["_id"]}, {"patient_id": str(patient["_id"])}]}

@router.get("")
def get_medical_records(authorization: str | None = Header(default=None)):
    pid, patient_query = get_patient_identity(authorization)
    db = get_database()
    
    # Query MongoDB for records belonging to this specific patient
    records = list(db.medical_records.find(patient_query).sort("date", -1))
    patient_meta = db.patient_metadata.find_one(patient_query)
    
    # If this user account has NEVER initialized demo records in MongoDB, seed initial demo records once
    if not patient_meta:
        db.patient_metadata.insert_one({"patient_id": pid, "has_initialized_demo": True})
        if len(records) == 0:
            seeded = []
            for demo in DEFAULT_DEMO_RECORDS:
                doc = {
                    "patient_id": pid,
                    "title": demo["title"],
                    "type": demo["type"],
                    "doctor": demo["doctor"],
                    "hospital": demo["hospital"],
                    "date": demo["date"],
                    "summary": demo["summary"],
                    "labValues": demo.get("labValues", []),
                    "prescriptionItems": demo.get("prescriptionItems", []),
                    "createdAt": datetime.now(timezone.utc)
                }
                res = db.medical_records.insert_one(doc)
                doc["_id"] = res.inserted_id
                seeded.append(serialize_record(doc))
            # Sort chronologically (newest date first)
            seeded.sort(key=lambda r: r.get("date", ""), reverse=True)
            return seeded
            
    # Sort chronologically by date (newest date first)
    results = [serialize_record(r) for r in records]
    results.sort(key=lambda r: r.get("date", ""), reverse=True)
    return results

@router.post("")
def add_medical_record(payload: MedicalRecordCreate, authorization: str | None = Header(default=None)):
    pid, patient_query = get_patient_identity(authorization)
    today_str = datetime.now().strftime("%Y-%m-%d")
    db = get_database()
    
    doc = {
        "patient_id": pid,
        "title": (payload.title or "Medical Examination").strip(),
        "type": payload.type or "Consultation",
        "doctor": (payload.doctor or "Attending Physician").strip(),
        "hospital": (payload.hospital or "Hospital Network").strip(),
        "date": (payload.date or today_str).strip(),
        "summary": (payload.summary or "Routine consultation notes.").strip(),
        "labValues": payload.labValues or [],
        "prescriptionItems": payload.prescriptionItems or [],
        "createdAt": datetime.now(timezone.utc)
    }
    res = db.medical_records.insert_one(doc)
    doc["_id"] = res.inserted_id
    
    # Mark initialization flag
    db.patient_metadata.update_one(patient_query, {"$set": {"has_initialized_demo": True}}, upsert=True)
    
    return serialize_record(doc)

@router.delete("/{record_id}")
def delete_medical_record(record_id: str, authorization: str | None = Header(default=None)):
    pid, patient_query = get_patient_identity(authorization)
    db = get_database()
    
    # Mark initialization flag
    db.patient_metadata.update_one(patient_query, {"$set": {"has_initialized_demo": True}}, upsert=True)
    
    try:
        oid = ObjectId(record_id)
        db.medical_records.delete_one({"_id": oid})
    except Exception:
        db.medical_records.delete_one({"id": record_id, **patient_query})
        db.medical_records.delete_one({"title": record_id, **patient_query})
        
    return {"success": True}
