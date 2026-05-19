import os
import sys

# Ensure the root directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app import app

if __name__ == '__main__':
    print("Starting Local Job Connect...")
    app.run(debug=True)
