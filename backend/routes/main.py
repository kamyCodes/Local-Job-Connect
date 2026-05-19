from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import User
from extensions import db
from utils import geocode_address

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

@main_bp.route('/profile/edit', methods=['GET', 'POST'])
@login_required
def edit_profile():
    if request.method == 'POST':
        current_user.full_name = request.form.get('full_name')
        current_user.phone = request.form.get('phone')
        
        # Get new address fields
        new_address = request.form.get('address')
        new_city = request.form.get('city')
        new_zip = request.form.get('zip_code')
        
        # Check if address changed
        address_changed = (
            new_address != current_user.address or 
            new_city != current_user.city or 
            new_zip != current_user.zip_code
        )
        
        if address_changed:
            # Re-geocode the new address
            lat, lng = geocode_address(new_address, new_city, new_zip)
            
            if not lat or not lng:
                flash('Could not verify new address. Please check and try again.', 'error')
                return redirect(url_for('main.edit_profile'))
            
            # Update address and coordinates
            current_user.address = new_address
            current_user.city = new_city
            current_user.zip_code = new_zip
            current_user.latitude = lat
            current_user.longitude = lng
        
        if current_user.role == 'employer':
            current_user.company_name = request.form.get('company_name')
            current_user.company_description = request.form.get('company_description')
            
        db.session.commit()
        flash('Profile updated successfully!', 'success')
        return redirect(url_for('main.profile'))
        
    return render_template('edit_profile.html')
