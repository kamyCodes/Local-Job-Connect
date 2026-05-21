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
		// Helper to convert select to text input
		function convertToManualInput(selectEl, fieldName, placeholderText) {
			const parent = selectEl.parentNode;
			if (!parent) return;

			// Create text input
			const textInput = document.createElement('input');
			textInput.type = 'text';
			textInput.id = selectEl.id;
			textInput.name = fieldName;
			textInput.className = 'manual-location-input';
			textInput.placeholder = placeholderText;
			textInput.required = selectEl.required;
			
			// Copy styling/attributes to match design aesthetics
			textInput.style.width = '100%';
			textInput.style.padding = '12px 16px';
			textInput.style.border = '2px solid var(--border-color)';
			textInput.style.borderRadius = '12px';
			textInput.style.fontSize = '15px';
			textInput.style.fontWeight = '500';
			textInput.style.color = 'var(--text-dark)';
			textInput.style.background = 'var(--bg-light)';
			textInput.style.boxSizing = 'border-box';
			textInput.style.transition = 'all 0.25s ease';

			// Hide dropdown
			selectEl.style.display = 'none';
			selectEl.removeAttribute('name');
			selectEl.required = false;

			// Toggle back to dropdown list link
			const linkWrapper = document.createElement('div');
			linkWrapper.className = 'toggle-select-link-wrapper';
			linkWrapper.style.marginTop = '6px';
			linkWrapper.style.textAlign = 'right';

			const toggleLink = document.createElement('a');
			toggleLink.href = '#';
			toggleLink.className = 'toggle-location-mode';
			toggleLink.style.fontSize = '12.5px';
			toggleLink.style.fontWeight = '700';
			toggleLink.style.color = 'var(--primary-blue)';
			toggleLink.style.textDecoration = 'none';
			toggleLink.textContent = 'Choose from list';

			toggleLink.addEventListener('click', function(e) {
				e.preventDefault();
				textInput.remove();
				linkWrapper.remove();

				selectEl.name = fieldName;
				selectEl.required = textInput.required;
				selectEl.style.display = '';
				selectEl.value = '';

				if (fieldName === 'country') {
					stateSel.innerHTML = '<option value="">-- Select State * --</option>';
					stateSel.disabled = true;
					citySel.innerHTML = '<option value="">-- Select City * --</option>';
					citySel.disabled = true;
				} else if (fieldName === 'state') {
					citySel.innerHTML = '<option value="">-- Select City * --</option>';
					citySel.disabled = true;
				}

				validateZip();
			});

			linkWrapper.appendChild(toggleLink);

			parent.insertBefore(textInput, selectEl.nextSibling);
			parent.insertBefore(linkWrapper, textInput.nextSibling);

			textInput.focus();

			// Auto convert dependents
			if (fieldName === 'country') {
				const stateInput = parent.form ? parent.form.querySelector('input[name="state"]') : null;
				if (!stateInput && stateSel.style.display !== 'none') {
					convertToManualInput(stateSel, 'state', 'Enter State Name');
				}
				const cityInput = parent.form ? parent.form.querySelector('input[name="city"]') : null;
				if (!cityInput && citySel.style.display !== 'none') {
					convertToManualInput(citySel, 'city', 'Enter City Name');
				}
			} else if (fieldName === 'state') {
				const cityInput = parent.form ? parent.form.querySelector('input[name="city"]') : null;
				if (!cityInput && citySel.style.display !== 'none') {
					convertToManualInput(citySel, 'city', 'Enter City Name');
				}
			}
		}

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

				// Add manual option at the end
				const optCustom = document.createElement('option');
				optCustom.value = '__custom__';
				optCustom.textContent = '🔍 Other (Type Manually)...';
				countrySel.appendChild(optCustom);

				countrySel.disabled = false;

				const options = Array.from(countrySel.options).map(opt => opt.value);
				if (initCountry && !options.includes(initCountry) && initCountry !== '__custom__') {
					convertToManualInput(countrySel, 'country', 'Enter Country Name');
					const customInput = document.getElementById('country');
					if (customInput) customInput.value = initCountry;

					const stateInput = document.getElementById('state');
					if (stateInput) stateInput.value = initState || '';
					const cityInput = document.getElementById('city');
					if (cityInput) cityInput.value = initCity || '';
				} else if (initCountry) {
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

			const optCustom = document.createElement('option');
			optCustom.value = '__custom__';
			optCustom.textContent = '🔍 Other (Type Manually)...';
			countrySel.appendChild(optCustom);

			const options = Array.from(countrySel.options).map(opt => opt.value);
			if (initCountry && !options.includes(initCountry) && initCountry !== '__custom__') {
				convertToManualInput(countrySel, 'country', 'Enter Country Name');
				const customInput = document.getElementById('country');
				if (customInput) customInput.value = initCountry;

				const stateInput = document.getElementById('state');
				if (stateInput) stateInput.value = initState || '';
				const cityInput = document.getElementById('city');
				if (cityInput) cityInput.value = initCity || '';
			} else if (initCountry && locationData[initCountry]) {
				countrySel.value = initCountry;
				populateStatesFallback(initCountry, initState, initCity);
			}
		}

		async function populateStates(country, selectedState = '', selectedCity = '') {
			stateSel.innerHTML = '<option value="">-- Loading states... --</option>';
			citySel.innerHTML = '<option value="">-- Select City * --</option>';
			stateSel.disabled = true;
			citySel.disabled = true;

			if (!country || country === '__custom__') {
				stateSel.innerHTML = '<option value="">-- Select State * --</option>';
				return;
			}

			if (useFallback || (locationData[country] && !apiCountries.length)) {
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
					const optCustom = document.createElement('option');
					optCustom.value = '__custom__';
					optCustom.textContent = '🔍 Other (Type Manually)...';
					stateSel.appendChild(optCustom);
					stateSel.disabled = false;
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
				stateSel.appendChild(opt);
			});

			const optCustom = document.createElement('option');
			optCustom.value = '__custom__';
			optCustom.textContent = '🔍 Other (Type Manually)...';
			stateSel.appendChild(optCustom);

			stateSel.disabled = false;

			const options = Array.from(stateSel.options).map(opt => opt.value);
			if (selectedState && !options.includes(selectedState) && selectedState !== '__custom__' && selectedState !== 'N/A') {
				convertToManualInput(stateSel, 'state', 'Enter State Name');
				const customInput = document.getElementById('state');
				if (customInput) customInput.value = selectedState;

				const cityInput = document.getElementById('city');
				if (cityInput) cityInput.value = selectedCity || '';
			} else if (selectedState) {
				stateSel.value = selectedState;
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
					stateSel.appendChild(opt);
				});

				const optCustom = document.createElement('option');
				optCustom.value = '__custom__';
				optCustom.textContent = '🔍 Other (Type Manually)...';
				stateSel.appendChild(optCustom);

				const options = Array.from(stateSel.options).map(opt => opt.value);
				if (selectedState && !options.includes(selectedState) && selectedState !== '__custom__' && selectedState !== 'N/A') {
					convertToManualInput(stateSel, 'state', 'Enter State Name');
					const customInput = document.getElementById('state');
					if (customInput) customInput.value = selectedState;

					const cityInput = document.getElementById('city');
					if (cityInput) cityInput.value = selectedCity || '';
				} else if (selectedState) {
					stateSel.value = selectedState;
					populateCitiesFallback(country, selectedState, selectedCity);
				}
			}
		}

		async function populateCities(country, state, selectedCity = '') {
			citySel.innerHTML = '<option value="">-- Loading cities... --</option>';
			citySel.disabled = true;

			if (!country || !state || country === '__custom__' || state === '__custom__') {
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
					const optCustom = document.createElement('option');
					optCustom.value = '__custom__';
					optCustom.textContent = '🔍 Other (Type Manually)...';
					citySel.appendChild(optCustom);
					citySel.disabled = false;
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
				citySel.appendChild(opt);
			});

			const optCustom = document.createElement('option');
			optCustom.value = '__custom__';
			optCustom.textContent = '🔍 Other (Type Manually)...';
			citySel.appendChild(optCustom);

			citySel.disabled = false;

			const options = Array.from(citySel.options).map(opt => opt.value);
			if (selectedCity && !options.includes(selectedCity) && selectedCity !== '__custom__' && selectedCity !== 'N/A') {
				convertToManualInput(citySel, 'city', 'Enter City Name');
				const customInput = document.getElementById('city');
				if (customInput) customInput.value = selectedCity;
			} else if (selectedCity) {
				citySel.value = selectedCity;
			}
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
					citySel.appendChild(opt);
				});

				const optCustom = document.createElement('option');
				optCustom.value = '__custom__';
				optCustom.textContent = '🔍 Other (Type Manually)...';
				citySel.appendChild(optCustom);

				const options = Array.from(citySel.options).map(opt => opt.value);
				if (selectedCity && !options.includes(selectedCity) && selectedCity !== '__custom__' && selectedCity !== 'N/A') {
					convertToManualInput(citySel, 'city', 'Enter City Name');
					const customInput = document.getElementById('city');
					if (customInput) customInput.value = selectedCity;
				} else if (selectedCity) {
					citySel.value = selectedCity;
				}
			}
		}

		// Event Listeners
		countrySel.addEventListener('change', function() {
			if (this.value === '__custom__') {
				convertToManualInput(this, 'country', 'Enter Country Name');
			} else {
				populateStates(this.value);
			}
			validateZip();
		});

		stateSel.addEventListener('change', function() {
			if (this.value === '__custom__') {
				convertToManualInput(this, 'state', 'Enter State Name');
			} else {
				populateCities(countrySel.value, this.value);
			}
			validateZip();
		});

		citySel.addEventListener('change', function() {
			if (this.value === '__custom__') {
				convertToManualInput(this, 'city', 'Enter City Name');
			}
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