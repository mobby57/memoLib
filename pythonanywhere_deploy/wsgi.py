#!/usr/bin/python3.10
import sys
import os

# Add your project directory to the sys.path
path = '/home/yourusername/iapostemanage'
if path not in sys.path:
    sys.path.insert(0, path)

from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

from app import app as application

if __name__ == "__main__":
    application.run()