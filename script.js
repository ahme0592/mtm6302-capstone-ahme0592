const API_KEY = "CznzFM5gaehb5jXUgbjMkqTvzJ1GVsDR83gXY3Gc";
const API_URL = "https://api.nasa.gov/planetary/apod";

const form = document.getElementById("apod-form");
const dateInput = document.getElementById("date-input");
const formError = document.getElementById("form-error");
const loadingEl = document.getElementById("loading");
const resultContent = document.getElementById("result-content");
const favouritesList = document.getElementById("favourites-list");

const modal = document.getElementById("hd-modal");
const modalImg = document.getElementById("hd-image");
const modalCaption = document.getElementById("hd-caption");
const closeModalBtn = document.querySelector(".close-modal");

let currentApod = null;


document.addEventListener("DOMContentLoaded", () => {
  setMaxDate();
  loadFavourites();
  setupScrollAnimations();
});


function setMaxDate() {
  const today = new Date().toISOString().split("T")[0];
  dateInput.max = today;
}

function isFutureDate(value) {
  const today = new Date().toISOString().split("T")[0];
  return value > today;
}


form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";

  const date = dateInput.value;

  if (!date) {
    formError.textContent = "Please select a date.";
    return;
  }

  if (isFutureDate(date)) {
    formError.textContent = "Please choose a date that is not in the future.";
    return;
  }

  await fetchApod(date);
});

// ---- Fetch APOD ----
async function fetchApod(date) {
  loadingEl.hidden = false;
  resultContent.innerHTML = "";
  currentApod = null;

  try {
    const url = `${API_URL}?api_key=${API_KEY}&date=${date}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.media_type !== "image") {
      renderNonImageMessage(data);
      return;
    }

    currentApod = data;
    renderApod(data);
  } catch (error) {
    console.error(error);
    resultContent.innerHTML =
      '<p class="error-message">Sorry, something went wrong while fetching the APOD. Please try again.</p>';
  } finally {
    loadingEl.hidden = true;
  }
}


function renderApod(data) {
  const isFav = isFavourite(data.date);

  const wrapper = document.createElement("div");
  wrapper.className = "apod-layout";

  wrapper.innerHTML = `
    <div class="apod-image-wrapper">
      <span class="apod-tag">Click image for HD</span>
      <img
        src="${data.url}"
        alt="${data.title} - Astronomy Picture of the Day for ${data.date}"
        data-hd="${data.hdurl || data.url}"
        id="apod-image"
      >
    </div>
    <div class="apod-meta">
      <div class="apod-title-date">
        <div class="apod-title">${data.title}</div>
        <div class="apod-date">${data.date}</div>
      </div>
      <p class="apod-explanation">${data.explanation}</p>
      <div class="apod-actions">
        <button type="button" class="btn secondary" id="toggle-hd">
          View HD
        </button>
        <button type="button" class="btn ${isFav ? "danger" : ""}" id="fav-btn">
          ${isFav ? "Remove from Favourites" : "Add to Favourites"}
        </button>
      </div>
    </div>
  `;

  resultContent.innerHTML = "";
  resultContent.appendChild(wrapper);

  
  const apodImg = wrapper.querySelector("#apod-image");
  apodImg.addEventListener("click", () => openHdModal(data));

  
  const toggleHdBtn = wrapper.querySelector("#toggle-hd");
  toggleHdBtn.addEventListener("click", () => openHdModal(data));

  
  const favBtn = wrapper.querySelector("#fav-btn");
  favBtn.addEventListener("click", () => {
    if (!currentApod) return;

    if (isFavourite(currentApod.date)) {
      removeFavourite(currentApod.date);
    } else {
      addFavourite(currentApod);
    }
    renderApod(currentApod); 
    loadFavourites(); // refresh list
  });
}

function renderNonImageMessage(data) {
  resultContent.innerHTML = `
    <p class="error-message">
      The APOD for ${data.date} is a video. This assignment only requires handling images.
      Please try a different date.
    </p>
  `;
}


function getFavourites() {
  const raw = localStorage.getItem("apodFavourites");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveFavourites(list) {
  localStorage.setItem("apodFavourites", JSON.stringify(list));
}

function isFavourite(date) {
  const list = getFavourites();
  return list.some((item) => item.date === date);
}

function addFavourite(apod) {
  const list = getFavourites();
  if (!list.some((item) => item.date === apod.date)) {
    list.push({
      date: apod.date,
      title: apod.title,
      url: apod.url,
      hdurl: apod.hdurl || apod.url,
      explanation: apod.explanation,
    });
    saveFavourites(list);
  }
}

function removeFavourite(date) {
  const list = getFavourites().filter((item) => item.date !== date);
  saveFavourites(list);
}

function loadFavourites() {
  const list = getFavourites();
  favouritesList.innerHTML = "";

  if (!list.length) {
    favouritesList.innerHTML =
      '<p class="placeholder">No favourites yet. Search for an APOD and add it to your favourites.</p>';
    return;
  }

  list
    .sort((a, b) => (a.date < b.date ? 1 : -1)) 
    .forEach((item) => {
      const card = document.createElement("article");
      card.className = "favourite-card";

      card.innerHTML = `
        <button class="favourite-thumb" type="button" aria-label="View APOD for ${item.date}">
          <img src="${item.url}" alt="${item.title} thumbnail">
        </button>
        <div class="favourite-info">
          <div class="favourite-title">${item.title}</div>
          <div class="favourite-date">${item.date}</div>
          <div class="favourite-actions">
            <button type="button" class="btn secondary btn-view" data-date="${item.date}">
              View
            </button>
            <button type="button" class="btn danger btn-remove" data-date="${item.date}">
              Remove
            </button>
          </div>
        </div>
      `;

      // View when clicking thumb or "View" button
      const thumbBtn = card.querySelector(".favourite-thumb");
      const viewBtn = card.querySelector(".btn-view");
      const removeBtn = card.querySelector(".btn-remove");

      thumbBtn.addEventListener("click", () => renderFavouriteAsCurrent(item));
      viewBtn.addEventListener("click", () => renderFavouriteAsCurrent(item));
      removeBtn.addEventListener("click", () => {
        removeFavourite(item.date);
        loadFavourites();
        if (currentApod && currentApod.date === item.date) {
          renderApod({ ...currentApod }); // refresh fav state
        }
      });

      favouritesList.appendChild(card);
    });
}

function renderFavouriteAsCurrent(item) {
  currentApod = {
    date: item.date,
    title: item.title,
    url: item.url,
    hdurl: item.hdurl,
    explanation: item.explanation,
    media_type: "image",
  };
  renderApod(currentApod);
  // also set form input to this date
  dateInput.value = item.date;
}

function openHdModal(data) {
  modalImg.src = data.hdurl || data.url;
  modalImg.alt = `${data.title} - High Definition`;
  modalCaption.textContent = `${data.title} — ${data.date}`;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeHdModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  modalImg.src = "";
  modalCaption.textContent = "";
}

closeModalBtn.addEventListener("click", closeHdModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeHdModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("active")) {
    closeHdModal();
  }
});


function setupScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  document.querySelectorAll(".card").forEach((card) => {
    card.classList.add("fade-in");
    observer.observe(card);
  });
}

const toggleBtn = document.getElementById("theme-toggle");


if (localStorage.getItem("theme") === "light") {
  document.documentElement.classList.add("light");
  toggleBtn.textContent = "☀️";
}


toggleBtn.addEventListener("click", () => {
  const isLight = document.documentElement.classList.toggle("light");

  toggleBtn.textContent = isLight ? "☀️" : "🌙";

  localStorage.setItem("theme", isLight ? "light" : "dark");
});

