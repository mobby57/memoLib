#!/usr/bin/env python3
"""
Simple FastAPI startup script
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="IAPosteManager API", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3005", "http://127.0.0.1:3005"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "IAPosteManager API v4.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/workspace/")
async def list_workspaces():
    return {"workspaces": []}

@app.post("/api/workspace/create")
async def create_workspace(data: dict):
    return {"id": "1", "name": data.get("name", "Test"), "status": "created"}

if __name__ == "__main__":
    print("Starting IAPosteManager API v4.0")
    print("API: http://localhost:8000")
    uvicorn.run("simple_api:app", host="0.0.0.0", port=8000, reload=True)