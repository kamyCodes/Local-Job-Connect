<p align="center">
  <img src="frontend/static/images/logo.png" width="128" height="128" alt="Local Job Connect Logo">
</p>

# Local Job Connect

[![Flask](https://img.shields.github.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.github.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)](https://www.python.org/)
[![SQLite](https://img.shields.github.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.github.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Local Job Connect** is a professional-grade, high-fidelity web application built to empower neighborhood economies. By matching local businesses with nearby talent, the platform reduces daily commute times, fosters community resilience, and builds stronger neighborhood job ecosystems.

---

## Features & Capabilities

### Intelligent Location Matching
*   **Geodesic Distance Calculations**: Utilizes the mathematical **Haversine Formula** to compute real-time geodesic distances (in kilometers) between job seekers and listed opportunities.
*   **Proximity-Based Search**: Filters and ranks job opportunities based on strict geographic distance thresholds, allowing users to find work right in their neighborhood.

### Dual-Portal Architecture
*   **Job Seeker Hub**:
    *   Dynamic dashboard to manage personal profile, upload resumes, and track live applications.
    *   Upload constraints ensuring a clean database (maximum of 3 resumes per user, safe file naming extensions).
*   **Employer Portal**:
    *   Post high-fidelity local job listings with customized category tags and location metadata.
    *   Interactive candidate tracking pipeline to review resumes, inspect details, and update application statuses (Pending, Accepted, Rejected).
    *   **Dynamic Business Analytics**: Real-time analytical tracking visualizing applicant numbers, status distributions, and category engagement metrics.

### Premium User Experience & Micro-Animations
*   **Visual Frontpage Hero**: Seamless auto-advancing slide carousel featuring high-resolution neighborhood workspace illustrations with smooth crossfade CSS transitions.
*   **Dynamic Split-Screen Onboarding**: A responsive dual-pane grid layout for Login and Register pages.
*   **Tab-Controlled Graphic Swapping**: The registration banner dynamically swaps background graphics (Job Seeker co-working vs. Employer handshakes) and tailored content depending on which role tab is currently active.
*   **Context-Aware Auth Flow**: Intelligent navbar that dynamically hides auth actions depending on which page you are currently viewing.

---

## Technology Stack

*   **Core Framework**: Python 3.12, Flask
*   **Database & ORM**: SQLite (backed by Flask-SQLAlchemy with performant multi-column indexes on key search vectors like `email`, `city`, and `category`)
*   **Authentication & Security**: Flask-Login (session-based authentication) & Werkzeug Security (cryptographic password hashing)
*   **Frontend**: Responsive HTML5 Semantic markup & custom Vanilla CSS (featuring HSL variables, fluid glassmorphism borders, and mobile responsive containers)

---

## Codebase Structure

The project has been refactored from a single-file script into a clean, modular package structure following Flask best practices (App Factory pattern):

```text
Local-Job-Connect/
│
├── backend/
│   ├── routes/
│   │   ├── auth.py         # Session management, dynamic login & registration logic
│   │   ├── seeker.py       # Job seeker search, resume uploads, and applications
│   │   ├── employer.py     # Job creation, candidate reviews, and real-time analytics
│   │   └── main.py         # Static routing, landing page, and profile editing
│   │
│   ├── app.py              # Application Factory (create_app() with fallback database configurations)
│   ├── models.py           # Relational Database Models (User, Seeker, Employer, Job, Application)
│   ├── extensions.py       # Global library instantiations (SQLAlchemy, LoginManager, Migrate)
│   └── utils.py            # Haversine distance calculator, safe upload helpers
│
├── frontend/
│   ├── static/
│   │   ├── css/style.css   # Modern UI stylesheet (variables, grid systems, transitions)
│   │   └── images/         # Premium generated stock graphic assets
│   └── templates/          # Jinja2 templates organized by structural blueprint scopes
│
├── run.py                  # Console-safe entrypoint (Unicode-safe for CP1252 consoles)
│   ├── requirements.txt    # Package dependencies
└── README.md               # Dynamic project documentation
```

---

## Getting Started

### Prerequisites
*   Python 3.12+ installed on your system.

### Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/kamyCodes/Local-Job-Connect.git
    cd Local-Job-Connect
    ```

2.  **Create and Activate a Virtual Environment**:
    ```bash
    python -m venv venv
    
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Server**:
    ```bash
    python run.py
    ```
    *The application will boot up at `http://127.0.0.1:5000` with active debugger mode enabled.*

---

## Security Practices
*   **Strict Secrets Separation**: The database configuration is set to load variables securely, falling back to local SQLite files when environment values are empty.
*   **Password Hashing**: Direct plain-text password storage is barred; all credentials utilize cryptographic salting via PBKDF2 algorithms.
*   **File Extension Filtering**: Resume uploads are vetted using custom white-listed format guards (PDF, DOCX) and safe system-naming utilities to prevent shell injections.

---

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
