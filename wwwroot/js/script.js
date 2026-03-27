// JavaScript for Portfolio Website

// Step 3: Add Interactivity
// Function to toggle the navigation visibility's menu when the hamburger icon is clicked
function toggleNav() {
    console.log('toggleNav called');
    const nav = document.getElementById('nav');
    console.log('nav element:', nav);
    if (nav) {
        nav.classList.toggle('active');
        console.log('nav classes:', nav.className);
    } else {
        console.log('nav element not found');
    }
}

//Implementing smooth scrolling behaviour for links in the navigation that reference within the same page
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Step 4: Add interactivity to portfolio sections
//A filter feature for the project section that allows users to filter projects by category
document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function () {
        const category = this.getAttribute('data-category');
        document.querySelectorAll('.project').forEach(project => {
            if (category === 'all' || project.classList.contains(category)) {
                project.style.display = 'block';
            } else {
                project.style.display = 'none';
            }
        });
    });
});

// Implement a lightbox effect for project images that display images in a modal view when clicked
document.querySelectorAll('.project-image').forEach(image => {
    image.addEventListener('click', function () {
        const modal = document.createElement('div');
        modal.classList.add('modal');

        const img = document.createElement('img');
        img.src = this.src;
        img.alt = this.alt;

        modal.appendChild(img);
        document.body.appendChild(modal);
        modal.addEventListener('click', function () {
            document.body.removeChild(modal);
        });
    });
});

// Step 5: Add form validation
// An interactive “Contact” form that gives users feedback on their submission. 
// Form validation for the contact form where fields (name, email, message) are filled out correctly before allowing submission
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
      let valid = true;

        if (name === '') {
            alert('Please enter your name.');
            valid = false;
        }
        if (email === '' || !validateEmail(email)) {
            alert('Please enter a valid email address.');
            valid = false;
        }
        if (message === '') {
            alert('Please enter your message.');
            valid = false;
        }

        if (valid) {
            // Here you would typically handle the form submission, e.g., send the data to a server
            alert('Thank you for your message!');
            this.reset(); // Reset the form
        }
    });
}

// Provide real-time feedback using JavaScript to inform users of incorrect or missing input.
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};   

// Step 6: Test and debug
// Test the website across different browsers and devices to ensure compatibility and responsiveness.
// Utilize console logs and debugging tools to identify and fix any issues that arise during testing.
// Use the browser's developer tools to inspect the console for errors.







