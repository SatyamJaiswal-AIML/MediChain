import os
import json
import time
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score
import joblib

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))
    csv_path = os.path.join(project_root, "Final_Augmented_dataset_Diseases_and_Symptoms.csv")
    
    models_dir = os.path.join(project_root, "backend", "models_ml")
    os.makedirs(models_dir, exist_ok=True)
    
    print(f"Loading dataset from: {csv_path}")
    start_time = time.time()
    df = pd.read_csv(csv_path)
    print(f"Dataset loaded in {time.time() - start_time:.2f} seconds. Shape: {df.shape}")
    
    y_col = "diseases"
    symptoms_list = [str(c).strip() for c in df.columns if c != y_col]
    
    # Extract plain numpy arrays (avoiding pyarrow extension types)
    X_mat = np.array(df[symptoms_list].values, dtype=np.uint8)
    y_vec = np.array([str(val).strip() for val in df[y_col].values], dtype=object)
    
    # Clean up df
    del df
    
    unique_diseases = np.unique(y_vec)
    print(f"Found {len(symptoms_list)} symptoms and {len(unique_diseases)} unique diseases.")
    
    # Save symptoms list & disease classes JSON
    symptoms_file = os.path.join(models_dir, "symptoms_list.json")
    with open(symptoms_file, "w") as f:
        json.dump(symptoms_list, f, indent=2)
    
    diseases_file = os.path.join(models_dir, "disease_classes.json")
    with open(diseases_file, "w") as f:
        json.dump(unique_diseases.tolist(), f, indent=2)
        
    # Split train / validation sets
    print("Splitting train / validation sets...")
    X_train, X_val, y_train, y_val = train_test_split(X_mat, y_vec, test_size=0.15, random_state=42)
    
    print("Training Multinomial Naive Bayes model in mini-batches...")
    mnb = MultinomialNB(alpha=0.1)
    mnb_start = time.time()
    
    chunk_size = 30000
    num_train = len(X_train)
    
    for i in range(0, num_train, chunk_size):
        X_chunk = X_train[i : i + chunk_size]
        y_chunk = y_train[i : i + chunk_size]
        mnb.partial_fit(X_chunk, y_chunk, classes=unique_diseases)
        print(f"  Batch {i // chunk_size + 1} completed ({min(i + chunk_size, num_train)}/{num_train} samples)")
        
    print(f"MultinomialNB trained in {time.time() - mnb_start:.2f}s")
    
    model_save_path = os.path.join(models_dir, "disease_model.joblib")
    joblib.dump({
        "model": mnb,
        "model_name": "Multinomial Naive Bayes",
        "symptoms": symptoms_list,
        "classes": unique_diseases.tolist(),
    }, model_save_path)
    
    print(f"Successfully saved trained model artifact to: {model_save_path}")
    
    # Evaluate accuracy in chunks
    print("Evaluating validation accuracy...")
    val_preds = []
    num_val = len(X_val)
    for i in range(0, num_val, chunk_size):
        val_preds.extend(mnb.predict(X_val[i : i + chunk_size]))
        
    val_acc = accuracy_score(y_val, val_preds)
    print(f"MultinomialNB Validation Accuracy: {val_acc * 100:.2f}%")

if __name__ == "__main__":
    main()
