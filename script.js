const navLinks = document.querySelectorAll(".nav-menu .nav-link");
const menuOpenButton = document.querySelector("#menu-open-button");
const menuCloseButton = document.querySelector("#menu-close-button");

menuOpenButton.addEventListener("click", () => {
    // Toggle mobile menu visibility
    document.body.classList.toggle("show-mobile-menu");
});

// Close mobile menu when a nav link is clicked
menuCloseButton.addEventListener("click", () => menuOpenButton.click());
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        if (document.body.classList.contains("show-mobile-menu")) {
            menuOpenButton.click();
        }
    });
});

// Countdown Timer for Event
const countdown = document.getElementById("countdown");

const eventDate = new Date("March 25, 2026 18:00:00").getTime();

setInterval(() => {
    const now = new Date().getTime();
    const distance = eventDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    countdown.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    if (distance < 0) {
        countdown.innerHTML = "Event Started!";
    }
}, 1000);

// POPUP FUNCTION
const popup = document.getElementById("booking-popup");
const openButtons = document.querySelectorAll(".open-popup");
const closeBtn = document.querySelector(".close-btn");

openButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    popup.style.display = "flex";
  });
});




closeBtn.addEventListener("click", () => {
  popup.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.style.display = "none";
  }
});

window.addEventListener("scroll", reveal);

function reveal() {
  let reveals = document.querySelectorAll(".reveal");

  for (let i = 0; i < reveals.length; i++) {

    let windowHeight = window.innerHeight;
    let elementTop = reveals[i].getBoundingClientRect().top;
    let elementVisible = 120;

    if (elementTop < windowHeight - elementVisible) {
      reveals[i].classList.add("active");
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {

  const textarea = document.querySelector(".contact-form textarea");

  textarea.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

});

// CONNECT FORM TO BACKEND
const form = document.querySelector(".contact-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Contact form only
  const data = {
  name: form.querySelector('input[name="name"]').value,
  email: form.querySelector('input[name="email"]').value,
  message: form.querySelector('textarea[name="message"]').value,
  type: "contact"
};

// BOOKING FORM → SEND TO BACKEND
const bookingForm = document.getElementById("booking-form");

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  console.log("Submitting booking...");

  const inputs = bookingForm.querySelectorAll("input, textarea");

  const data = {
    name: inputs[0].value,
    email: inputs[1].value,
    message: inputs[3].value || inputs[2].value,
    type: "booking"
  };

  try {
    const res = await fetch("http://localhost:5000/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    alert(result.message);

    bookingForm.reset();
    popup.style.display = "none";

  } catch (error) {
    alert("Failed to send booking");
  }
});

  try {
    const res = await fetch("http://localhost:5000/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    alert(result.message);

    form.reset(); // clears form after submit
  } catch (error) {
    alert("Something went wrong!");
  }
});

document.addEventListener("DOMContentLoaded", () => {

  const bookingForm = document.getElementById("booking-form");

  if (!bookingForm) {
    console.log("Booking form not found");
    return;
  }

  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("Submitting booking..."); 

    const name = bookingForm.querySelector('input[placeholder="Your Name"]').value;
    const email = bookingForm.querySelector('input[placeholder="Your Email"]').value;
    const message = bookingForm.querySelector('textarea').value;

    const data = {
      name,
      email,
      message,
      type: "booking"
    };

    console.log("DATA:", data); 

    try {
      const res = await fetch("http://localhost:5000/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      console.log("SERVER RESPONSE:", result);

      alert(result.message);

      bookingForm.reset();
      document.getElementById("booking-popup").style.display = "none";

    } catch (error) {
      console.error("FETCH ERROR:", error);
      alert("Failed to send booking");
    }

  });

});

// NEWSLETTER SUBSCRIBE
const newsletterForm = document.querySelector(".newsletter-form");

newsletterForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = newsletterForm.querySelector("input[name='email']").value;

  try {
    const res = await fetch("http://localhost:5000/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    alert(data.message);

    newsletterForm.reset();

  } catch (error) {
    alert("Subscription failed!");
  }
});


