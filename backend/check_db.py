import os
import sys

# Add backend to path so imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app import create_app
from extensions import db

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
        print("Database schema updated with any missing tables.")
