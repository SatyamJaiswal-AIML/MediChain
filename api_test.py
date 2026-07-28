import requests

API_URL = "http://localhost:8000"

def test():
    # 1. Register a test user
    print("Registering test user...")
    res = requests.post(f"{API_URL}/auth/register", json={
        "name": "Test User",
        "email": "testsync@example.com",
        "password": "Password123"
    })
    
    if res.status_code == 409:
        res = requests.post(f"{API_URL}/auth/login", json={
            "email": "testsync@example.com",
            "password": "Password123"
        })
        
    assert res.status_code == 200, res.text
    token = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Test Medical Records
    print("Testing Medical Records...")
    res = requests.get(f"{API_URL}/medical-records", headers=headers)
    assert res.status_code == 200, res.text
    records = res.json()
    print(f"Got {len(records)} initial records (demo data expected > 0).")
    
    res = requests.post(f"{API_URL}/medical-records", headers=headers, json={
        "title": "New Sync Record",
        "type": "Consultation",
        "doctor": "Dr. Test",
        "hospital": "Test Hospital",
        "date": "2026-07-28",
        "summary": "Testing sync."
    })
    assert res.status_code == 200, res.text
    new_record = res.json()
    print("Created new medical record:", new_record["title"])
    
    res = requests.get(f"{API_URL}/medical-records", headers=headers)
    assert len(res.json()) > len(records), "Record was not added to list"
    
    requests.delete(f"{API_URL}/medical-records/{new_record['id']}", headers=headers)
    
    # 3. Test Reminders
    print("Testing Reminders...")
    res = requests.get(f"{API_URL}/reminders", headers=headers)
    assert res.status_code == 200, res.text
    reminders = res.json()
    print(f"Got {len(reminders)} initial reminders.")
    
    res = requests.post(f"{API_URL}/reminders", headers=headers, json={
        "medicine": "SyncMed",
        "time": "10:00 AM",
        "date": "2026-07-28"
    })
    assert res.status_code == 200, res.text
    new_reminder = res.json()
    print("Created new reminder:", new_reminder["medicine"])
    
    res = requests.get(f"{API_URL}/reminders", headers=headers)
    assert len(res.json()) > len(reminders), "Reminder was not added to list"
    
    requests.patch(f"{API_URL}/reminders/{new_reminder['id']}/toggle", headers=headers)
    requests.delete(f"{API_URL}/reminders/{new_reminder['id']}", headers=headers)
    
    print("All tests passed!")

if __name__ == "__main__":
    try:
        test()
    except Exception as e:
        print(f"Error: {e}")
