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
				// Remove menu-open class when resizing to desktop
				document.body.classList.remove('menu-open');
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
			    !menuBtn.contains(e.target)) {
				navLinks.style.display = 'none';
				menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
				menuBtn.setAttribute('aria-expanded', 'false');
				document.body.classList.remove('menu-open');
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
					document.body.classList.remove('menu-open');
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

		// Auto-dismiss all floating alerts after exactly 5s (5000ms)
		setTimeout(()=>{
			if (!document.body.contains(alert)) return;
			alert.classList.add('closing');
			setTimeout(()=>alert.remove(), 300);
		}, 5000);
	});

	// ── Required-field red border on failed submit ──────────────────────────
	document.querySelectorAll('form').forEach(function(form) {
		form.addEventListener('submit', function(e) {
			// 1. Force validation checks on all fields to update their custom validities (like password complexity, matches, ZIP format)
			form.querySelectorAll('input, select, textarea').forEach(input => {
				const event = new Event('input', { bubbles: true });
				input.dispatchEvent(event);
			});

			// 2. Now check if the form is actually valid
			if (!form.checkValidity()) {
				e.preventDefault();
				e.stopPropagation();
				form.classList.add('was-validated');
			}
		});
	});

	// ── Real-time input validation feedback with correct/wrong icons ──────────
	document.querySelectorAll('.form-group').forEach(group => {
		const input = group.querySelector('input, select, textarea');
		if (!input) return;

		// Skip all select dropdown fields entirely (Requirement: drop downs shouldn't have visual validation indicators)
		if (input.tagName.toLowerCase() === 'select') return;

		// Skip validation indicators for salary fields
		if (input.name === 'salary_min' || input.name === 'salary_max') return;

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

	// ── Character Counters for Textareas with Minlength (Requirement 5) ──
	document.querySelectorAll('textarea[minlength]').forEach(textarea => {
		const parent = textarea.parentNode;
		const min = textarea.getAttribute('minlength');
		const max = textarea.getAttribute('maxlength') || 12000;
		
		const counter = document.createElement('div');
		counter.className = 'char-counter';
		counter.style.cssText = 'text-align: right; font-size: 12px; color: var(--text-gray); margin-top: 6px; font-weight: 500;';
		counter.innerHTML = `<span class="current">${textarea.value.length}</span> / <span class="max">${max}</span> characters (min ${min})`;
		parent.appendChild(counter);
		
		textarea.addEventListener('input', () => {
			const len = textarea.value.length;
			counter.querySelector('.current').textContent = len;
			if (len < min || len > max) {
				counter.style.color = 'var(--danger-red)';
			} else {
				counter.style.color = 'var(--text-gray)';
			}
		});
	});

	// ── Hierarchical Country -> State -> City Pick Lists (Requirement 1 & 3) ──
	const locationData = {
		"Nigeria": {
			"Lagos": ["Ikeja", "Lekki", "Surulere", "Yaba", "Victoria Island"],
			"Abuja FCT": ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa"],
			"Rivers": ["Port Harcourt", "Obio-Akpor", "Bonny", "Eleme"],
			"Kano": ["Kano City", "Fagge", "Gwale", "Nasarawa"],
			"Oyo": ["Ibadan", "Ogbomosho", "Oyo Town", "Saki"]
		},
		"United States": {
			"California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
			"New York": ["New York City", "Buffalo", "Rochester", "Syracuse", "Albany"],
			"Texas": ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth"],
			"Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"]
		},
		"United Kingdom": {
			"England": ["London", "Manchester", "Birmingham", "Leeds", "Liverpool"],
			"Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"],
			"Wales": ["Cardiff", "Swansea", "Newport"],
			"Northern Ireland": ["Belfast", "Derry", "Lisburn"]
		},
		"Canada": {
			"Ontario": ["Toronto", "Ottawa", "Mississauga", "Hamilton"],
			"Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau"],
			"British Columbia": ["Vancouver", "Victoria", "Burnaby", "Surrey"],
			"Alberta": ["Calgary", "Edmonton", "Red Deer", "Lethbridge"]
		}
	};

	const countrySel = document.getElementById('country');
	const stateSel = document.getElementById('state');
	const citySel = document.getElementById('city');
	const zipInput = document.getElementById('zip_code');

	if (countrySel && stateSel && citySel) {
		// We will store loaded lists dynamically to prevent redundant requests
		let apiCountries = [];
		let apiStates = {};
		let apiCities = {};
		let useFallback = false;

		// Initialize Country loading
		async function initLocationPickers() {
			const initCountry = countrySel.getAttribute('data-selected');
			const initState = stateSel.getAttribute('data-selected');
			const initCity = citySel.getAttribute('data-selected');

			countrySel.innerHTML = '<option value="">-- Loading countries... --</option>';
			countrySel.disabled = true;

			try {
				const res = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
				if (!res.ok) throw new Error('API failed');
				const json = await res.json();
				if (json.error) throw new Error(json.msg);

				apiCountries = json.data.map(c => c.name).sort();
				
				countrySel.innerHTML = '<option value="">-- Select Country * --</option>';
				apiCountries.forEach(country => {
					const opt = document.createElement('option');
					opt.value = country;
					opt.textContent = country;
					countrySel.appendChild(opt);
				});
				countrySel.disabled = false;

				if (initCountry) {
					countrySel.value = initCountry;
					await populateStates(initCountry, initState, initCity);
				}
			} catch (err) {
				console.warn('Unable to load countries dynamically. Pivoting to fallback dataset...', err);
				useFallback = true;
				loadFallbackCountries(initCountry, initState, initCity);
			}
		}

		function loadFallbackCountries(initCountry, initState, initCity) {
			countrySel.innerHTML = '<option value="">-- Select Country * --</option>';
			countrySel.disabled = false;
			Object.keys(locationData).forEach(country => {
				const opt = document.createElement('option');
				opt.value = country;
				opt.textContent = country;
				countrySel.appendChild(opt);
			});

			if (initCountry && locationData[initCountry]) {
				countrySel.value = initCountry;
				populateStatesFallback(initCountry, initState, initCity);
			}
		}

		async function populateStates(country, selectedState = '', selectedCity = '') {
			stateSel.innerHTML = '<option value="">-- Loading states... --</option>';
			citySel.innerHTML = '<option value="">-- Select City * --</option>';
			stateSel.disabled = true;
			citySel.disabled = true;

			if (!country) {
				stateSel.innerHTML = '<option value="">-- Select State * --</option>';
				return;
			}

			if (useFallback || (locationData[country] && !apiCountries.length)) {
				// If we have local fallback data or API already flagged to use fallback
				populateStatesFallback(country, selectedState, selectedCity);
				return;
			}

			try {
				if (apiStates[country]) {
					renderStates(country, apiStates[country], selectedState, selectedCity);
					return;
				}

				const res = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ country })
				});
				if (!res.ok) throw new Error('States fetch failed');
				const json = await res.json();
				if (json.error) throw new Error(json.msg);

				const states = json.data.states.map(s => s.name).sort();
				apiStates[country] = states;
				renderStates(country, states, selectedState, selectedCity);
			} catch (err) {
				console.warn(`States API failed for ${country}. Trying fallback...`, err);
				if (locationData[country]) {
					populateStatesFallback(country, selectedState, selectedCity);
				} else {
					stateSel.innerHTML = '<option value="">-- Select State * --</option>';
					stateSel.disabled = true;
				}
			}
		}

		function renderStates(country, states, selectedState, selectedCity) {
			stateSel.innerHTML = '<option value="">-- Select State * --</option>';
			if (states.length === 0) {
				const opt = document.createElement('option');
				opt.value = 'N/A';
				opt.textContent = 'N/A';
				opt.selected = true;
				stateSel.appendChild(opt);
				stateSel.disabled = false;
				populateCities(country, 'N/A', selectedCity);
				return;
			}

			states.forEach(state => {
				const opt = document.createElement('option');
				opt.value = state;
				opt.textContent = state;
				if (state === selectedState) opt.selected = true;
				stateSel.appendChild(opt);
			});
			stateSel.disabled = false;

			if (selectedState) {
				populateCities(country, selectedState, selectedCity);
			}
		}

		function populateStatesFallback(country, selectedState = '', selectedCity = '') {
			stateSel.innerHTML = '<option value="">-- Select State * --</option>';
			citySel.innerHTML = '<option value="">-- Select City * --</option>';
			stateSel.disabled = true;
			citySel.disabled = true;

			if (country && locationData[country]) {
				stateSel.disabled = false;
				Object.keys(locationData[country]).forEach(state => {
					const opt = document.createElement('option');
					opt.value = state;
					opt.textContent = state;
					if (state === selectedState) opt.selected = true;
					stateSel.appendChild(opt);
				});
				if (selectedState) {
					populateCitiesFallback(country, selectedState, selectedCity);
				}
			}
		}

		async function populateCities(country, state, selectedCity = '') {
			citySel.innerHTML = '<option value="">-- Loading cities... --</option>';
			citySel.disabled = true;

			if (!country || !state) {
				citySel.innerHTML = '<option value="">-- Select City * --</option>';
				return;
			}

			if (useFallback || (locationData[country] && locationData[country][state])) {
				populateCitiesFallback(country, state, selectedCity);
				return;
			}

			try {
				const cacheKey = `${country}_${state}`;
				if (apiCities[cacheKey]) {
					renderCities(apiCities[cacheKey], selectedCity);
					return;
				}

				const res = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ country, state })
				});
				if (!res.ok) throw new Error('Cities fetch failed');
				const json = await res.json();
				if (json.error) throw new Error(json.msg);

				const cities = json.data.sort();
				apiCities[cacheKey] = cities;
				renderCities(cities, selectedCity);
			} catch (err) {
				console.warn(`Cities API failed for ${country} -> ${state}. Trying fallback...`, err);
				if (locationData[country] && locationData[country][state]) {
					populateCitiesFallback(country, state, selectedCity);
				} else {
					citySel.innerHTML = '<option value="">-- Select City * --</option>';
					citySel.disabled = true;
				}
			}
		}

		function renderCities(cities, selectedCity) {
			citySel.innerHTML = '<option value="">-- Select City * --</option>';
			if (cities.length === 0) {
				const opt = document.createElement('option');
				opt.value = 'N/A';
				opt.textContent = 'N/A';
				opt.selected = true;
				citySel.appendChild(opt);
				citySel.disabled = false;
				return;
			}

			cities.forEach(city => {
				const opt = document.createElement('option');
				opt.value = city;
				opt.textContent = city;
				if (city === selectedCity) opt.selected = true;
				citySel.appendChild(opt);
			});
			citySel.disabled = false;
		}

		function populateCitiesFallback(country, state, selectedCity = '') {
			citySel.innerHTML = '<option value="">-- Select City * --</option>';
			citySel.disabled = true;

			if (country && state && locationData[country] && locationData[country][state]) {
				citySel.disabled = false;
				locationData[country][state].forEach(city => {
					const opt = document.createElement('option');
					opt.value = city;
					opt.textContent = city;
					if (city === selectedCity) opt.selected = true;
					citySel.appendChild(opt);
				});
			}
		}

		// Event Listeners
		countrySel.addEventListener('change', function() {
			populateStates(this.value);
			validateZip();
		});

		stateSel.addEventListener('change', function() {
			populateCities(countrySel.value, this.value);
			validateZip();
		});

		citySel.addEventListener('change', function() {
			validateZip();
		});

		if (zipInput) {
			zipInput.addEventListener('input', validateZip);
		}

		// ZIP / Postal Code Validation per Selected Country (Requirement 3: integer zip code)
		function validateZip() {
			if (!zipInput) return;
			const country = countrySel.value;
			const zip = zipInput.value.trim();

			if (!zip) {
				zipInput.setCustomValidity('');
				return;
			}

			// ZIP must be pure digits (integer representation)
			if (!/^\d+$/.test(zip)) {
				zipInput.setCustomValidity('ZIP code must be a valid integer (digits only).');
				return;
			}

			if (country === 'Nigeria') {
				// 6-digit numeric pattern
				if (!/^\d{6}$/.test(zip)) {
					zipInput.setCustomValidity('Nigerian ZIP code must be exactly 6 digits (e.g. Lagos is 100001).');
				} else {
					zipInput.setCustomValidity('');
				}
			} else if (country === 'United States') {
				// 5-digit numeric pattern
				if (!/^\d{5}$/.test(zip)) {
					zipInput.setCustomValidity('US ZIP code must be exactly 5 digits.');
				} else {
					zipInput.setCustomValidity('');
				}
			} else {
				zipInput.setCustomValidity('');
			}
		}

		// Initialize selectors
		initLocationPickers();
	}
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

// ── 10-Minute Inactivity Auto-Logout Timer ────────────────────────────────────
(function () {
	// Inactivity auto-logout only applies to logged-in users (indicated by logout button presence)
	const logoutBtn = document.querySelector('.btn-logout');
	if (!logoutBtn) return;

	let inactivityTimeout;
	const inactivityLimit = 10 * 60 * 1000; // 10 minutes in milliseconds

	function triggerAutoLogout() {
		window.location.href = "/logout?timeout=1";
	}

	function resetInactivityTimer() {
		clearTimeout(inactivityTimeout);
		inactivityTimeout = setTimeout(triggerAutoLogout, inactivityLimit);
	}

	// Register user input interaction events to track active engagement
	const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
	events.forEach(function (event) {
		document.addEventListener(event, resetInactivityTimer, { passive: true });
	});

	// Initialize inactivity tracking countdown on page load
	resetInactivityTimer();
})();