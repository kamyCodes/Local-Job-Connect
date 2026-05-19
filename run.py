import os
import sys

# Ensure the root directory and backend directory are in the python path
base_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, base_dir)
sys.path.insert(0, os.path.join(base_dir, 'backend'))

from backend.app import app

if __name__ == '__main__':
    print("Starting Local Job Connect...")
    app.run(debug=True)
