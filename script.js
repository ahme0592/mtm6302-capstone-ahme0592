// Fade-in scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
    });
});

document.querySelectorAll(".fade-in").forEach(el => observer.observe(el));

// Skill modal data (no JSON file needed)
const skills = {
    davinci: {
        title: "DaVinci Resolve",
        image: "images/DaVinci_Resolve_Studio.png",
        description: "Professional editing and color grading software."
    },
    premiere: {
        title: "Premiere Pro",
        image: "images/Adobe_Premiere_Pro_CC_icon.svg.png",
        description: "Adobe’s industry-leading video editing tool."
    },
    aftereffects: {
        title: "After Effects",
        image: "images/Adobe_After_Effects_CC_icon.svg.png",
        description: "Used for motion graphics, VFX, and advanced compositing."
    },
    html: {
        title: "HTML",
        image: "images/html_logo.png",
        description: "The core structure of all webpages."
    },
    css: {
        title: "CSS",
        image: "images/css_logo.png",
        description: "Styles and layouts webpages to make them beautiful."
    }
};

const modal = document.getElementById("skill-modal");
const modalImg = document.getElementById("modal-image");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-description");
const closeBtn = document.querySelector(".close-modal");

// Open modal
document.querySelectorAll(".skill-card").forEach(card => {
    card.addEventListener("click", () => {
        const id = card.dataset.skill;
        const data = skills[id];

        modalImg.src = data.image;
        modalTitle.textContent = data.title;
        modalDesc.textContent = data.description;

        modal.classList.add("active");
    });
});

// Close modal
closeBtn.addEventListener("click", () => modal.classList.remove("active"));
modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
});
