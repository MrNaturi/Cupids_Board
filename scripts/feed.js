const grid = document.getElementById("masonryGrid");
const likedMemories = JSON.parse(localStorage.getItem("likedMemories")) || [];
const pinnedMemories = JSON.parse(localStorage.getItem("pinnedMemories")) || [];
let currentAudio = null;
let currentButton = null;

async function loadMemories() {
  try {
    const response = await fetch("../notes.json");
    const memories = await response.json();

    memories.forEach(memory => {
      const item = document.createElement("div");
      item.classList.add("masonry-item", memory.rotation);

      item.innerHTML = generateMemoryHTML(memory);

      grid.appendChild(item);
    });

  } catch (error) {
    console.error("Error loading memories:", error);
  }
}

function generateMemoryHTML(memory) {
    const isLiked = likedMemories.includes(memory.id);
    const isPinned = pinnedMemories.includes(memory.id);

  const actionButtons = `
    <div class="memory-actions">
      <button class="like-btn ${isLiked ? "liked" : ""}" 
              data-id="${memory.id}">
        <span class="material-icons">
          ${isLiked ? "favorite" : "favorite_border"}
        </span>
      </button>

      <button class="pin-btn ${isPinned ? "pinned" : ""}" 
              data-id="${memory.id}">
        <span class="material-icons">
          ${isPinned ? "push_pin" : "push_pin"}
        </span>
      </button>
    </div>
  `;

  switch (memory.type) {

    case "polaroid":
      return `
        <div class="polaroid-card">
          <div class="washi-tape"></div>
          <img src="${memory.image}" class="polaroid-image" />
          <p class="handwriting text-center">${memory.caption}</p>
          <span class="polaroid-date">${memory.date}</span>
                   ${actionButtons}
        </div>
      `;

    case "postit":
      return `
        <div class="postit-card">
          <h3 class="marker-title">${memory.title || ""}</h3>
          <p class="handwriting">${memory.content}</p>
        ${actionButtons}
        </div>
      `;

    case "cassette":
      return `
        <div class="cassette-card">
          <div class="cassette-body">
            <button class="play-button" data-audio="${memory.audioSrc}">
              <span class="material-icons">play_arrow</span>
            </button>
          </div>
          <div class="cassette-footer">
            <span class="marker-small">${memory.fileName}</span>
            <span class="duration">${memory.duration}</span>
          </div>
            ${actionButtons}
        </div>
      `;

    default:
      return "";
  }
}

document.addEventListener("click", function (e) {

  // LIKE
  if (e.target.closest(".like-btn")) {
    const btn = e.target.closest(".like-btn");
    const id = btn.dataset.id;

    if (likedMemories.includes(id)) {
      const index = likedMemories.indexOf(id);
      likedMemories.splice(index, 1);
    } else {
      likedMemories.push(id);
    }

    localStorage.setItem("likedMemories", JSON.stringify(likedMemories));
    grid.innerHTML = "";
    loadMemories();
  }

  // PIN
  if (e.target.closest(".pin-btn")) {
    const btn = e.target.closest(".pin-btn");
    const id = btn.dataset.id;

    if (pinnedMemories.includes(id)) {
      const index = pinnedMemories.indexOf(id);
      pinnedMemories.splice(index, 1);
    } else {
      pinnedMemories.push(id);
    }

    localStorage.setItem("pinnedMemories", JSON.stringify(pinnedMemories));
    grid.innerHTML = "";
    loadMemories();
  }

});
document.addEventListener("click", function (e) {
  const button = e.target.closest(".play-button");
  if (!button) return;

  const audioSrc = button.dataset.audio;
  console.log(audioSrc);
  // If clicking the same button → toggle
  if (currentButton === button && currentAudio) {
    if (currentAudio.paused) {
      currentAudio.play();
      button.querySelector(".material-icons").textContent = "pause";
    } else {
      currentAudio.pause();
      button.querySelector(".material-icons").textContent = "play_arrow";
    }
    return;
  }

  // If another audio is playing → stop it
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    if (currentButton) {
      currentButton.querySelector(".material-icons").textContent = "play_arrow";
    }
  }

  // Create new audio
  currentAudio = new Audio(audioSrc);
  currentButton = button;

  currentAudio.play();
  button.querySelector(".material-icons").textContent = "pause";

  // Reset icon when finished
  currentAudio.addEventListener("ended", () => {
    button.querySelector(".material-icons").textContent = "play_arrow";
  });
});

loadMemories();