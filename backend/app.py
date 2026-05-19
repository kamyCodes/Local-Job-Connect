import os
from flask import Flask
from dotenv import load_dotenv
from .extensions import db, login_manager
from .models import User
from .routes.auth import auth_bp
from .routes.seeker import seeker_bp
from .routes.employer import employer_bp
from .routes.main import main_bp

def create_app():
    load_dotenv()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    frontend_templates = os.path.join(base_dir, 'frontend', 'templates')
    frontend_static = os.path.join(base_dir, 'frontend', 'static')
    
    app = Flask(__name__, template_folder=frontend_templates, static_folder=frontend_static)
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY') or 'local-job-connect-dev-key'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(frontend_static, 'uploads', 'resumes')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    
    database_url = os.getenv('DATABASE_URL')
    if database_url and ('host:port/database' in database_url or database_url == ''):
        database_url = None
    elif database_url and database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///local_job_connect.db'
    
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    # User loader callback for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(seeker_bp)
    app.register_blueprint(employer_bp)
    app.register_blueprint(main_bp)
    
    with app.app_context():
        try:
            db.create_all()
            print("Database tables initialized successfully!")
        except Exception as e:
            print(f"Database initialization error: {e}")
            
    return app

if __name__ == '__main__':
    # When run directly, we might not have the parent package recognized,
    # so we import absolutely if running directly, or just let python handle it.
    app = create_app()
    app.run(debug=True)
else:
    app = create_app()
