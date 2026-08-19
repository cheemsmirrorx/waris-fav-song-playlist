const trackList = [
  {
    title: "Track 1 - Mera Yaar Miladay (From  Biryani )",
    artist: "Rahat Fateh Ali Khan",
    cover: "media/covers/IMG_20260117_191034_527.jpg",
    src: "media/songs/Rahat Fateh Ali Khan - Mera Yaar Miladay (From  Biryani ).mp3"
  },
  {
    title: "Track 2 - Dil To Bachcha Hai",
    artist: "Rahat Fateh Ali Khan",
    cover: "media/covers/IMG_20260819_233753_268.jpg",
    src: "media/songs/Rahat Fateh Ali Khan - Dil To Bachcha Hai.mp3"
  },
{
    title: "Track 3 - Khaani - (Orginal Soundtrack)",
    artist: "Rahat Fateh Ali Khan",
    cover: "media/covers/ab67616d0000b273db324126b3df547d8269a426.jpeg",
    src: "media/songs/Rahat Fateh Ali Khan - Khaani OST.mp3"
  }
];

let currentTrackIndex = 0;
let isPlaying = false;

const audio = document.getElementById("audio-engine");
const playBtn = document.getElementById("play-btn");
const stopBtn = document.getElementById("stop-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const seekBar = document.getElementById("seek-bar");
const volumeSlider = document.getElementById("volume-slider");
const currentTimeEl = document.getElementById("current-time");
const totalDurationEl = document.getElementById("total-duration");
const trackStatus = document.getElementById("track-status");
const coverArt = document.getElementById("cover-art");
const equalizer = document.getElementById("equalizer");
const playlistContainer = document.getElementById("playlist-items");

function renderPlaylist() {
  playlistContainer.innerHTML = "";
  trackList.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${track.title}`;
    if (index === currentTrackIndex) li.classList.add("playing");
    li.addEventListener("click", () => {
      loadTrack(index);
      playAudio();
    });
    playlistContainer.appendChild(li);
  });
}

function loadTrack(index) {
  currentTrackIndex = index;
  const track = trackList[index];
  audio.src = track.src;
  coverArt.src = track.cover;
  trackStatus.textContent = `Playing: ${track.title}`;
  renderPlaylist();
}

function playAudio() {
  audio.play();
  isPlaying = true;
  playBtn.textContent = "⏸";
  equalizer.classList.add("active");
}

function pauseAudio() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = "▶";
  equalizer.classList.remove("active");
}

function togglePlay() {
  if (isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function stopAudio() {
  pauseAudio();
  audio.currentTime = 0;
  trackStatus.textContent = "Stopped";
}

function nextTrack() {
  currentTrackIndex = (currentTrackIndex + 1) % trackList.length;
  loadTrack(currentTrackIndex);
  playAudio();
}

function prevTrack() {
  currentTrackIndex = (currentTrackIndex - 1 + trackList.length) % trackList.length;
  loadTrack(currentTrackIndex);
  playAudio();
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60) || 0;
  const sec = Math.floor(seconds % 60) || 0;
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

audio.addEventListener("loadedmetadata", () => {
  seekBar.max = Math.floor(audio.duration);
  totalDurationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  seekBar.value = Math.floor(audio.currentTime);
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener("ended", nextTrack);

seekBar.addEventListener("input", () => {
  audio.currentTime = seekBar.value;
});

volumeSlider.addEventListener("input", (e) => {
  audio.volume = e.target.value;
});

playBtn.addEventListener("click", togglePlay);
stopBtn.addEventListener("click", stopAudio);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);

// Initial Load
loadTrack(0);
