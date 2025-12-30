import requests
r = requests.get("https://iapostemanager.vercel.app")
print(f"Status: {r.status_code}")
if r.status_code == 200:
    print("SUCCESS!")
else:
    print("Still broken")