from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from flask_login import current_user, login_user, logout_user, login_required
from datetime import datetime
import os
import re
import uuid
import time
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
        state = request.form.get('state')
        country = request.form.get('country')
        city = request.form.get('city')
        zip_code = request.form.get('zip_code')
        
        errors = {}
        
        # Password complexity validation
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_special = any(not c.isalnum() for c in password)
        if password != confirm_password:
            errors['confirm_password'] = 'Passwords do not match!'
        if not (has_upper and has_lower and has_special and len(password) >= 8):
            errors['password'] = 'Password must be at least 8 characters long and contain uppercase, lowercase, and special characters.'
        
        # Input length safety checks to prevent database varchar overflow truncation errors
        if not full_name or len(full_name) > 100:
            errors['full_name'] = 'Full name must be between 1 and 100 characters.'
        if not email or len(email) > 120:
            errors['email'] = 'Email address must not exceed 120 characters.'
        if phone and len(phone) > 20:
            errors['phone'] = 'Phone number must not exceed 20 characters.'
        if address and len(address) > 200:
            errors['address'] = 'Street address must not exceed 200 characters.'
        if city and len(city) > 100:
            errors['city'] = 'City must not exceed 100 characters.'
        if state and len(state) > 100:
            errors['state'] = 'State must not exceed 100 characters.'
        if country and len(country) > 100:
            errors['country'] = 'Country must not exceed 100 characters.'
        if not zip_code or not zip_code.isdigit():
            errors['zip_code'] = 'ZIP Code must be a valid integer.'
        else:
            if country == 'Nigeria':
                if not re.match(r'^\d{6}$', zip_code):
                    errors['zip_code'] = 'Nigerian ZIP code must be exactly 6 digits.'
            elif country == 'United States':
                if not re.match(r'^\d{5}$', zip_code):
                    errors['zip_code'] = 'US ZIP code must be exactly 5 digits.'
        
        if User.query.filter_by(email=email).first():
            errors['email'] = 'Email already registered!'

        # Company validation for employers
        unique_logo_name = None
        logo_file = None
        if role == 'employer':
            company_name = request.form.get('company_name')
            if not company_name or len(company_name) > 100:
                errors['company_name'] = 'Company name must be between 1 and 100 characters.'
            
            logo_file = request.files.get('company_logo')
            if not logo_file or logo_file.filename == '':
                errors['company_logo'] = 'Company logo is required for employers.'
            else:
                ext = os.path.splitext(logo_file.filename)[1].lower()
                if ext not in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
                    errors['company_logo'] = 'Invalid logo format. Allowed: PNG, JPG, JPEG, GIF, SVG.'
                else:
                    unique_logo_name = f"logo_{int(time.time())}_{uuid.uuid4().hex[:8]}{ext}"
            
        if errors:
            return render_template('register.html', errors=errors)
        
        # Save employer logo file if it exists
        if role == 'employer' and logo_file:
            logo_path = os.path.join(current_app.config['LOGO_FOLDER'], unique_logo_name)
            logo_file.save(logo_path)
        
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
            state=state,
            country=country,
            zip_code=int(zip_code) if zip_code and zip_code.isdigit() else None,
            latitude=lat,
            longitude=lng
        )
        user.set_password(password)
        
        if role == 'employer':
            user.company_name = request.form.get('company_name')
            user.company_description = request.form.get('company_description')
            user.company_logo = unique_logo_name
            user.logo_updated_at = datetime.utcnow()
        
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

    # Display dynamic warning if user was auto-logged out due to 10 minutes of inactivity
    timeout_logout = request.args.get('timeout')
    if timeout_logout:
        flash('You have been logged out due to 10 minutes of inactivity. Please log in again.', 'warning')

    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            flash('No account found with this email address!', 'error')
            return render_template('login.html', email_not_found=True)
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
    
    # Redirect directly to login with timeout warning parameter if logged out via inactivity
    timeout_logout = request.args.get('timeout')
    if timeout_logout:
        return redirect(url_for('auth.login', timeout=1))
        
    flash('You have been logged out.', 'success')
    return redirect(url_for('main.index'))
