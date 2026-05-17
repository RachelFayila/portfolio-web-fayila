const root = document.documentElement;
const body = document.body;
const themeToggle = document.querySelector("[data-theme-toggle]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const navLinks = document.querySelector("[data-nav-links]");
const year = document.querySelector("[data-year]");
const contactForm = document.querySelector("[data-contact-form]");
const formMessage = document.querySelector("[data-form-message]");

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark" || !savedTheme) {
  root.classList.add("dark");
}

function updateThemeIcon() {
  if (!themeToggle) return;
  const icon = themeToggle.querySelector("i");
  const isDark = root.classList.contains("dark");
  icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
  themeToggle.setAttribute("aria-label", isDark ? "Activer le mode clair" : "Activer le mode sombre");
}

updateThemeIcon();

themeToggle?.addEventListener("click", () => {
  root.classList.toggle("dark");
  localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
  updateThemeIcon();
});

menuToggle?.addEventListener("click", () => {
  const isHidden = navLinks?.classList.toggle("hidden");
  menuToggle.setAttribute("aria-expanded", String(!isHidden));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.add("hidden");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

if (year) {
  year.textContent = new Date().getFullYear();
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.remove("opacity-0", "translate-y-4");
        entry.target.classList.add("opacity-100", "translate-y-0");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll("[data-reveal]").forEach((item) => {
  item.classList.add("opacity-0", "translate-y-4", "transition", "duration-700", "ease-out");
  observer.observe(item);
});

function encodeFormData(form) {
  return new URLSearchParams(new FormData(form)).toString();
}

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }

  const submitButton = contactForm.querySelector("button[type='submit']");
  const defaultText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Envoi...";

  try {
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormData(contactForm),
    });

    contactForm.reset();
    formMessage.className = "mt-4 rounded-2xl bg-green-100 px-4 py-3 font-bold text-green-900";
    formMessage.textContent = "Message envoyé. Merci, je vous répondrai directement par email.";
  } catch (error) {
    formMessage.className = "mt-4 rounded-2xl bg-red-100 px-4 py-3 font-bold text-red-900";
    formMessage.textContent = "Le message n'a pas pu être envoyé. Vous pouvez utiliser l'email direct.";
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = defaultText;
  }
});
