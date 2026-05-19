from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory, current_app
from flask_login import login_required, current_user
from datetime import datetime
from collections import defaultdict
from models import JobPosting, Application, Resume
from extensions import db
from utils import role_required, is_within_service_area

employer_bp = Blueprint('employer', __name__)

@employer_bp.route('/employer/dashboard')
@login_required
@role_required('employer')
def employer_dashboard():
    jobs = JobPosting.query.filter_by(employer_id=current_user.id).order_by(JobPosting.created_at.desc()).all()
    
    jobs_with_counts = []
    for job in jobs:
        application_count = Application.query.filter_by(job_id=job.id).count()
        jobs_with_counts.append({
            'job': job,
            'application_count': application_count
        })
    
    return render_template('employer_dashboard.html', jobs_with_counts=jobs_with_counts)

@employer_bp.route('/employer/jobs/create', methods=['GET', 'POST'])
@login_required
@role_required('employer')
def create_job():
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        category = request.form.get('category')
        employment_type = request.form.get('employment_type')
        salary_min = request.form.get('salary_min')
        salary_max = request.form.get('salary_max')
        
        # Use employer's location
        lat = current_user.latitude
        lng = current_user.longitude
        
        if not lat or not lng:
            flash('Your company profile is missing location data. Please update your profile first.', 'error')
            return redirect(url_for('profile.edit_profile'))
        
        if not is_within_service_area(lat, lng):
            flash('Your location is outside our service area!', 'error')
            return redirect(url_for('employer.create_job'))
        
        job = JobPosting(
            employer_id=current_user.id,
            title=title,
            description=description,
            category=category,
            employment_type=employment_type,
            salary_min=float(salary_min) if salary_min else None,
            salary_max=float(salary_max) if salary_max else None,
            street_address=current_user.address,
            city=current_user.city,
            zip_code=current_user.zip_code,
            latitude=lat,
            longitude=lng
        )
        
        db.session.add(job)
        db.session.commit()
        
        flash('Job posted successfully!', 'success')
        return redirect(url_for('employer.employer_dashboard'))
    
    return render_template('create_job.html')

@employer_bp.route('/employer/jobs/<int:job_id>/edit', methods=['GET', 'POST'])
@login_required
@role_required('employer')
def edit_job(job_id):
    job = JobPosting.query.get_or_404(job_id)
    
    if job.employer_id != current_user.id:
        flash('Access denied!', 'error')
        return redirect(url_for('employer.employer_dashboard'))
    
    if request.method == 'POST':
        job.title = request.form.get('title')
        job.description = request.form.get('description')
        job.category = request.form.get('category')
        job.employment_type = request.form.get('employment_type')
        job.salary_min = float(request.form.get('salary_min')) if request.form.get('salary_min') else None
        job.salary_max = float(request.form.get('salary_max')) if request.form.get('salary_max') else None
        
        db.session.commit()
        
        flash('Job updated successfully!', 'success')
        return redirect(url_for('employer.employer_dashboard'))
    
    return render_template('edit_job.html', job=job)

@employer_bp.route('/employer/jobs/<int:job_id>/toggle-status', methods=['POST'])
@login_required
@role_required('employer')
def toggle_job_status(job_id):
    job = JobPosting.query.get_or_404(job_id)
    
    if job.employer_id != current_user.id:
        flash('Access denied!', 'error')
        return redirect(url_for('employer.employer_dashboard'))
    
    if job.status == 'active':
        job.status = 'paused'
        flash('Job paused successfully!', 'success')
    elif job.status == 'paused':
        job.status = 'active'
        flash('Job activated successfully!', 'success')
    
    db.session.commit()
    return redirect(url_for('employer.employer_dashboard'))

@employer_bp.route('/employer/jobs/<int:job_id>/archive', methods=['POST'])
@login_required
@role_required('employer')
def archive_job(job_id):
    job = JobPosting.query.get_or_404(job_id)
    
    if job.employer_id != current_user.id:
        flash('Access denied!', 'error')
        return redirect(url_for('employer.employer_dashboard'))
    
    job.status = 'archived'
    db.session.commit()
    
    flash('Job archived successfully!', 'success')
    return redirect(url_for('employer.employer_dashboard'))

@employer_bp.route('/employer/jobs/<int:job_id>/applications')
@login_required
@role_required('employer')
def view_applications(job_id):
    job = JobPosting.query.get_or_404(job_id)
    
    if job.employer_id != current_user.id:
        flash('Access denied!', 'error')
        return redirect(url_for('employer.employer_dashboard'))
    
    applications = Application.query.filter_by(job_id=job_id).order_by(Application.submitted_at.desc()).all()
    
    applications_with_resumes = []
    for application in applications:
        applicant_resumes = Resume.query.filter_by(user_id=application.applicant_id).all()
        applications_with_resumes.append({
            'application': application,
            'all_resumes': applicant_resumes
        })
    
    return render_template('view_applications.html', job=job, applications_with_resumes=applications_with_resumes)

@employer_bp.route('/employer/applications/<int:application_id>/update-status', methods=['POST'])
@login_required
@role_required('employer')
def update_application_status(application_id):
    application = Application.query.get_or_404(application_id)
    
    if application.job.employer_id != current_user.id:
        flash('Access denied!', 'error')
        return redirect(url_for('employer.employer_dashboard'))
    
    new_status = request.form.get('status')
    application.status = new_status
    db.session.commit()
    
    flash('Application status updated!', 'success')
    return redirect(url_for('employer.view_applications', job_id=application.job_id))

@employer_bp.route('/analytics')
@login_required
@role_required('employer')
def analytics():
    jobs = JobPosting.query.filter_by(employer_id=current_user.id).all()
    total_apps_query = Application.query.join(JobPosting).filter(JobPosting.employer_id == current_user.id)
    total_apps = total_apps_query.all()
    total_applications = len(total_apps)
    
    accepted = len([app for app in total_apps if app.status == 'accepted'])
    acceptance_rate = (accepted / total_applications * 100) if total_applications else 0
    
    interviews = len([app for app in total_apps if app.status == 'interview'])
    interview_rate = (interviews / total_applications * 100) if total_applications else 0
    
    rejected = len([app for app in total_apps if app.status == 'rejected'])
    rejection_rate = (rejected / total_applications * 100) if total_applications else 0
    
    responded = len([app for app in total_apps if app.status != 'applied'])
    response_rate = (responded / total_applications * 100) if total_applications else 0
    
    apps_by_month = defaultdict(int)
    apps_by_status = defaultdict(int)
    
    for app in total_apps:
        month = app.submitted_at.strftime('%B %Y')
        apps_by_month[month] += 1
        apps_by_status[app.status] += 1
    
    sorted_months = dict(sorted(apps_by_month.items(), key=lambda x: datetime.strptime(x[0], '%B %Y'), reverse=True)[:6])
    
    response_times = []
    for app in total_apps:
        if app.status != 'applied':
            time_diff = (app.updated_at - app.submitted_at).days
            response_times.append(time_diff)
    avg_response_time = sum(response_times) / len(response_times) if response_times else 0
    
    job_popularity = {}
    for job in jobs:
        app_count = Application.query.filter_by(job_id=job.id).count()
        job_popularity[job.title] = app_count
    
    most_popular_job = max(job_popularity.items(), key=lambda x: x[1]) if job_popularity else ("None", 0)
    active_jobs = len([job for job in jobs if job.status == 'active'])
    paused_jobs = len([job for job in jobs if job.status == 'paused'])
    archived_jobs = len([job for job in jobs if job.status == 'archived'])
    
    return render_template('analytics.html', 
                         total_jobs=len(jobs),
                         total_applications=total_applications,
                         acceptance_rate=round(acceptance_rate, 1),
                         interview_rate=round(interview_rate, 1),
                         rejection_rate=round(rejection_rate, 1),
                         response_rate=round(response_rate, 1),
                         apps_by_month=sorted_months,
                         apps_by_status=dict(apps_by_status),
                         avg_response_time=round(avg_response_time, 1),
                         most_popular_job=most_popular_job,
                         active_jobs=active_jobs,
                         paused_jobs=paused_jobs,
                         archived_jobs=archived_jobs)

@employer_bp.route('/uploads/resumes/<filename>')
@login_required
@role_required('employer')
def download_resume(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
