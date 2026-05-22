// Mobile Navigation - FIXED VERSION
document.addEventListener('DOMContentLoaded', function () {
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
		menuBtn.addEventListener('click', function (e) {
			e.stopPropagation();
			const isOpen = navLinks.style.display === 'flex';
			navLinks.style.display = isOpen ? 'none' : 'flex';
			this.innerHTML = isOpen ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
			this.setAttribute('aria-expanded', String(!isOpen));

			// Toggle body class for backdrop
			document.body.classList.toggle('menu-open', !isOpen);
		});

		// Close menu when clicking outside
		document.addEventListener('click', function (e) {
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
			close.addEventListener('click', function () {
				alert.classList.add('closing');
				setTimeout(() => alert.remove(), 300);
			});
		}

		// Auto-dismiss all floating alerts after exactly 5s (5000ms)
		setTimeout(() => {
			if (!document.body.contains(alert)) return;
			alert.classList.add('closing');
			setTimeout(() => alert.remove(), 300);
		}, 5000);
	});

	// ── Required-field red border on failed submit ──────────────────────────
	document.querySelectorAll('form').forEach(function (form) {
		form.addEventListener('submit', function (e) {
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

		// Helper to ensure "Can't find it? Type manually" link exists next to dropdown
		function ensureTypeManuallyLink(selectEl, fieldName, placeholderText) {
			const parent = selectEl.parentNode;
			if (!parent) return;

			// Check if link already exists
			let linkWrapper = parent.querySelector(`.type-manually-link-wrapper[data-field="${fieldName}"]`);
			if (linkWrapper) return;

			linkWrapper = document.createElement('div');
			linkWrapper.className = 'type-manually-link-wrapper';
			linkWrapper.setAttribute('data-field', fieldName);
			linkWrapper.style.marginTop = '6px';
			linkWrapper.style.textAlign = 'right';

			const toggleLink = document.createElement('a');
			toggleLink.href = '#';
			toggleLink.className = 'toggle-location-mode';
			toggleLink.style.fontSize = '12.5px';
			toggleLink.style.fontWeight = '700';
			toggleLink.style.color = 'var(--primary-blue)';
			toggleLink.style.textDecoration = 'none';
			toggleLink.textContent = "Can't find it? Type manually";

			toggleLink.addEventListener('click', function (e) {
				e.preventDefault();
				linkWrapper.remove();
				convertToManualInput(selectEl, fieldName, placeholderText);
			});

			linkWrapper.appendChild(toggleLink);
			parent.insertBefore(linkWrapper, selectEl.nextSibling);
		}

		// Helper to hide/show "Can't find it? Type manually" link depending on select value
		function updateTypeManuallyLinkVisibility(selectEl, fieldName) {
			const parent = selectEl.parentNode;
			if (!parent) return;
			const linkWrapper = parent.querySelector(`.type-manually-link-wrapper[data-field="${fieldName}"]`);
			if (!linkWrapper) return;

			if (selectEl.disabled || selectEl.style.display === 'none' || (selectEl.value && selectEl.value !== '__custom__')) {
				linkWrapper.style.display = 'none';
			} else {
				linkWrapper.style.display = '';
			}
		}

		// Helper to convert select to text input
		function convertToManualInput(selectEl, fieldName, placeholderText) {
			const parent = selectEl.parentNode;
			if (!parent) return;

			// Clean up any existing "Can't find it? Type manually" link
			const existingTypeManuallyWrapper = parent.querySelector(`.type-manually-link-wrapper[data-field="${fieldName}"]`);
			if (existingTypeManuallyWrapper) {
				existingTypeManuallyWrapper.remove();
			}

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

			toggleLink.addEventListener('click', function (e) {
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
					// Remove dependent text inputs if any
					const parentState = stateSel.parentNode;
					const stateTextInput = parentState.querySelector('input[name="state"]');
					if (stateTextInput) {
						stateTextInput.remove();
						const stateLinkWrapper = parentState.querySelector('.toggle-select-link-wrapper');
						if (stateLinkWrapper) stateLinkWrapper.remove();
						stateSel.style.display = '';
						stateSel.name = 'state';
					}
					const parentCity = citySel.parentNode;
					const cityTextInput = parentCity.querySelector('input[name="city"]');
					if (cityTextInput) {
						cityTextInput.remove();
						const cityLinkWrapper = parentCity.querySelector('.toggle-select-link-wrapper');
						if (cityLinkWrapper) cityLinkWrapper.remove();
						citySel.style.display = '';
						citySel.name = 'city';
					}
				} else if (fieldName === 'state') {
					citySel.innerHTML = '<option value="">-- Select City * --</option>';
					citySel.disabled = true;
					// Remove dependent text inputs if any
					const parentCity = citySel.parentNode;
					const cityTextInput = parentCity.querySelector('input[name="city"]');
					if (cityTextInput) {
						cityTextInput.remove();
						const cityLinkWrapper = parentCity.querySelector('.toggle-select-link-wrapper');
						if (cityLinkWrapper) cityLinkWrapper.remove();
						citySel.style.display = '';
						citySel.name = 'city';
					}
				}

				validateZip();
				// Re-create the "Can't find it? Type manually" link
				ensureTypeManuallyLink(selectEl, fieldName, placeholderText);
				updateTypeManuallyLinkVisibility(selectEl, fieldName);
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
			if (countrySel.dataset.locked === 'true') {
				countrySel.disabled = true;
				stateSel.disabled = true;
				citySel.disabled = true;
				if (zipInput) zipInput.disabled = true;

				const initCountry = countrySel.getAttribute('data-selected') || '';
				const initState = stateSel.getAttribute('data-selected') || '';
				const initCity = citySel.getAttribute('data-selected') || '';

				countrySel.innerHTML = `<option value="${initCountry}">${initCountry}</option>`;
				stateSel.innerHTML = `<option value="${initState}">${initState}</option>`;
				citySel.innerHTML = `<option value="${initCity}">${initCity}</option>`;
				return;
			}

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
			} finally {
				if (countrySel.style.display !== 'none') {
					ensureTypeManuallyLink(countrySel, 'country', 'Enter Country Name');
					updateTypeManuallyLinkVisibility(countrySel, 'country');
				}
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

			if (countrySel.style.display !== 'none') {
				ensureTypeManuallyLink(countrySel, 'country', 'Enter Country Name');
				updateTypeManuallyLinkVisibility(countrySel, 'country');
			}
		}

		async function populateStates(country, selectedState = '', selectedCity = '') {
			stateSel.innerHTML = '<option value="">-- Loading states... --</option>';
			citySel.innerHTML = '<option value="">-- Select City * --</option>';
			stateSel.disabled = true;
			citySel.disabled = true;

			updateTypeManuallyLinkVisibility(stateSel, 'state');
			updateTypeManuallyLinkVisibility(citySel, 'city');

			if (!country || country === '__custom__') {
				stateSel.innerHTML = '<option value="">-- Select State * --</option>';
				return;
			}

			if (useFallback || locationData[country]) {
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

			if (stateSel.style.display !== 'none') {
				ensureTypeManuallyLink(stateSel, 'state', 'Enter State Name');
				updateTypeManuallyLinkVisibility(stateSel, 'state');
			}
		}

		function populateStatesFallback(country, selectedState = '', selectedCity = '') {
			stateSel.innerHTML = '<option value="">-- Select State * --</option>';
			citySel.innerHTML = '<option value="">-- Select City * --</option>';
			stateSel.disabled = true;
			citySel.disabled = true;

			updateTypeManuallyLinkVisibility(stateSel, 'state');
			updateTypeManuallyLinkVisibility(citySel, 'city');

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

				if (stateSel.style.display !== 'none') {
					ensureTypeManuallyLink(stateSel, 'state', 'Enter State Name');
					updateTypeManuallyLinkVisibility(stateSel, 'state');
				}
			}
		}

		async function populateCities(country, state, selectedCity = '') {
			citySel.innerHTML = '<option value="">-- Loading cities... --</option>';
			citySel.disabled = true;

			updateTypeManuallyLinkVisibility(citySel, 'city');

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

			if (citySel.style.display !== 'none') {
				ensureTypeManuallyLink(citySel, 'city', 'Enter City Name');
				updateTypeManuallyLinkVisibility(citySel, 'city');
			}
		}

		function populateCitiesFallback(country, state, selectedCity = '') {
			citySel.innerHTML = '<option value="">-- Select City * --</option>';
			citySel.disabled = true;

			updateTypeManuallyLinkVisibility(citySel, 'city');

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

				if (citySel.style.display !== 'none') {
					ensureTypeManuallyLink(citySel, 'city', 'Enter City Name');
					updateTypeManuallyLinkVisibility(citySel, 'city');
				}
			}
		}

		// Event Listeners
		countrySel.addEventListener('change', function () {
			if (this.value === '__custom__') {
				convertToManualInput(this, 'country', 'Enter Country Name');
			} else {
				populateStates(this.value);
			}
			validateZip();
			updateTypeManuallyLinkVisibility(this, 'country');
		});

		stateSel.addEventListener('change', function () {
			if (this.value === '__custom__') {
				convertToManualInput(this, 'state', 'Enter State Name');
			} else {
				populateCities(countrySel.value, this.value);
			}
			validateZip();
			updateTypeManuallyLinkVisibility(this, 'state');
		});

		citySel.addEventListener('change', function () {
			if (this.value === '__custom__') {
				convertToManualInput(this, 'city', 'Enter City Name');
			}
			validateZip();
			updateTypeManuallyLinkVisibility(this, 'city');
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

// ============================================================================
// PREMIUM PLATFORM SUITE - INTERACTIVE FEATURE CONTROLLERS
// ============================================================================

// ── 1. Slate-Based Glassmorphic Dual-Theme Mode Toggle ────────────────────────
(function () {
	function initThemeToggle() {
		const themeToggle = document.getElementById('theme-toggle');
		if (!themeToggle) return;

		// Apply saved theme or system preference
		const currentTheme = localStorage.getItem('theme') || 'dark';
		document.documentElement.setAttribute('data-theme', currentTheme);
		updateToggleIcon(currentTheme);

		themeToggle.addEventListener('click', function () {
			const activeTheme = document.documentElement.getAttribute('data-theme');
			const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
			document.documentElement.setAttribute('data-theme', newTheme);
			localStorage.setItem('theme', newTheme);
			updateToggleIcon(newTheme);
		});

		function updateToggleIcon(theme) {
			const icon = themeToggle.querySelector('i');
			if (icon) {
				if (theme === 'dark') {
					icon.className = 'fas fa-sun';
				} else {
					icon.className = 'fas fa-moon';
				}
			}
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initThemeToggle);
	} else {
		initThemeToggle();
	}
})();

// ── 2. Interactive Leaflet.js Geocoded Job Map ───────────────────────────────
(function () {
	async function initJobMap() {
		const mapContainer = document.getElementById('leaflet-job-map');
		if (!mapContainer) return;

		// Collect job cards from DOM to plot markers
		const jobCards = document.querySelectorAll('.job-card[data-lat][data-lng]');
		if (jobCards.length === 0 && !mapContainer) return;

		// Default map coordinates: Abuja, Nigeria
		let defaultLat = 9.0820;
		let defaultLng = 8.6753;
		let defaultZoom = 6;

		// Initialize Map
		const map = L.map('leaflet-job-map', {
			zoomControl: true,
			scrollWheelZoom: true
		}).setView([defaultLat, defaultLng], defaultZoom);

		// Standard OSM tiles
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		const markersCluster = L.markerClusterGroup({
			chunkedLoading: true,
			spiderfyOnMaxZoom: true,
			showCoverageOnHover: false,
			zoomToBoundsOnClick: true
		});

		const markers = {};
		const latLngs = [];

		// Plot job cards from DOM
		jobCards.forEach(card => {
			const id = card.dataset.jobId;
			const lat = parseFloat(card.dataset.lat);
			const lng = parseFloat(card.dataset.lng);
			const title = card.dataset.title;
			const company = card.dataset.company;
			const category = card.dataset.category;
			const distance = card.dataset.distance;
			const salaryMin = card.dataset.salaryMin;
			const salaryMax = card.dataset.salaryMax;

			if (isNaN(lat) || isNaN(lng)) return;

			const latLng = [lat, lng];
			latLngs.push(latLng);

			// Construct custom card popup content
			let popupContent = `
                <div class="map-popup-card" style="padding: 4px;">
                    <h4 style="font-weight: 700; font-size: 14px; margin: 0 0 4px 0; color: var(--text-dark); font-family: 'Outfit', sans-serif;">${title}</h4>
                    <div style="font-size: 12px; font-weight: 600; color: var(--primary-blue); margin-bottom: 6px;"><i class="fas fa-building"></i> ${company}</div>
                    <div style="font-size: 11px; color: var(--text-gray); margin-bottom: 6px;">
                        <span style="display: block; margin-bottom: 2px;"><i class="fas fa-tag"></i> ${category}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${distance} km away</span>
                    </div>
            `;

			if (salaryMin && salaryMax) {
				popupContent += `
                    <div style="font-size: 12.5px; font-weight: 700; color: var(--success-green); margin-bottom: 10px;">
                        ₦${Number(salaryMin).toLocaleString()} - ₦${Number(salaryMax).toLocaleString()}
                    </div>
                `;
			}

			popupContent += `
                    <a href="/jobs/${id}" class="btn btn-primary" style="padding: 6px 12px; font-size: 11px; width: 100%; text-align: center; display: block; border-radius: 6px; box-sizing: border-box; text-decoration: none; font-weight: bold; color: white;">
                        <i class="fas fa-eye"></i> View Job
                    </a>
                </div>
            `;

			const marker = L.marker(latLng).bindPopup(popupContent);
			markersCluster.addLayer(marker);
			markers[id] = marker;

			// Hover and click center syncing
			card.addEventListener('mouseenter', () => {
				map.setView(latLng, 13);
				marker.openPopup();
			});

			card.addEventListener('click', (e) => {
				// Prevent triggering if they clicked a button inside the card
				if (e.target.closest('button') || e.target.closest('a')) return;
				map.setView(latLng, 13);
				marker.openPopup();
				card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			});

			const viewMapBtn = card.querySelector('.view-on-map-btn');
			if (viewMapBtn) {
				viewMapBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					map.setView(latLng, 13);
					marker.openPopup();
					mapContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
				});
			}
		});

		// Try to fetch geocoded endpoint to get Seeker's own home location and plot a pulsing marker
		try {
			const searchParams = window.location.search;
			const res = await fetch(`/api/jobs/geocoded${searchParams}`);
			if (res.ok) {
				const data = await res.json();
				if (data.user && data.user.latitude && data.user.longitude) {
					const userLat = parseFloat(data.user.latitude);
					const userLng = parseFloat(data.user.longitude);
					if (!isNaN(userLat) && !isNaN(userLng)) {
						const userIcon = L.divIcon({
							className: 'pulse-user-marker',
							iconSize: [16, 16],
							iconAnchor: [8, 8]
						});
						L.marker([userLat, userLng], { icon: userIcon })
							.addTo(map)
							.bindPopup(`<strong style="font-size: 12px; color: var(--primary-blue);"><i class="fas fa-home"></i> Your Location</strong>`);

						latLngs.push([userLat, userLng]);
					}
				}
			}
		} catch (err) {
			console.warn('Could not load user geocoded coordinates', err);
		}

		map.addLayer(markersCluster);

		// Fit map to bounds of all plotted points show all markers beautifully
		if (latLngs.length > 0) {
			const bounds = L.latLngBounds(latLngs);
			map.fitBounds(bounds, { padding: [50, 50] });
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initJobMap);
	} else {
		initJobMap();
	}
})();

// ── 3. Employer Kanban Drag-and-Drop Pipeline ────────────────────────────────
(function () {
	function initKanbanPipeline() {
		const kanbanBoard = document.getElementById('kanban-board-view');
		const detailedList = document.getElementById('detailed-list-view');
		const toggleKanbanBtn = document.getElementById('toggle-kanban-btn');
		const toggleListBtn = document.getElementById('toggle-list-btn');

		if (!kanbanBoard && !detailedList) return;

		// ── 3.1. Toggle Views ──────────────────────────────────────────────────
		if (toggleKanbanBtn && toggleListBtn) {
			toggleKanbanBtn.addEventListener('click', () => {
				kanbanBoard.style.display = 'flex';
				detailedList.style.display = 'none';
				toggleKanbanBtn.classList.add('active');
				toggleListBtn.classList.remove('active');
			});

			toggleListBtn.addEventListener('click', () => {
				kanbanBoard.style.display = 'none';
				detailedList.style.display = 'block';
				toggleListBtn.classList.add('active');
				toggleKanbanBtn.classList.remove('active');
			});
		}

		// ── 3.2. Initial column count calculators ──────────────────────────────
		function updateColumnCounts() {
			document.querySelectorAll('.kanban-column').forEach(col => {
				const countEl = col.querySelector('.kanban-column-count');
				if (countEl) {
					const count = col.querySelectorAll('.kanban-card').length;
					countEl.textContent = count;
				}
			});
		}
		updateColumnCounts();

		// ── 3.3. HTML5 Drag and Drop events ────────────────────────────────────
		const cards = document.querySelectorAll('.kanban-card');
		const columns = document.querySelectorAll('.kanban-column');

		cards.forEach(card => {
			card.addEventListener('dragstart', (e) => {
				card.classList.add('dragging');
				e.dataTransfer.setData('text/plain', card.dataset.applicationId);
			});

			card.addEventListener('dragend', () => {
				card.classList.remove('dragging');
			});
		});

		columns.forEach(col => {
			const container = col.querySelector('.kanban-cards-container');
			if (!container) return;

			col.addEventListener('dragover', (e) => {
				e.preventDefault();
				col.classList.add('dragover-glow');
			});

			col.addEventListener('dragleave', () => {
				col.classList.remove('dragover-glow');
			});

			col.addEventListener('drop', async (e) => {
				e.preventDefault();
				col.classList.remove('dragover-glow');

				const appId = e.dataTransfer.getData('text/plain');
				const card = document.getElementById(`kanban-app-${appId}`);
				if (!card) return;

				const newStatus = col.dataset.status;

				// Fire async status updater fetch
				const success = await updateApplicationStatus(appId, newStatus);
				if (success) {
					container.appendChild(card);
					updateColumnCounts();

					// Trigger settle-spring bounce animation
					card.classList.add('settle-spring');
					setTimeout(() => card.classList.remove('settle-spring'), 500);
				}
			});
		});

		// ── 3.4. Async update handler ──────────────────────────────────────────
		async function updateApplicationStatus(appId, newStatus) {
			try {
				const res = await fetch(`/api/applications/${appId}/status`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ status: newStatus })
				});

				if (!res.ok) throw new Error('Failed to update status');
				const data = await res.json();
				if (data.success) {
					// Sync Detailed list elements if present
					syncDetailedListElements(appId, newStatus);
					showToast('Application status updated successfully!', 'success');
					return true;
				}
			} catch (err) {
				console.error(err);
				showToast('Failed to update application status.', 'error');
			}
			return false;
		}

		// Sync detailed list inputs & badges with Kanban updates
		function syncDetailedListElements(appId, newStatus) {
			const jobCard = document.querySelector(`.job-card[data-application-id="${appId}"]`);
			if (!jobCard) return;

			// Update status select dropdown value
			const selectEl = jobCard.querySelector('.list-status-select');
			if (selectEl) selectEl.value = newStatus;

			// Update badge text and color class
			const badgeEl = document.getElementById(`list-badge-${appId}`);
			if (badgeEl) {
				badgeEl.textContent = newStatus.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

				// Reset classes
				badgeEl.className = 'badge';
				if (newStatus === 'accepted') badgeEl.classList.add('badge-success');
				else if (newStatus === 'rejected') badgeEl.classList.add('badge-danger');
				else if (newStatus === 'interview') badgeEl.classList.add('badge-primary');
				else if (newStatus === 'under_review') badgeEl.classList.add('badge-warning');
				else badgeEl.classList.add('badge-secondary');
			}
		}

		// Hijack Detailed list forms to make updates asynchronous and sync back to Kanban
		document.querySelectorAll('.list-status-form').forEach(form => {
			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				const appId = form.dataset.applicationId;
				const selectEl = form.querySelector('.list-status-select');
				if (!selectEl) return;

				const newStatus = selectEl.value;
				const success = await updateApplicationStatus(appId, newStatus);
				if (success) {
					// Move the Kanban card to the new status column container dynamically
					const kanbanCard = document.getElementById(`kanban-app-${appId}`);
					const targetCol = document.querySelector(`.kanban-column[data-status="${newStatus}"]`);
					if (kanbanCard && targetCol) {
						const container = targetCol.querySelector('.kanban-cards-container');
						if (container) {
							container.appendChild(kanbanCard);
							updateColumnCounts();
							kanbanCard.classList.add('settle-spring');
							setTimeout(() => kanbanCard.classList.remove('settle-spring'), 500);
						}
					}
				}
			});
		});

		// Toast Helper
		function showToast(message, type = 'success') {
			const container = document.querySelector('.flash-toast-container') || document.body;
			const toast = document.createElement('div');
			toast.className = `alert alert-${type}`;
			toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" style="color: var(--${type === 'success' ? 'success-green' : 'danger-red'}); font-size: 16px;"></i>
                    <span>${message}</span>
                </div>
                <button class="alert-close" aria-label="Close">×</button>
            `;
			container.appendChild(toast);

			// Bind close action
			toast.querySelector('.alert-close').addEventListener('click', () => {
				toast.classList.add('closing');
				setTimeout(() => toast.remove(), 300);
			});

			// Auto-dismiss after 4s
			setTimeout(() => {
				if (document.body.contains(toast)) {
					toast.classList.add('closing');
					setTimeout(() => toast.remove(), 300);
				}
			}, 4000);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initKanbanPipeline);
	} else {
		initKanbanPipeline();
	}
})();

// ── 4. Dynamic Global Chat Drawer Poller ─────────────────────────────────────
(function () {
	let activeRecipientId = null;
	let pollerIntervalId = null;
	let localMessageIds = new Set(); // Keep track of seen messages to avoid duplicate chime sound

	function initChatDrawer() {
		const triggerBtn = document.getElementById('chat-widget-trigger');
		const drawer = document.getElementById('chat-drawer');
		const closeBtn = document.getElementById('chat-drawer-close');
		const backBtn = document.getElementById('chat-conv-back');
		const contactsPane = document.getElementById('chat-contacts-pane');
		const convPane = document.getElementById('chat-conversation-pane');
		const contactsList = document.getElementById('chat-contacts-list');
		const messagesArea = document.getElementById('chat-messages-area');
		const inputForm = document.getElementById('chat-input-form');
		const messageInput = document.getElementById('chat-message-input');
		const badgeCount = document.getElementById('chat-badge-count');
		const contactSearch = document.getElementById('chat-contact-search');

		if (!triggerBtn || !drawer) return;

		// ── 4.1. Toggle Open / Close ──────────────────────────────────────────
		triggerBtn.addEventListener('click', () => {
			drawer.classList.toggle('open');
			if (drawer.classList.contains('open')) {
				loadContacts();
			}
		});

		closeBtn.addEventListener('click', () => {
			drawer.classList.remove('open');
		});

		backBtn.addEventListener('click', () => {
			activeRecipientId = null;
			convPane.classList.remove('active');
			contactsPane.style.display = 'flex';
			loadContacts();
		});

		// ── 4.2. Bind Open Actions on Global Candidate/Recruiter Links ─────────
		document.body.addEventListener('click', function (e) {
			const chatBtn = e.target.closest('.open-chat-btn');
			if (chatBtn) {
				e.preventDefault();
				const recipientId = parseInt(chatBtn.dataset.recipientId);
				const recipientName = chatBtn.dataset.recipientName;
				if (isNaN(recipientId)) return;

				// Open messaging drawer
				drawer.classList.add('open');

				// Directly switch to the specific user's conversation thread
				openConversation(recipientId, recipientName);
			}
		});

		// ── 4.3. Load Contacts List ───────────────────────────────────────────
		async function loadContacts() {
			try {
				const res = await fetch('/api/messages/contacts');
				if (!res.ok) return;
				const data = await res.json();

				renderContacts(data.contacts);
			} catch (err) {
				console.error(err);
			}
		}

		function renderContacts(contacts) {
			contactsList.innerHTML = '';
			if (contacts.length === 0) {
				contactsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-gray); font-size: 13px;">No active conversations yet.</div>';
				return;
			}

			const searchVal = contactSearch ? contactSearch.value.toLowerCase().trim() : '';

			contacts.forEach(contact => {
				// Filter search if query present
				if (searchVal && !contact.full_name.toLowerCase().includes(searchVal)) return;

				const initial = (contact.full_name || 'U')[0].toUpperCase();
				const badgeHtml = contact.unread_count > 0 ? `<span class="chat-contact-badge">${contact.unread_count}</span>` : '';
				const activeClass = activeRecipientId === contact.id ? 'active' : '';

				const contactItem = document.createElement('div');
				contactItem.className = `chat-contact-item ${activeClass}`;
				contactItem.dataset.recipientId = contact.id;
				contactItem.dataset.recipientName = contact.full_name;

				contactItem.innerHTML = `
                    <div class="chat-contact-avatar">
                        ${initial}
                        <div class="chat-online-dot"></div>
                    </div>
                    <div class="chat-contact-details">
                        <div class="chat-contact-name">${contact.full_name}</div>
                        <div class="chat-contact-preview">${contact.last_message || 'No messages yet'}</div>
                    </div>
                    ${badgeHtml}
                `;

				contactItem.addEventListener('click', () => {
					openConversation(contact.id, contact.full_name);
				});

				contactsList.appendChild(contactItem);
			});
		}

		// Contact search listener
		if (contactSearch) {
			contactSearch.addEventListener('input', () => {
				loadContacts();
			});
		}

		// ── 4.4. Switch & Load Conversation ──────────────────────────────────
		function openConversation(recipientId, recipientName) {
			activeRecipientId = recipientId;
			contactsPane.style.display = 'none';
			convPane.classList.add('active');

			// Set headers
			document.getElementById('chat-active-contact-name').textContent = recipientName;
			document.getElementById('chat-active-contact-avatar').textContent = (recipientName || 'U')[0].toUpperCase();
			document.getElementById('chat-active-contact-status').textContent = 'Online';

			// Fake brief human typing dot bubble indicator
			const typingIndicator = document.getElementById('chat-typing-indicator');
			if (typingIndicator) {
				typingIndicator.style.display = 'flex';
				setTimeout(() => {
					typingIndicator.style.display = 'none';
				}, 600);
			}

			loadMessageHistory(recipientId, true);
		}

		async function loadMessageHistory(recipientId, shouldScroll = false) {
			if (activeRecipientId !== recipientId) return;

			try {
				const res = await fetch(`/api/messages/${recipientId}`);
				if (!res.ok) return;
				const data = await res.json();

				renderMessages(data.messages, recipientId, shouldScroll);
			} catch (err) {
				console.error(err);
			}
		}

		function renderMessages(messages, recipientId, shouldScroll) {
			let newlyAddedCount = 0;
			messagesArea.innerHTML = '';

			messages.forEach(msg => {
				const isReceived = msg.sender_id === recipientId;
				const bubble = document.createElement('div');
				bubble.className = `chat-msg-bubble ${isReceived ? 'received' : 'sent'}`;

				// Tone chime if we receive a completely new message that wasn't already loaded in history
				if (isReceived && !localMessageIds.has(msg.id)) {
					newlyAddedCount++;
				}
				localMessageIds.add(msg.id);

				const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
				bubble.innerHTML = `
                    <div>${msg.content}</div>
                    <div class="chat-msg-time">${timeStr}</div>
                `;
				messagesArea.appendChild(bubble);
			});

			// Trigger tone chime if a brand new unread received bubble landed
			if (newlyAddedCount > 0 && !shouldScroll) {
				playNotificationSound();
			}

			if (shouldScroll || newlyAddedCount > 0) {
				messagesArea.scrollTop = messagesArea.scrollHeight;
			}
		}

		// ── 4.5. Send Message ──────────────────────────────────────────────────
		inputForm.addEventListener('submit', async (e) => {
			e.preventDefault();
			const text = messageInput.value.trim();
			if (!text || !activeRecipientId) return;

			// Clear input field instantly to feel hyper-responsive
			messageInput.value = '';

			try {
				const res = await fetch('/api/messages/send', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						recipient_id: activeRecipientId,
						content: text
					})
				});

				if (res.ok) {
					const data = await res.json();
					localMessageIds.add(data.message.id);

					// Instantly append bubble
					const bubble = document.createElement('div');
					bubble.className = 'chat-msg-bubble sent';
					const timeStr = new Date(data.message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
					bubble.innerHTML = `
                        <div>${data.message.content}</div>
                        <div class="chat-msg-time">${timeStr}</div>
                    `;
					messagesArea.appendChild(bubble);
					messagesArea.scrollTop = messagesArea.scrollHeight;

					// Reload background contacts
					loadContacts();
				}
			} catch (err) {
				console.error(err);
			}
		});

		// ── 4.6. dynamic Tone chime generator via Web Audio API ────────────────
		function playNotificationSound() {
			try {
				const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
				const oscillator = audioCtx.createOscillator();
				const gainNode = audioCtx.createGain();

				oscillator.connect(gainNode);
				gainNode.connect(audioCtx.destination);

				oscillator.type = 'sine';
				oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 tone
				oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5 tone

				gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

				oscillator.start();
				oscillator.stop(audioCtx.currentTime + 0.25);
			} catch (err) {
				console.warn('Audio context blocked or unsupported', err);
			}
		}

		// ── 4.7. Dynamic Poller Loop (Every 4 seconds) ────────────────────────
		async function runPollerCycle() {
			try {
				// Fetch unread count to update badge
				const unreadRes = await fetch('/api/messages/unread');
				if (unreadRes.ok) {
					const unreadData = await unreadRes.json();
					if (unreadData.unread_count > 0) {
						badgeCount.textContent = unreadData.unread_count;
						badgeCount.style.display = 'flex';
					} else {
						badgeCount.style.display = 'none';
					}
				}

				// If active chat drawer pane open, update chat histories and contact listings
				if (drawer.classList.contains('open')) {
					if (activeRecipientId) {
						loadMessageHistory(activeRecipientId, false);
					} else {
						loadContacts();
					}
				}
			} catch (err) {
				console.error(err);
			}
		}

		// Start interval
		if (pollerIntervalId) clearInterval(pollerIntervalId);
		pollerIntervalId = setInterval(runPollerCycle, 8000);
		runPollerCycle(); // run initially
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initChatDrawer);
	} else {
		initChatDrawer();
	}
})();

// ── 5. Smart Skills profile editor tag chip inputs ──────────────────────────
(function () {
	function initSkillsTagInput() {
		const container = document.getElementById('skills-tags-container');
		const hiddenInput = document.getElementById('skills_hidden');
		const rawInput = document.getElementById('skills_input_raw');
		if (!container || !hiddenInput || !rawInput) return;

		let skills = [];
		if (hiddenInput.value) {
			skills = hiddenInput.value.split(',').map(s => s.trim()).filter(s => s.length > 0);
		}

		// Function to render chips
		function renderChips() {
			// Remove existing chips
			container.querySelectorAll('.skills-tag-chip').forEach(chip => chip.remove());

			// Add new chips before the input field
			skills.forEach(skill => {
				const chip = document.createElement('div');
				chip.className = 'skills-tag-chip';
				chip.dataset.skill = skill;
				chip.innerHTML = `${skill}<button type="button" class="skills-tag-chip-remove"><i class="fas fa-times"></i></button>`;
				container.insertBefore(chip, rawInput);
			});
		}

		renderChips();

		// Keydown handler on raw input
		rawInput.addEventListener('keydown', function (e) {
			if (e.key === 'Enter' || e.key === ',') {
				e.preventDefault();
				const val = rawInput.value.trim().replace(/,/g, '');
				if (val && !skills.includes(val)) {
					skills.push(val);
					hiddenInput.value = skills.join(',');
					renderChips();
				}
				rawInput.value = '';
			}
		});

		// Handle blur as well to auto-add entered skill
		rawInput.addEventListener('blur', function () {
			const val = rawInput.value.trim().replace(/,/g, '');
			if (val && !skills.includes(val)) {
				skills.push(val);
				hiddenInput.value = skills.join(',');
				renderChips();
				rawInput.value = '';
			}
		});

		// Event delegation for removal
		container.addEventListener('click', function (e) {
			const removeBtn = e.target.closest('.skills-tag-chip-remove');
			if (removeBtn) {
				const chip = removeBtn.closest('.skills-tag-chip');
				if (chip) {
					const skillToRemove = chip.dataset.skill;
					skills = skills.filter(s => s !== skillToRemove);
					hiddenInput.value = skills.join(',');
					chip.remove();
				}
			}
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initSkillsTagInput);
	} else {
		initSkillsTagInput();
	}
})();

// ── Salary Range Validation & Promise-Based Glassmorphic Modals ────────────────
(function () {
	// 1. Client-Side Salary Validation
	function initSalaryValidation() {
		const minSalaryInput = document.getElementById('salary_min');
		const maxSalaryInput = document.getElementById('salary_max');
		if (!minSalaryInput || !maxSalaryInput) return;

		function validateSalaries() {
			const minVal = parseFloat(minSalaryInput.value);
			const maxVal = parseFloat(maxSalaryInput.value);
			if (!isNaN(minVal) && !isNaN(maxVal) && maxVal <= minVal) {
				maxSalaryInput.setCustomValidity('Maximum salary must be strictly greater than minimum salary.');
			} else {
				maxSalaryInput.setCustomValidity('');
			}
		}

		minSalaryInput.addEventListener('input', validateSalaries);
		maxSalaryInput.addEventListener('input', validateSalaries);
	}

	// 2. Promise-Based Glassmorphic Modals
	function initCustomModals() {
		const overlay = document.getElementById('custom-modal-overlay');
		if (!overlay) return;

		const titleEl = document.getElementById('custom-modal-title');
		const messageEl = document.getElementById('custom-modal-message');
		const closeBtn = document.getElementById('custom-modal-close');
		const cancelBtn = document.getElementById('custom-modal-cancel');
		const confirmBtn = document.getElementById('custom-modal-confirm');

		let activeResolver = null;

		function showModal(title, message, isConfirm = false) {
			return new Promise((resolve) => {
				activeResolver = resolve;
				titleEl.textContent = title || (isConfirm ? 'Confirm Action' : 'Alert');
				messageEl.textContent = message || '';

				cancelBtn.style.display = isConfirm ? 'block' : 'none';
				confirmBtn.textContent = isConfirm ? 'Confirm' : 'OK';

				overlay.style.display = 'flex';
				// Force reflow
				overlay.offsetHeight;
				overlay.classList.add('active');
			});
		}

		function closeModal(value) {
			overlay.classList.remove('active');
			setTimeout(() => {
				overlay.style.display = 'none';
				if (activeResolver) {
					activeResolver(value);
					activeResolver = null;
				}
			}, 300);
		}

		closeBtn.addEventListener('click', () => closeModal(false));
		cancelBtn.addEventListener('click', () => closeModal(false));
		confirmBtn.addEventListener('click', () => closeModal(true));

		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) {
				closeModal(false);
			}
		});

		// Override standard alert/confirm globals
		window.alert = function (message) {
			return showModal('Notification', message, false);
		};

		window.confirm = function (message) {
			return showModal('Confirm Action', message, true);
		};

		// 3. Intercept inline onsubmit confirmation forms transparently
		document.addEventListener('submit', function (e) {
			const form = e.target;
			const onsubmitAttr = form.getAttribute('onsubmit');
			if (onsubmitAttr && onsubmitAttr.includes('confirm(')) {
				if (!form.dataset.customConfirmed) {
					e.preventDefault();
					e.stopPropagation();
					const match = onsubmitAttr.match(/confirm\(['"](.*?)['"]\)/);
					const msg = match ? match[1] : "Are you sure?";

					window.confirm(msg).then((confirmed) => {
						if (confirmed) {
							form.dataset.customConfirmed = "true";
							form.submit();
						}
					});
				}
			}
		});
	}

	// Init everything on DOMContentLoaded
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			initSalaryValidation();
			initCustomModals();
		});
	} else {
		initSalaryValidation();
		initCustomModals();
	}
})();