const root = document.documentElement;
const year = document.querySelector("#year");
const topButton = document.querySelector("#to-top");
const sections = document.querySelectorAll(".observe");

year.textContent = new Date().getFullYear();

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  }),
  { threshold: 0.16 }
);

sections.forEach((section) => observer.observe(section));

window.addEventListener("pointermove", (event) => {
  root.style.setProperty("--x", `${event.clientX}px`);
  root.style.setProperty("--y", `${event.clientY}px`);
}, { passive: true });

topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
