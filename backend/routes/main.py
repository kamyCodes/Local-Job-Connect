from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app
from flask_login import login_required, current_user, logout_user
from models import User, JobPosting
from extensions import db
from utils import geocode_address, clean_street_address
from datetime import datetime
import os

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    # Calculate real, dynamic database stats for the landing page
    active_jobs = JobPosting.query.filter_by(status='active').count()
    job_seekers = User.query.filter_by(role='job_seeker').count()
    local_employers = User.query.filter_by(role='employer').count()
    
    # Calculate unique cities registered across all users (seekers and employers)
    unique_cities = db.session.query(User.city).distinct().count()
    cities_covered = max(1, unique_cities) if unique_cities else 1
    
    return render_template('index.html',
                           active_jobs=active_jobs,
                           job_seekers=job_seekers,
                           local_employers=local_employers,
                           cities_covered=cities_covered)

@main_bp.route('/sitemap.xml')
def sitemap():
    # Dynamic sitemap generation for Google Indexing
    jobs = JobPosting.query.filter_by(status='active').all()
    # Assume base url is from request
    host = request.url_root.rstrip('/')
    
    xml = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Add static pages
    static_routes = ['/', '/auth/login', '/auth/register']
    for route in static_routes:
        xml.append(f'  <url><loc>{host}{route}</loc></url>')
        
    # Add active job pages
    for job in jobs:
        xml.append(f'  <url><loc>{host}/seeker/jobs/{job.id}</loc></url>')
        
    xml.append('</urlset>')
    
    return current_app.response_class('\n'.join(xml), mimetype='application/xml')

@main_bp.route('/robots.txt')
def robots():
    host = request.url_root.rstrip('/')
    txt = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /employer/",
        "Disallow: /seeker/dashboard",
        "Disallow: /profile",
        f"Sitemap: {host}/sitemap.xml"
    ]
    return current_app.response_class('\n'.join(txt), mimetype='text/plain')

@main_bp.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

@main_bp.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    days_until_logo_edit = 0
    if current_user.role == 'employer' and current_user.logo_updated_at:
        delta = datetime.utcnow() - current_user.logo_updated_at
        if delta.days < 365:
            days_until_logo_edit = 365 - delta.days

    days_until_address_edit = 0
    if current_user.address_updated_at:
        limit_days = 50 if current_user.role == 'employer' else 30
        delta = datetime.utcnow() - current_user.address_updated_at
        if delta.days < limit_days:
            days_until_address_edit = limit_days - delta.days

    if request.method == 'POST':
        current_user.full_name = request.form.get('full_name')
        current_user.phone = request.form.get('phone')
        
        # Get new address fields (fallback to DB values if inputs were disabled/omitted on frontend)
        new_address = request.form.get('address')
        new_state = request.form.get('state')
        new_country = request.form.get('country')
        new_city = request.form.get('city')
        new_zip = request.form.get('zip_code')
        
        if new_address is None: new_address = current_user.address or ''
        if new_state is None: new_state = current_user.state or ''
        if new_country is None: new_country = current_user.country or ''
        if new_city is None: new_city = current_user.city or ''
        if new_zip is None:
            new_zip = str(current_user.zip_code) if current_user.zip_code is not None else ''
        
        new_zip_int = None
        if new_zip:
            # Validate ZIP Code as integer (Requirement 3: integer zip code)
            if not new_zip.isdigit():
                flash('ZIP Code must be a valid integer.', 'error')
                return redirect(url_for('main.edit_profile'))
            
            # Country specific length validations
            if new_country == 'Nigeria' and len(new_zip) != 6:
                flash('Nigerian ZIP code must be exactly 6 digits.', 'error')
                return redirect(url_for('main.edit_profile'))
            elif new_country == 'United States' and len(new_zip) != 5:
                flash('US ZIP code must be exactly 5 digits.', 'error')
                return redirect(url_for('main.edit_profile'))
            
            new_zip_int = int(new_zip)
        
        # Check if address changed
        address_changed = (
            new_address != current_user.address or 
            new_city != current_user.city or 
            new_state != current_user.state or
            new_country != current_user.country or
            new_zip_int != current_user.zip_code
        )
        
        if address_changed:
            # Backend Rate-limiting enforcement
            if days_until_address_edit > 0:
                limit_days = 50 if current_user.role == 'employer' else 30
                flash(f'You can only change your address once every {limit_days} days. You must wait {days_until_address_edit} more days.', 'error')
                return redirect(url_for('main.edit_profile'))
            
            # Re-geocode the new address
            lat, lng = geocode_address(new_address, new_city, new_zip, new_country)
            
            if not lat or not lng:
                # Graceful fallback to country-specific centers
                c_lower = new_country.lower().strip() if new_country else 'nigeria'
                if 'nigeria' in c_lower:
                    lat, lng = 6.5244, 3.3792
                elif 'united states' in c_lower or c_lower == 'us' or 'usa' in c_lower:
                    lat, lng = 39.8283, -98.5795
                elif 'united kingdom' in c_lower or c_lower == 'uk' or 'gb' in c_lower:
                    lat, lng = 55.3781, -3.4360
                elif 'canada' in c_lower or c_lower == 'ca':
                    lat, lng = 56.1304, -106.3468
                else:
                    lat, lng = 6.5244, 3.3792
            
            # Update address, coordinates, and timestamp
            current_user.address = new_address
            current_user.city = new_city
            current_user.state = new_state
            current_user.country = new_country
            current_user.zip_code = new_zip_int
            current_user.latitude = lat
            current_user.longitude = lng
            current_user.address_updated_at = datetime.utcnow()
            
            # Recalculate remaining days to pass back (e.g. if redirect was bypassed)
            limit_days = 50 if current_user.role == 'employer' else 30
            days_until_address_edit = limit_days
        
        if current_user.role == 'employer':
            current_user.company_name = request.form.get('company_name')
            current_user.company_description = request.form.get('company_description')
            
            # Handle company logo edits (rate-limited to once a year)
            logo_file = request.files.get('company_logo')
            if logo_file and logo_file.filename != '':
                if days_until_logo_edit > 0:
                    flash(f'You can only change your company logo once a year. You must wait {days_until_logo_edit} more days.', 'error')
                else:
                    ext = os.path.splitext(logo_file.filename)[1].lower()
                    if ext not in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
                        flash('Invalid logo format. Allowed: PNG, JPG, JPEG, GIF, SVG.', 'error')
                    else:
                        import uuid, time
                        unique_logo_name = f"logo_{int(time.time())}_{uuid.uuid4().hex[:8]}{ext}"
                        logo_path = os.path.join(current_app.config['LOGO_FOLDER'], unique_logo_name)
                        logo_file.save(logo_path)
                        current_user.company_logo = unique_logo_name
                        current_user.logo_updated_at = datetime.utcnow()
                        days_until_logo_edit = 365
        elif current_user.role == 'job_seeker':
            current_user.skills = request.form.get('skills')
            
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('main.profile'))
        
    return render_template('edit_profile.html', 
                           days_until_logo_edit=days_until_logo_edit, 
                           days_until_address_edit=days_until_address_edit)


@main_bp.route('/profile/delete', methods=['POST'])
@login_required
def delete_account():
    password = request.form.get('password')
    if not password:
        flash('Password is required to delete your account.', 'error')
        return redirect(url_for('main.edit_profile'))
        
    if not current_user.check_password(password):
        flash('Incorrect password. Account deletion cancelled.', 'error')
        return redirect(url_for('main.edit_profile'))
        
    try:
        db.session.delete(current_user)
        db.session.commit()
        logout_user()
        
        # Invalidate cache
        from extensions import cache
        cache.delete('active_job_postings')
        
        flash('Your account has been permanently deleted.', 'success')
        return redirect(url_for('main.index'))
    except Exception as e:
        db.session.rollback()
        flash(f'An error occurred during account deletion: {str(e)}', 'error')
        return redirect(url_for('main.edit_profile'))
