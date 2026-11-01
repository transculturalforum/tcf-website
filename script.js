document.addEventListener('DOMContentLoaded', () => {
    // Safely check if the landing page donate button exists before adding the event listener
    const donateButton = document.getElementById('donate-btn');
    if (donateButton) {
        donateButton.addEventListener('click', () => {
            window.location.href = 'donate.html';
        });
    }

    // Interactive tab switching for the donate.html page
    const tabButtons = document.querySelectorAll('.payment-tab-btn');
    const tabContents = document.querySelectorAll('.payment-content');

    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Remove active classes from all buttons and content panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to the clicked button and matching content pane
                button.classList.add('active');
                const activeContent = document.getElementById(targetTab);
                if (activeContent) {
                    activeContent.classList.add('active');
                }
            });
        });
    }

    // Contact Form Submission Handler
    const form = document.getElementById("tcf-contact-form");
    const statusMessage = document.getElementById("form-status");

    if (form) {
        form.addEventListener("submit", async function(event) {
            event.preventDefault(); // Prevents the default Formspree redirect page
            
            const data = new FormData(event.target);
            
            fetch(event.target.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    // Show the success message and clear the form
                    statusMessage.style.display = "block";
                    statusMessage.style.color = "#3C6B5F"; // Matches your Transcultural Forum green
                    statusMessage.innerHTML = "Your message has been submitted.";
                    form.reset();
                } else {
                    // In case of an error
                    statusMessage.style.display = "block";
                    statusMessage.style.color = "red";
                    statusMessage.innerHTML = "Oops! There was a problem submitting your form.";
                }
            }).catch(error => {
                statusMessage.style.display = "block";
                statusMessage.style.color = "red";
                statusMessage.innerHTML = "Oops! There was a problem submitting your form.";
            });
        });
    }

    // --- Mobile Hamburger Menu Logic ---
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            // Toggles the menu sliding in and out
            navLinks.classList.toggle('active');
            
            // Optional: Changes the icon to an "X" when open, and back to "☰" when closed
            if (navLinks.classList.contains('active')) {
                hamburger.innerHTML = '&#10005;'; // The "X" symbol
            } else {
                hamburger.innerHTML = '&#9776;'; // The "☰" symbol
            }
        });
    }

    // --- Tablet sub-menus: the first tap on "What We Do" or "Religions" opens the list, ---
    // --- a second tap follows the link. Phones keep the menu button above. ---
    const tabletQuery = window.matchMedia('(min-width: 769px) and (max-width: 1366px), (hover: none) and (min-width: 769px)');
    const dropdownTabs = document.querySelectorAll('.dropdown-tab');

    dropdownTabs.forEach(tab => {
        const trigger = tab.querySelector('.dropdown-trigger');
        if (!trigger) return;
        trigger.addEventListener('click', event => {
            if (!tabletQuery.matches) return;
            if (!tab.classList.contains('open') || trigger.getAttribute('href') === '#') {
                event.preventDefault();
                dropdownTabs.forEach(other => { if (other !== tab) other.classList.remove('open'); });
                tab.classList.toggle('open');
            }
        });
    });

    // Tapping anywhere else closes an open sub-menu
    document.addEventListener('click', event => {
        if (!event.target.closest('.dropdown-tab')) {
            dropdownTabs.forEach(tab => tab.classList.remove('open'));
        }
    });
});