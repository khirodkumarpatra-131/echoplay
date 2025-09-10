// 🔹 Global variables
let songs = [];
let currentsong = new Audio();
let currfolder;

// 🔹 Convert seconds to mm:ss
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return String(minutes).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

// 🔹 Get songs from info.json of a folder
async function getSongs(folder) {
    try {
        let res = await fetch(`songs/${folder}/info.json`);
        if (!res.ok) {
            console.warn("info.json not found in folder", folder);
            return [];
        }
        let data = await res.json();
        currfolder = folder;
        return data.songs || [];
    } catch (err) {
        console.error("Error loading songs from folder", folder, err);
        return [];
    }
}

// 🔹 Play a track
function playmusic(track, pause = false) {
    if (!track) return;
    currentsong.src = `songs/${currfolder}/${track}`;
    if (!pause) {
        currentsong.play();
        document.getElementById("play").src = "assets/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// 🔹 Display albums (cards)
async function displayAlbums() {
    const container = document.querySelector(".cardcontainer");
    container.innerHTML = "";

    const folders = ["arjit","arman","badshah","guru","honey","kailash","shreya","sidhu","sonu","sonunigam","tony"];
    for (let folder of folders) {
        try {
            let albumRes = await fetch(`songs/${folder}/info.json`);
            if (!albumRes.ok) continue;
            let info = await albumRes.json();
            container.innerHTML += `
                <div class="card" data-folder="${folder}">
                    <img src="songs/${folder}/${info.thumbnail}" alt="${info.title}">
                    <h3>${info.title}</h3>
                    <p>${info.description}</p>
                </div>`;
        } catch (err) {
            console.error("Error loading album", folder, err);
        }
    }
}

// 🔹 Hamburger toggle
function setupHamburger() {
    const hamburger = document.querySelector(".hamburger");
    const leftPanel = document.querySelector(".left");
    const closeBtn = document.querySelector(".left .close");

    hamburger.addEventListener("click", () => {
        leftPanel.style.left = "0px";
    });

    closeBtn.addEventListener("click", () => {
        leftPanel.style.left = "-120%";
    });
}

// 🔹 Main function
async function main() {
    setupHamburger();
    await displayAlbums();

    // Load default folder songs
    songs = await getSongs("ncs");
    playmusic(songs[0], true);

    // Show songs in list
    const songul = document.querySelector(".songlist ul");
    songul.innerHTML = "";
    for (const song of songs) {
        songul.innerHTML += `<li>
            <img class="invert" src="assets/music.svg" alt="">
            <div class="info"><div>${song.replaceAll("%20", " ")}</div><div>Artist</div></div>
            <div class="playnow"><span>Play Now</span><img src="assets/playnow.svg" style="width:30px;" class="invert" alt=""></div>
        </li>`;
    }

    // Attach click on each song
    Array.from(songul.getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playmusic(e.querySelector(".info div").innerHTML.trim());
        });
    });

    // Play/Pause button
    document.getElementById("play").addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            document.getElementById("play").src = "assets/pause.svg";
        } else {
            currentsong.pause();
            document.getElementById("play").src = "assets/play.svg";
        }
    });

    // Time update event
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Seekbar click
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.getBoundingClientRect().width;
        currentsong.currentTime = currentsong.duration * percent;
        document.querySelector(".circle").style.left = (percent * 100) + "%";
    });

    // Previous/Next buttons
    document.getElementById("previous").addEventListener("click", () => {
        let index = songs.findIndex(s => decodeURI(s) === decodeURI(currentsong.src.split("/").pop()));
        if (index > 0) playmusic(songs[index - 1]);
    });
    document.getElementById("next").addEventListener("click", () => {
        let index = songs.findIndex(s => decodeURI(s) === decodeURI(currentsong.src.split("/").pop()));
        if (index < songs.length - 1) playmusic(songs[index + 1]);
    });

    // Volume control
    document.querySelector(".range input").addEventListener("input", e => {
        currentsong.volume = parseInt(e.target.value) / 100;
    });

    // Card click to load songs of that album
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async e => {
            let folder = e.currentTarget.dataset.folder;
            songs = await getSongs(folder);
            currfolder = folder;

            // Update song list
            songul.innerHTML = "";
            for (const song of songs) {
                songul.innerHTML += `<li>
                    <img class="invert" src="assets/music.svg" alt="">
                    <div class="info"><div>${song.replaceAll("%20", " ")}</div><div>Artist</div></div>
                    <div class="playnow"><span>Play Now</span><img src="assets/playnow.svg" style="width:30px;" class="invert" alt=""></div>
                </li>`;
            }
            Array.from(songul.getElementsByTagName("li")).forEach(e => {
                e.addEventListener("click", () => playmusic(e.querySelector(".info div").innerHTML.trim()));
            });

            playmusic(songs[0]);
        });
    });

 
}

// 🔹 Run main
document.addEventListener("DOMContentLoaded", main);
