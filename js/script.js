// Portfolio website interactions

document.addEventListener('DOMContentLoaded', () => {
    setupMobileNavigation();
    setupSmoothScrolling();
    setupProjectFilters();
    setupContactFormValidation();
});

function setupMobileNavigation() {
    const nav = document.getElementById('nav');
    const menuToggle = document.querySelector('.nav-toggle');

    if (!nav || !menuToggle) {
        return;
    }

    menuToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
        const clickTarget = event.target;

        if (!(clickTarget instanceof Element)) {
            return;
        }

        const clickedInsideNav = nav.contains(clickTarget);
        const clickedToggle = menuToggle.contains(clickTarget);

        if (!clickedInsideNav && !clickedToggle && nav.classList.contains('active')) {
            nav.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

function setupSmoothScrolling() {
    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');

            if (!targetId || targetId === '#') {
                return;
            }

            const targetElement = document.querySelector(targetId);

            if (!targetElement) {
                return;
            }

            event.preventDefault();
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

            const nav = document.getElementById('nav');
            const menuToggle = document.querySelector('.nav-toggle');
            if (nav) {
                nav.classList.remove('active');
            }
            if (menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
}

function setupProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-button');
    const projects = document.querySelectorAll('.project');

    if (!filterButtons.length || !projects.length) {
        return;
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selectedCategory = button.dataset.category;

            filterButtons.forEach((filterButton) => {
                filterButton.classList.remove('active');
                filterButton.setAttribute('aria-pressed', 'false');
            });

            button.classList.add('active');
            button.setAttribute('aria-pressed', 'true');

            projects.forEach((project) => {
                const shouldShow = selectedCategory === 'all' || project.classList.contains(selectedCategory);
                project.hidden = !shouldShow;
            });
        });
    });
}

function setupContactFormValidation() {
    const contactForm = document.getElementById('contact-form');
    const contactStatus = document.getElementById('contact-status');
    const submitButton = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
    const formStartTime = Date.now();

    if (!contactForm) {
        return;
    }

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = {
            name: getInputValue('name'),
            email: getInputValue('email'),
            subject: getInputValue('subject'),
            message: getInputValue('message'),
            website: getInputValue('website'),
            formDurationMs: Date.now() - formStartTime,
        };

        const errors = validateContactForm(formData);

        if (errors.length) {
            if (contactStatus) {
                contactStatus.textContent = errors.join(' ');
            }
            return;
        }

        if (contactStatus) {
            contactStatus.textContent = 'Sending your message...';
        }
        if (submitButton instanceof HTMLButtonElement) {
            submitButton.disabled = true;
        }

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                const errorMessage =
                    errorBody?.message ||
                    errorBody?.detail ||
                    errorBody?.title ||
                    'Unable to send message right now.';
                throw new Error(errorMessage);
            }

            contactForm.reset();
            if (contactStatus) {
                contactStatus.textContent = 'Thanks, your message was sent successfully.';
            }
        } catch (error) {
            if (contactStatus) {
                contactStatus.textContent = error instanceof Error
                    ? error.message
                    : 'Unable to send message right now.';
            }
        } finally {
            if (submitButton instanceof HTMLButtonElement) {
                submitButton.disabled = false;
            }
        }
    });
}

function getInputValue(inputId) {
    const input = document.getElementById(inputId);
    return input ? input.value.trim() : '';
}

function validateContactForm({ name, email, subject, message, website, formDurationMs }) {
    const errors = [];

    if (!name) {
        errors.push('Please enter your name.');
    }

    if (!isValidEmail(email)) {
        errors.push('Please enter a valid email address.');
    }

    if (!subject) {
        errors.push('Please enter a subject.');
    }

    if (!message) {
        errors.push('Please enter your message.');
    }

    if (website) {
        errors.push('Submission rejected.');
    }

    if (!Number.isFinite(formDurationMs) || formDurationMs < 1000) {
        errors.push('Please take a moment before sending.');
    }

    return errors;
}

function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email.toLowerCase());
}
