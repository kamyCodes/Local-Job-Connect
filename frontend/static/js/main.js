// Mobile Navigation - Add this to the top of your main.js

document.addEventListener('DOMContentLoaded', function() {
	// Create mobile menu toggle button
	const navbar = document.querySelector('.navbar .container');
	const navLinks = document.querySelector('.nav-links');
	
	if (navbar && navLinks && window.innerWidth <= 768) {
		// Create hamburger button
		const menuBtn = document.createElement('button');
		menuBtn.className = 'mobile-menu-toggle';
		menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
		menuBtn.setAttribute('aria-label', 'Toggle navigation menu');
		menuBtn.setAttribute('aria-expanded', 'false');
		
		// Add styles for the button
		menuBtn.style.cssText = `
			position: absolute;
			top: 16px;
			right: 60px;
			background: var(--primary-blue);
			color: white;
			border: none;
			padding: 10px 14px;
			border-radius: 8px;
			cursor: pointer;
			font-size: 18px;
			z-index: 1000;
		`;
		
		// Insert button before nav-links
		navbar.insertBefore(menuBtn, navLinks);
		
		// Hide nav links by default on mobile
		navLinks.style.display = 'none';
		
		// Toggle menu
		menuBtn.addEventListener('click', function() {
			const isOpen = navLinks.style.display === 'flex';
			navLinks.style.display = isOpen ? 'none' : 'flex';
			this.innerHTML = isOpen ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
			this.setAttribute('aria-expanded', String(!isOpen));
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
		window.addEventListener('resize', function() {
			if (window.innerWidth > 768) {
				navLinks.style.display = 'flex';
				menuBtn.style.display = 'none';
			} else {
				navLinks.style.display = 'none';
				menuBtn.style.display = 'block';
			}
		});
	}
	
	// Rest of your existing code below...
	const btn = document.querySelector('.nav-toggle');
	const nav = document.querySelector('.nav');
	if (!btn || !nav) return;

	btn.addEventListener('click', function() {
		const isOpen = nav.classList.toggle('open');
		btn.setAttribute('aria-expanded', String(isOpen));
	});

	// Close nav when clicking outside on small screens
	document.addEventListener('click', function(e){
		if (!nav.classList.contains('open')) return;
		const target = e.target;
		if (target === nav || nav.contains(target) || target === btn) return;
		nav.classList.remove('open');
		btn.setAttribute('aria-expanded','false');
	});

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

		// Auto-dismiss success/info alerts after 5s
		if (alert.classList.contains('alert-success') || alert.classList.contains('alert-info')){
			setTimeout(()=>{
				if (!document.body.contains(alert)) return;
				alert.classList.add('closing');
				setTimeout(()=>alert.remove(), 300);
			}, 5000);
		}
	});
});

// Page transition: intercept internal link clicks and play exit animation
document.addEventListener('DOMContentLoaded', function() {
	const main = document.querySelector('.main-content');
	if (!main) return;

	document.addEventListener('click', function(e){
		const a = e.target.closest('a');
		if (!a) return;
		// skip external links, anchors, mailto/tel, or links with target/_blank
		const href = a.getAttribute('href');
		if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
		if (a.target && a.target !== '' && a.target !== '_self') return;
		// same origin check
		try {
			const url = new URL(href, window.location.href);
			if (url.origin !== window.location.origin) return;
		} catch (err){
			return; // malformed URL
		}

		// allow opt-out using data-no-transition
		if (a.hasAttribute('data-no-transition')) return;

		// only intercept left-clicks without modifier keys
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

		e.preventDefault();
		main.classList.add('page-exit');

		// after the animation ends, navigate
		const onAnimEnd = function(){
			window.location.href = a.href;
		};

		// fallback in case animationend doesn't fire
		setTimeout(onAnimEnd, 350);
	});
});