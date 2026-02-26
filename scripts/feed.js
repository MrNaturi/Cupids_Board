const grid = document.getElementById("masonryGrid");

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
  switch (memory.type) {

    case "polaroid":
      return `
        <div class="polaroid-card">
          <div class="washi-tape"></div>
          <img src="${memory.image}" class="polaroid-image" />
          <p class="handwriting text-center">${memory.caption}</p>
          <span class="polaroid-date">${memory.date}</span>
        </div>
      `;

    case "postit":
      return `
        <div class="postit-card">
          <h3 class="marker-title">${memory.title || ""}</h3>
          <p class="handwriting">${memory.content}</p>
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
        </div>
      `;

    default:
      return "";
  }
}

loadMemories();