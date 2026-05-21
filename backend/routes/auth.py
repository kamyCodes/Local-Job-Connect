from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import current_user, login_user, logout_user, login_required
from datetime import datetime
from models import User
from extensions import db
from utils import geocode_address

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        flash('You are already logged in. Logout first to create a new account.', 'warning')
        if current_user.role == 'employer':
            return redirect(url_for('employer.employer_dashboard'))
        return redirect(url_for('seeker.job_seeker_dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        role = request.form.get('role')
        full_name = request.form.get('full_name')
        phone = request.form.get('phone')
        address = request.form.get('address')
        city = request.form.get('city')
        zip_code = request.form.get('zip_code')
        
        errors = {}
        if password != confirm_password:
            errors['confirm_password'] = 'Passwords do not match!'
        
        if len(password) < 8:
            errors['password'] = 'Password must be at least 8 characters long!'
        
        if User.query.filter_by(email=email).first():
            errors['email'] = 'Email already registered!'
            
        if errors:
            return render_template('register.html', errors=errors)
        
        lat, lng = geocode_address(address, city, zip_code)
        
        if not lat or not lng:
            # Graceful fallback to Abuja coordinates (centre of Nigeria) if Mapbox is unconfigured or geocoding fails
            lat, lng = 9.0765, 7.3986
        
        user = User(
            email=email,
            role=role,
            full_name=full_name,
            phone=phone,
            address=address,
            city=city,
            zip_code=zip_code,
            latitude=lat,
            longitude=lng
        )
        user.set_password(password)
        
        if role == 'employer':
            user.company_name = request.form.get('company_name')
            user.company_description = request.form.get('company_description')
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('register.html')


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        flash('You are already logged in.', 'info')
        if current_user.role == 'employer':
            return redirect(url_for('employer.employer_dashboard'))
        return redirect(url_for('seeker.job_seeker_dashboard'))

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            flash('No account found with this email address!', 'error')
        elif not user.check_password(password):
            flash('Incorrect password. Please try again!', 'error')
        else:
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            if user.role == 'employer':
                return redirect(url_for('employer.employer_dashboard'))
            else:
                return redirect(url_for('seeker.job_seeker_dashboard'))
    
    return render_template('login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('main.index'))
