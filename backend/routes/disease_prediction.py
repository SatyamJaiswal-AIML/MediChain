import os
import json
import re
from typing import List, Optional, Dict
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import numpy as np
import joblib

router = APIRouter(prefix="/api", tags=["disease-prediction"])

MODEL_CACHE = None
SYMPTOMS_CACHE = None

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models_ml")
MODEL_FILE = os.path.join(MODELS_DIR, "disease_model.joblib")
SYMPTOMS_FILE = os.path.join(MODELS_DIR, "symptoms_list.json")

MULTILINGUAL_DICTIONARY: Dict[str, List[str]] = {
    # Fever & Body Temp
    "fever": ["fever", "bukhar", "fiebre", "fièvre", "high temp", "temperature", "body hot", "garam sharir", "pyrexia"],
    "chills": ["chills", "thand", "thand lagna", "shivering", "escalofríos", "frissons"],
    "sweating": ["sweating", "pasina", "sudor", "transpiration", "excessive sweat"],
    "feeling cold": ["feeling cold", "thand lagna", "cold feeling", "sentir frío"],
    
    # Respiratory & Throat
    "cough": ["cough", "khansi", "khaansi", "tos", "toux", "coughing"],
    "shortness of breath": ["shortness of breath", "sans me taklif", "dama", "falta de aire", "breathless", "hard to breathe", "dyspnea", "breathing difficulty"],
    "sore throat": ["sore throat", "gala kharab", "gale me dard", "dolor de garganta", "mal de gorge", "throat pain"],
    "nasal congestion": ["nasal congestion", "naak band", "stuffy nose", "congestión nasal", "blocked nose", "runny nose"],
    "sneezing": ["sneezing", "chink", "chheenk", "estornudos", "éternuement"],
    "wheezing": ["wheezing", "saansaain", "silbido al respirar", "whistling breath"],
    
    # Head, Mind & Pain
    "headache": ["headache", "sar dard", "sir dard", "dolor de cabeza", "maux de tête", "migraine"],
    "dizziness": ["dizziness", "chakkar", "mareo", "vertigo", "head spinning"],
    "fatigue": ["fatigue", "thakan", "thakavat", "cansancio", "tiredness", "exhaustion", "weakness", "kamzori"],
    "insomnia": ["insomnia", "neend na ana", "insomnio", "sleep problem", "cannot sleep"],
    
    # Chest & Cardiac
    "sharp chest pain": ["chest pain", "seene me dard", "dolor de pecho", "douleur thoracique", "chest tightness", "chest ache"],
    "palpitations": ["palpitations", "dil ki dhadkan", "palpitaciones", "fast heart beat", "racing heart"],
    
    # Gastrointestinal & Abdominal
    "nausea": ["nausea", "ji ghabrana", "vomit feeling", "náuseas", "nauseous"],
    "vomiting": ["vomiting", "ulti", "vómito", "throwing up", "vomit"],
    "sharp abdominal pain": ["abdominal pain", "pet me dard", "stomach ache", "dolor de estómago", "stomach pain", "tummy ache", "belly pain"],
    "diarrhea": ["diarrhea", "dast", "patli potty", "diarrea", "loose motion"],
    "heartburn": ["heartburn", "seene me jalan", "acidity", "ardor de estómago", "acid reflux"],
    "flatulence": ["flatulence", "gas", "bloating", "stomach gas", "gases"],
    "constipation": ["constipation", "kabz", "estreñimiento", "bowel problem"],
    
    # Skin & Allergies
    "itching of skin": ["itching", "khujli", "picazón", "démangeaison", "itchy skin"],
    "skin rash": ["skin rash", "daane", "rashes", "sarpullido", "skin allergy", "red spots"],
    "allergic reaction": ["allergy", "allergic", "alergia", "reaction"],
    
    # Musculoskeletal
    "joint pain": ["joint pain", "jod me dard", "jodon me dard", "dolor articular", "joints aching"],
    "back pain": ["back pain", "peeth me dard", "kamar dard", "dolor de espalda"],
    "neck pain": ["neck pain", "gardan me dard", "dolor de cuello"],
    "muscle pain": ["muscle pain", "p मांसपेशियों me dard", "body ache", "dolor muscular", "body pain", "badan dard"]
}

def load_ml_resources():
    global MODEL_CACHE, SYMPTOMS_CACHE
    if MODEL_CACHE is None:
        if not os.path.exists(MODEL_FILE):
            raise RuntimeError(f"ML Model file not found at {MODEL_FILE}. Please run model training script.")
        MODEL_CACHE = joblib.load(MODEL_FILE)
    
    if SYMPTOMS_CACHE is None:
        if not os.path.exists(SYMPTOMS_FILE):
            raise RuntimeError(f"Symptoms list file not found at {SYMPTOMS_FILE}.")
        with open(SYMPTOMS_FILE, "r") as f:
            SYMPTOMS_CACHE = json.load(f)
            
    return MODEL_CACHE, SYMPTOMS_CACHE

class PredictRequest(BaseModel):
    symptoms: List[str]
    top_k: Optional[int] = 5

class ExtractTextRequest(BaseModel):
    text: str

class PredictionItem(BaseModel):
    disease: str
    confidence: float
    rank: int

class PredictResponse(BaseModel):
    success: bool
    predictions: List[PredictionItem]
    symptoms_analyzed: List[str]
    matched_count: int
    unmatched_symptoms: List[str]
    model_name: str

class ExtractTextResponse(BaseModel):
    success: bool
    extracted_symptoms: List[str]
    input_text: str

@router.get("/symptoms")
def get_symptoms_list(search: Optional[str] = Query(None)):
    try:
        _, symptoms = load_ml_resources()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    if search:
        search_lower = search.strip().lower()
        filtered = [s for s in symptoms if search_lower in s.lower()]
        return {"symptoms": filtered, "total": len(filtered)}
        
    return {"symptoms": symptoms, "total": len(symptoms)}

@router.post("/extract-symptoms", response_model=ExtractTextResponse)
def extract_symptoms_from_text(payload: ExtractTextRequest):
    if not payload.text or not payload.text.strip():
        return ExtractTextResponse(success=True, extracted_symptoms=[], input_text="")
        
    try:
        _, symptoms_list = load_ml_resources()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    text_lower = payload.text.strip().lower()
    extracted = set()
    
    for canonical_symptom, aliases in MULTILINGUAL_DICTIONARY.items():
        for alias in aliases:
            pattern = r'\b' + re.escape(alias) + r'\b'
            if re.search(pattern, text_lower) or alias in text_lower:
                if canonical_symptom in symptoms_list:
                    extracted.add(canonical_symptom)
                break
                
    for sym in symptoms_list:
        sym_lower = sym.lower()
        if len(sym_lower) > 3 and sym_lower in text_lower:
            extracted.add(sym)
            
    return ExtractTextResponse(
        success=True,
        extracted_symptoms=sorted(list(extracted)),
        input_text=payload.text
    )

@router.post("/predict-disease", response_model=PredictResponse)
def predict_disease(payload: PredictRequest):
    if not payload.symptoms or len(payload.symptoms) == 0:
        raise HTTPException(status_code=400, detail="Please select at least one symptom.")
        
    try:
        model_data, symptoms_list = load_ml_resources()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Model error: {str(e)}")
        
    model = model_data["model"]
    classes = model_data.get("classes")
    if classes is None and hasattr(model, "classes_"):
        classes = model.classes_.tolist()
        
    model_name = model_data.get("model_name", "Multinomial Naive Bayes")
    
    symptom_map = {s.strip().lower(): idx for idx, s in enumerate(symptoms_list)}
    
    matched_symptoms = []
    matched_indices = []
    unmatched_symptoms = []
    
    for user_symptom in payload.symptoms:
        norm_symptom = user_symptom.strip().lower()
        if norm_symptom in symptom_map:
            idx = symptom_map[norm_symptom]
            matched_symptoms.append(user_symptom)
            matched_indices.append(idx)
        else:
            unmatched_symptoms.append(user_symptom)
            
    if len(matched_symptoms) == 0:
        raise HTTPException(status_code=400, detail="None of the provided symptoms matched our medical database.")
        
    feature_count = getattr(model, "feature_count_", None)
    
    if feature_count is not None:
        # Sum total positive occurrences of user's symptoms for each disease class
        pos_symptom_counts = np.sum(feature_count[:, matched_indices], axis=1)
        
        # Calculate symptom ratio: fraction of user's symptoms present in disease
        symptom_match_ratio = np.mean(feature_count[:, matched_indices] > 0, axis=1)
        
        # Weight by log frequency of symptom occurrences in dataset for that disease
        freq_weight = np.log1p(pos_symptom_counts)
        
        composite_score = (symptom_match_ratio * 0.4) + (freq_weight * 0.6)
        probabilities = composite_score
    else:
        feature_vector = np.zeros(len(symptoms_list), dtype=np.float32)
        for idx in matched_indices:
            feature_vector[idx] = 1.0
        probabilities = model.predict_proba([feature_vector])[0]
    
    top_k_count = min(payload.top_k or 5, len(classes))
    top_indices = np.argsort(probabilities)[::-1][:top_k_count]
    
    top_probs = probabilities[top_indices]
    sum_top = np.sum(top_probs)
    if sum_top > 0:
        top_probs = top_probs / sum_top
        
    predictions = []
    for rank, idx in enumerate(top_indices, start=1):
        formatted_prob = round(float(top_probs[rank - 1]) * 100, 1)
        disease_name = str(classes[idx]).title()
        predictions.append(
            PredictionItem(
                disease=disease_name,
                confidence=formatted_prob,
                rank=rank
            )
        )
        
    return PredictResponse(
        success=True,
        predictions=predictions,
        symptoms_analyzed=matched_symptoms,
        matched_count=len(matched_symptoms),
        unmatched_symptoms=unmatched_symptoms,
        model_name=model_name
    )
