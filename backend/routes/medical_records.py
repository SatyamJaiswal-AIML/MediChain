from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from database.mongodb import get_database
from routes.auth import current_patient

router = APIRouter(prefix="/medical-records", tags=["medical-records"])

class MedicalRecordCreate(BaseModel):
    title: str
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

@router.get("")
def get_medical_records(authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    patient_query = {"$or": [{"patient_id": patient["_id"]}, {"patient_id": str(patient["_id"])}]}
    
    records = list(get_database().medical_records.find(patient_query).sort("date", -1))
    
    # If this specific patient account has 0 records in MongoDB, seed demo medical records for this patient
    if len(records) == 0:
        seeded = []
        for demo in DEFAULT_DEMO_RECORDS:
            doc = {
                "patient_id": patient["_id"],
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
            res = get_database().medical_records.insert_one(doc)
            doc["_id"] = res.inserted_id
            seeded.append(serialize_record(doc))
        return seeded
        
    return [serialize_record(r) for r in records]

@router.post("")
def add_medical_record(payload: MedicalRecordCreate, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    doc = {
        "patient_id": patient["_id"],
        "title": payload.title.strip() if payload.title else "Medical Examination",
        "type": payload.type or "Consultation",
        "doctor": payload.doctor.strip() if payload.doctor else "Attending Physician",
        "hospital": payload.hospital.strip() if payload.hospital else "Hospital Network",
        "date": payload.date.strip() if payload.date else today_str,
        "summary": payload.summary.strip() if payload.summary else "Routine consultation notes.",
        "labValues": payload.labValues or [],
        "prescriptionItems": payload.prescriptionItems or [],
        "createdAt": datetime.now(timezone.utc)
    }
    res = get_database().medical_records.insert_one(doc)
    doc["_id"] = res.inserted_id
    return serialize_record(doc)

@router.delete("/{record_id}")
def delete_medical_record(record_id: str, authorization: str | None = Header(default=None)):
    patient = current_patient(authorization)
    patient_query = {"$or": [{"patient_id": patient["_id"]}, {"patient_id": str(patient["_id"])}]}
    
    try:
        oid = ObjectId(record_id)
        res = get_database().medical_records.delete_one({"_id": oid, **patient_query})
        if res.deleted_count == 0:
            get_database().medical_records.delete_one({"title": record_id, **patient_query})
    except Exception:
        get_database().medical_records.delete_one({"title": record_id, **patient_query})
        
    return {"success": True}
