import os
from flask import Flask
from dotenv import load_dotenv
from extensions import db, login_manager, cache
from models import User
from routes.auth import auth_bp
from routes.seeker import seeker_bp
from routes.employer import employer_bp
from routes.main import main_bp

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
        
    # Append sslmode=require directly to the connection DSN string if not already present
    if database_url and database_url.startswith('postgresql'):
        if '?' not in database_url:
            database_url += '?sslmode=require'
        elif 'sslmode=' not in database_url:
            database_url += '&sslmode=require'
            
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///local_job_connect.db'
    
    # Configure robust connection arguments, SSL mode, and pre-ping parameters for PostgreSQL
    if database_url and database_url.startswith('postgresql'):
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            "connect_args": {"sslmode": "require"},
            "pool_pre_ping": True,
            "pool_recycle": 280
        }
    
    app.config['LOGO_FOLDER'] = os.path.join(frontend_static, 'uploads', 'logos')
    
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['LOGO_FOLDER'], exist_ok=True)
    
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    # Configure and initialize caching (SimpleCache is extremely fast and robust for web workloads)
    app.config['CACHE_TYPE'] = 'SimpleCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    cache.init_app(app)
    
    # Configure permanent session lifetime of exactly 10 minutes (600 seconds)
    from datetime import timedelta
    from flask import session
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=10)
    
    @app.before_request
    def refresh_session_lifetime():
        session.permanent = True
        session.modified = True
    
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
            
            # Run automatic schema migrations for location and logo column updates
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            
            # Alter 'users' table if columns are missing
            user_columns = [c['name'] for c in inspector.get_columns('users')]
            with db.engine.begin() as conn:
                if 'state' not in user_columns:
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN state VARCHAR(100)"))
                if 'country' not in user_columns:
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN country VARCHAR(100)"))
                if 'company_logo' not in user_columns:
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN company_logo VARCHAR(255)"))
                if 'logo_updated_at' not in user_columns:
                    conn.execute(db.text("ALTER TABLE users ADD COLUMN logo_updated_at TIMESTAMP"))
            
            # Alter 'job_postings' table if columns are missing
            job_columns = [c['name'] for c in inspector.get_columns('job_postings')]
            with db.engine.begin() as conn:
                if 'state' not in job_columns:
                    conn.execute(db.text("ALTER TABLE job_postings ADD COLUMN state VARCHAR(100)"))
                if 'country' not in job_columns:
                    conn.execute(db.text("ALTER TABLE job_postings ADD COLUMN country VARCHAR(100)"))
                    
            # Safe PostgreSQL migration for zip_code column conversion from VARCHAR to INTEGER (Requirement 3: integer zip code)
            if db.engine.dialect.name == 'postgresql':
                users_cols_raw = inspector.get_columns('users')
                zip_col = next((c for c in users_cols_raw if c['name'] == 'zip_code'), None)
                if zip_col and 'varchar' in str(zip_col['type']).lower():
                    with db.engine.begin() as conn:
                        conn.execute(db.text("ALTER TABLE users ALTER COLUMN zip_code TYPE INTEGER USING (CASE WHEN zip_code ~ '^[0-9]+$' THEN zip_code::integer ELSE NULL END)"))
                
                jobs_cols_raw = inspector.get_columns('job_postings')
                job_zip_col = next((c for c in jobs_cols_raw if c['name'] == 'zip_code'), None)
                if job_zip_col and 'varchar' in str(job_zip_col['type']).lower():
                    with db.engine.begin() as conn:
                        conn.execute(db.text("ALTER TABLE job_postings ALTER COLUMN zip_code TYPE INTEGER USING (CASE WHEN zip_code ~ '^[0-9]+$' THEN zip_code::integer ELSE 0 END)"))
                    
            print("Database tables and schema migrations initialized successfully!")
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
