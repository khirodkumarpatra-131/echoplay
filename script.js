// 🔹 Global variables
let songs = [];
let currentsong = new Audio();
let currfolder;
let currentIndex = 0;
let blinkInterval;
let isPlaylistOpen = false; // track toggle state for home button

// 🔹 Convert seconds to mm:ss
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// 🔹 Get songs from folder
async function getSongs(folder) {
    try {
        let res = await fetch(`songs/${folder}/info.json`);
        if (!res.ok) return [];
        let data = await res.json();
        currfolder = folder;
        return data.songs || [];
    } catch (err) { console.error(err); return []; }
}

// 🔹 Play track
function playmusic(track) {
    if (!track) return;
    currentIndex = songs.findIndex(s => decodeURI(s) === decodeURI(track));
    currentsong.src = `songs/${currfolder}/${track}`;
    currentsong.play();
    document.getElementById("play").src = "assets/pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    stopBlink();
    const songul = document.querySelector(".songlist ul");
    const li = songul.children[currentIndex];
    if (li) {
        li.classList.add("blink");
        blinkInterval = setTimeout(() => li.classList.remove("blink"), 2000);
    }
}

// Stop blinking
function stopBlink() {
    clearTimeout(blinkInterval);
    Array.from(document.querySelectorAll(".songlist ul li")).forEach(li => li.classList.remove("blink"));
}

// 🔹 Show userbox
function showUserBox(username) {
    const userBox = document.querySelector(".userbox");
    document.querySelector(".loginbtn").style.display = "none";
    document.querySelector(".signupbtn").style.display = "none";
    userBox.style.display = "flex";
    userBox.innerHTML = `<span>Welcome, ${username}</span><button class="logoutbtn">Logout</button>`;
    document.querySelector(".logoutbtn").addEventListener("click", () => {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
}

// 🔹 Hamburger
function setupHamburger() {
    const hamburger = document.querySelector(".hamburger");
    const leftPanel = document.querySelector(".left");
    const closeBtn = document.querySelector(".left .close");
    hamburger.addEventListener("click", () => { leftPanel.style.left = "0px"; });
    closeBtn.addEventListener("click", () => { leftPanel.style.left = "-120%"; });
}

// 🔹 Display albums
async function displayAlbums() {
    const container = document.querySelector(".cardcontainer");
    container.innerHTML = "";
    const folders = ["a", "arjit", "arman", "badshah", "guru", "honey", "kailash", "shreya", "sidhu", "sonu", "sonunigam", "tony"];
    for (let folder of folders) {
        try {
            let res = await fetch(`songs/${folder}/info.json`);
            if (!res.ok) continue;
            let info = await res.json();
            container.innerHTML += `
            <div class="card" data-folder="${folder}">
                <img src="songs/${folder}/${info.thumbnail}" alt="${info.title}">
                <h3>${info.title}</h3>
                <p>${info.description}</p>
            </div>`;
        } catch (err) { console.error(err); }
    }
}

// 🔹 Render song list
function renderSongList(list) {
    const songul = document.querySelector(".songlist ul");
    songul.innerHTML = "";
    list.forEach((song, i) => {
        songul.innerHTML += `<li>
            <img class="invert" src="assets/music.svg" alt="">
            <div class="info"><div>${decodeURI(song)}</div><div>Artist</div></div>
            <div class="playnow"><span>Play Now</span><img src="assets/playnow.svg" style="width:30px;" class="invert" alt=""></div>
        </li>`;
    });
    Array.from(songul.getElementsByTagName("li")).forEach((e, i) => e.addEventListener("click", () => playmusic(list[i])));
}

// 🔹 Main
async function main() {
    if (localStorage.getItem("loggedIn") !== "true") { window.location.href = "login.html"; return; }
    setupHamburger();
    await displayAlbums();
    const user = localStorage.getItem("user");
    if (user) showUserBox(user);

    // Load default folder
    songs = await getSongs("ncs");
    renderSongList(songs);

    // Play first song
    playmusic(songs[0]);

    // Play/Pause button
    document.getElementById("play").addEventListener("click", () => {
        if (currentsong.paused) { currentsong.play(); document.getElementById("play").src = "assets/pause.svg"; }
        else { currentsong.pause(); document.getElementById("play").src = "assets/play.svg"; }
    });

    // Time update
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.getBoundingClientRect().width;
        currentsong.currentTime = currentsong.duration * percent;
        document.querySelector(".circle").style.left = (percent * 100) + "%";
    });

    // Prev/Next
    document.getElementById("previous").addEventListener("click", () => { if (currentIndex > 0) playmusic(songs[currentIndex - 1]); });
    document.getElementById("next").addEventListener("click", () => { if (currentIndex < songs.length - 1) playmusic(songs[currentIndex + 1]); });

    // Auto play next
    currentsong.addEventListener("ended", () => { if (currentIndex < songs.length - 1) playmusic(songs[currentIndex + 1]); });

    // Volume
    document.querySelector(".range input").addEventListener("input", e => { currentsong.volume = parseInt(e.target.value) / 100; });

    // Card click
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async e => {
            let folder = card.dataset.folder;
            let res = await fetch(`songs/${folder}/info.json`);
            let albumInfo = await res.json();
            songs = albumInfo.songs || [];
            currfolder = folder;
            renderSongList(songs);
            playmusic(songs[0]);
            isPlaylistOpen = true; // mark as open
        });
    });

    // Signup/Login
    document.querySelector(".signupbtn").addEventListener("click", () => window.location.href = "signup.html");
    document.querySelector(".loginbtn").addEventListener("click", () => window.location.href = "login.html");

    // 🔹 Search functionality
    const searchIcon = document.getElementById("searchIcon");
    const searchContainer = document.getElementById("searchContainer");
    const searchInput = document.getElementById("searchInput");
    const searchGo = document.getElementById("searchGo");

    searchIcon.addEventListener("click", () => {
        searchContainer.classList.toggle("active");
        searchInput.value = "";
        renderSongList(songs); // Reset to all songs
    });

    searchGo.addEventListener("click", () => {
        const query = searchInput.value.toLowerCase();
        if (!query) { renderSongList(songs); return; }
        const filtered = songs.filter(s => decodeURI(s).toLowerCase().includes(query));
        renderSongList(filtered);
    });

    // 🔹 Home button toggle logic
    const homeBtn = document.getElementById("homeBtn");
    homeBtn.addEventListener("click", () => {
        if (isPlaylistOpen) {
            // Stop any song playing
            currentsong.pause();
            currentsong.currentTime = 0;
            // Close playlist
            document.querySelector(".songlist ul").innerHTML = "";
            isPlaylistOpen = false;
        } else {
            // Open default/home songs
            getSongs("ncs").then(defaultSongs => {
                songs = defaultSongs;
                renderSongList(songs);
                playmusic(songs[0]);
                isPlaylistOpen = true;
            });
        }
    });
}

// Run main
document.addEventListener("DOMContentLoaded", main);
