from flask import Flask, jsonify

app = Flask(__name__)
app.secret_key = "RmuekVcRKUvQrDLqTQWgnNem1hWog-R6IoByxAOgk1Q"

@app.route('/')
def home():
    return jsonify({"status": "IA Poste Manager v2.3", "working": True})

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run()