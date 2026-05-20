// Mobile Navigation - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
	// Create mobile menu toggle button
	const navbar = document.querySelector('.navbar .container');
	const navLinks = document.querySelector('.nav-links');
	const userProfile = document.querySelector('.user-profile');
	
	if (navbar && navLinks && window.innerWidth <= 768) {
		// Create hamburger button
		const menuBtn = document.createElement('button');
		menuBtn.className = 'mobile-menu-toggle';
		menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
		menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
		menuBtn.setAttribute('aria-expanded', 'false');
		
		// Calculate position based on whether user is logged in
		const rightPosition = userProfile ? '70px' : '16px';
		
		// Add styles for the button
		menuBtn.style.cssText = `
			position: absolute;
			top: 16px;
			right: ${rightPosition};
			background: var(--primary-blue);
			color: white;
			border: none;
			padding: 10px 14px;
			border-radius: 8px;
			cursor: pointer;
			font-size: 18px;
			z-index: 1000;
			display: none;
		`;
		
		// Insert button before nav-links
		navbar.insertBefore(menuBtn, navLinks);
		
		// Function to update mobile menu
		function updateMobileMenu() {
			if (window.innerWidth <= 768) {
				menuBtn.style.display = 'block';
				navLinks.style.display = 'none';
				
				// Move user profile to top right if it exists
				if (userProfile) {
					userProfile.style.position = 'absolute';
					userProfile.style.top = '12px';
					userProfile.style.right = '16px';
				}
			} else {
				menuBtn.style.display = 'none';
				navLinks.style.display = 'flex';
				
				// Reset user profile position
				if (userProfile) {
					userProfile.style.position = 'static';
				}
			}
		}
		
		// Initial setup
		updateMobileMenu();
		
		// Toggle menu
		menuBtn.addEventListener('click', function(e) {
			e.stopPropagation();
			const isOpen = navLinks.style.display === 'flex';
			navLinks.style.display = isOpen ? 'none' : 'flex';
			this.innerHTML = isOpen ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
			this.setAttribute('aria-expanded', String(!isOpen));
			
			// Toggle body class for backdrop
			document.body.classList.toggle('menu-open', !isOpen);
		});
		
		// Close menu when clicking outside
		document.addEventListener('click', function(e) {
			if (window.innerWidth <= 768 && 
			    navLinks.style.display === 'flex' && 
			    !navLinks.contains(e.target) && 
			    e.target !== menuBtn) {
				navLinks.style.display = 'none';
				menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
				menuBtn.setAttribute('aria-expanded', 'false');
			}
		});
		
		// Close menu when clicking a link
		const navLinksItems = navLinks.querySelectorAll('a');
		navLinksItems.forEach(link => {
			link.addEventListener('click', () => {
				if (window.innerWidth <= 768) {
					navLinks.style.display = 'none';
					menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
					menuBtn.setAttribute('aria-expanded', 'false');
				}
			});
		});
		
		// Handle window resize
		window.addEventListener('resize', updateMobileMenu);
	}
	
	// Alerts: wire close buttons and auto-dismiss success/info
	const alerts = document.querySelectorAll('.alert');
	alerts.forEach(alert => {
		const close = alert.querySelector('.alert-close');
		if (close) {
			close.addEventListener('click', function(){
				alert.classList.add('closing');
				setTimeout(()=>alert.remove(), 300);
			});
		}

		// Auto-dismiss all floating alerts after exactly 3.09s (3090ms)
		setTimeout(()=>{
			if (!document.body.contains(alert)) return;
			alert.classList.add('closing');
			setTimeout(()=>alert.remove(), 300);
		}, 3090);
	});

	// ── Required-field red border on failed submit ──────────────────────────
	document.querySelectorAll('form').forEach(function(form) {
		form.addEventListener('submit', function(e) {
			if (!form.checkValidity()) {
				e.preventDefault();
				form.classList.add('was-validated');
				
				// Force validation check on all fields immediately
				form.querySelectorAll('.input-wrapper input, .input-wrapper select, .input-wrapper textarea').forEach(input => {
					const event = new Event('input', { bubbles: true });
					input.dispatchEvent(event);
				});
			}
		});
	});

	// ── Real-time input validation feedback with correct/wrong icons ──────────
	document.querySelectorAll('.form-group').forEach(group => {
		const input = group.querySelector('input, select, textarea');
		if (!input) return;

		// Skip hidden inputs and buttons
		if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;

		// Create wrapper
		const wrapper = document.createElement('div');
		wrapper.className = 'input-wrapper';
		
		// Create feedback icon
		const icon = document.createElement('i');
		icon.className = 'validation-icon';
		
		// Insert wrapper in place of input
		input.parentNode.insertBefore(wrapper, input);
		wrapper.appendChild(input);
		wrapper.appendChild(icon);

		// Adjust padding to make room for icon
		input.style.paddingRight = '40px';

		// Real-time validation handler
		function validateField() {
			const val = input.value.trim();
			
			// ── Custom Password validations inside real-time handler ──
			if (input.id === 'password') {
				const hasUpper = /[A-Z]/.test(val);
				const hasLower = /[a-z]/.test(val);
				const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
				const hasMinLength = val.length >= 8;

				if (val !== '' && (!hasUpper || !hasLower || !hasSpecial || !hasMinLength)) {
					input.setCustomValidity('Password must be at least 8 characters long and contain uppercase, lowercase, and special characters.');
				} else {
					input.setCustomValidity('');
				}

				// Trigger confirm password check if it already has a value
				const confirmInput = document.getElementById('confirm_password');
				if (confirmInput && confirmInput.value !== '') {
					const confirmEvent = new Event('input', { bubbles: true });
					confirmInput.dispatchEvent(confirmEvent);
				}
			}

			if (input.id === 'confirm_password') {
				const passwordInput = document.getElementById('password');
				if (passwordInput && val !== passwordInput.value) {
					input.setCustomValidity('Passwords do not match!');
				} else {
					input.setCustomValidity('');
				}
			}

			// If empty, hide icon and clear custom visual borders
			if (val === '') {
				icon.className = 'validation-icon';
				input.style.borderColor = '';
				input.style.boxShadow = '';
				
				// Hide dynamic helper errors if empty
				const errSpan = group.querySelector('.fe-error-hint');
				if (errSpan) errSpan.style.display = 'none';
				return;
			}

			if (input.checkValidity()) {
				icon.className = 'validation-icon fas fa-check-circle valid';
				input.style.borderColor = 'var(--success-green)';
				input.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.08)';
				
				// Hide any active error hint
				const errSpan = group.querySelector('.fe-error-hint');
				if (errSpan) errSpan.style.display = 'none';
			} else {
				icon.className = 'validation-icon fas fa-times-circle invalid';
				input.style.borderColor = 'var(--danger-red)';
				input.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.08)';
				
				// Dynamically display error hints under the field
				let errSpan = group.querySelector('.fe-error-hint');
				if (!errSpan) {
					errSpan = document.createElement('span');
					errSpan.className = 'field-error-hint fe-error-hint';
					errSpan.style.display = 'block';
					group.appendChild(errSpan);
				}
				errSpan.textContent = input.validationMessage || 'Please fill out this field correctly.';
				errSpan.style.display = 'block';
			}
		}

		input.addEventListener('input', validateField);
		input.addEventListener('blur', validateField);
		
		// Run once initially if field already contains a value on load
		if (input.value) {
			validateField();
		}
	});
});

// ── Clean and Fast Navigation ───────────────────────────────────────────────

// ── Glass Navbar: solidify on scroll ──────────────────────────────────────────
(function () {
	var navbar = document.querySelector('.navbar');
	if (!navbar) return;

	function handleScroll() {
		if (window.scrollY > 10) {
			navbar.classList.add('scrolled');
		} else {
			navbar.classList.remove('scrolled');
		}
	}

	window.addEventListener('scroll', handleScroll, { passive: true });
	handleScroll(); // run once on load in case page is already scrolled
})();