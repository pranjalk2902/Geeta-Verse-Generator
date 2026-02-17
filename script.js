// JavaScript Logic (script.js)

// ---------------------------------------------------------
// 0. DATA SOURCE
// ---------------------------------------------------------


let CHAPTER_VERSE_TO_SHLOKA = {};

async function loadVerses() {
    const response = await fetch("verses.json");
    // console.log("Loading verses from JSON...");
    CHAPTER_VERSE_TO_SHLOKA = await response.json();
}

loadVerses();

// ---------------------------------------------------------
// 1. CONFIGURATION
// ---------------------------------------------------------

const CHAPTER_VERSES = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
    7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
    13: 34, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78
};
const MAX_CHAPTER = 18;

// ---------------------------------------------------------
// 2. DOM ELEMENTS
// ---------------------------------------------------------
const generateVerseBtn = document.getElementById('generateVerseBtn');
const resetRoundBtn = document.getElementById('resetRoundBtn');
const generatedVerseDisplay = document.getElementById('generatedVerseDisplay');
const roundEndDisplay = document.getElementById('roundEndStatus');
const globalVerseCountDisplay = document.getElementById('globalVerseCount');
const roundChapterCountDisplay = document.getElementById('roundChapterCount');
const replayAudioBtn = document.getElementById("replayAudioBtn");

// Toggle Shloka View Elements
const toggleShlokaBtn = document.getElementById('toggleShlokaBtn');
const shlokaDisplayContainer = document.getElementById('shlokaDisplayContainer');
const shlokaTextContent = document.getElementById('shlokaTextContent');
const audioToggle = document.getElementById("audioToggle");

// Mode Toggle Elements
const modeNumberBtn = document.getElementById('modeNumberBtn');
const modeSanskritBtn = document.getElementById('modeSanskritBtn');

// Universe Selector Elements
const universeSelectorBtn = document.getElementById('universeSelectorBtn');
const universeDropdown = document.getElementById('universeDropdown');
const chapterCheckboxContainer = document.getElementById('chapterCheckboxContainer');
const selectAllChaptersCheckbox = document.getElementById('selectAllChapters');
const universeBtnText = document.getElementById('universeBtnText');

// NEW: Scroll Button
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

// NEW v1.20: Show Next Shloka Button
const showNextShlokaBtn = document.getElementById('showNextShloka');
// NEW v1.21: Show Previous Shloka Button
const showPrevShlokaBtn = document.getElementById('showPrevShloka');

// ---------------------------------------------------------
// 3. GLOBAL STATE
// ---------------------------------------------------------
// 🔐 LOCAL STORAGE KEYS
const STORAGE_KEY = "gitaAppState";

let globalUniverse = []; 
let roundUniverse = [];  
let chaptersInRound = new Set(); 

let selectedChapters = new Set(); 

let currentDisplayVerses = []; 
let currentGeneratedKey = null; 
let displayMode = 'NUMBER'; 
let currentAudio = null;


// ---------------------------------------------------------
// 4. HELPER FUNCTIONS
// ---------------------------------------------------------

function formatVerse(chapter, verse) {
    return `${chapter}.${verse.toString().padStart(2, '0')}`;
}

function parseVerse(verseStr) {
    const [ch, vs] = verseStr.split('.');
    return {
        chapter: parseInt(ch),
        verse: parseInt(vs)
    };
}

function getNextVerse(chapter, verse) {
    if (verse < CHAPTER_VERSES[chapter]) {
        return { chapter, verse: verse + 1 };
    } else if (chapter < MAX_CHAPTER) {
        return { chapter: chapter + 1, verse: 1 };
    }
    return null; 
}

function playVerseAudio(chapter, verse) {

    const audioFilePath = `audio/${chapter}-${verse}.mp3`;

        if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio.src = "";
    }

    currentAudio = new Audio(audioFilePath);
    
    currentAudio.play().catch(error => {
        console.log("Audio playback failed:", error);
    });
}

function getPreviousVerse(chapter, verse) {
    if (verse > 1) {
        return { chapter, verse: verse - 1 };
    } else if (chapter > 1) {
        return { chapter: chapter - 1, verse: CHAPTER_VERSES[chapter - 1] };
    }
    return null; 
}

function replenishGlobalUniverse() {
    let chaptersReplenished = [];

    selectedChapters.forEach(ch => {
        const chapterIsMissing = !globalUniverse.some(v => parseVerse(v).chapter === ch);

        if (chapterIsMissing) {
            const maxVerse = CHAPTER_VERSES[ch];
            const versesToAdd = [];
            for (let vs = 1; vs <= maxVerse; vs++) {
                versesToAdd.push(`${ch}.${vs.toString().padStart(2, '0')}`);
            }
            globalUniverse.push(...versesToAdd);
            chaptersReplenished.push(ch);
        }
    });

    if (chaptersReplenished.length > 0) {
        chaptersReplenished.sort((a, b) => a - b);
        const alertMessage = "Adhyaya(s) " + chaptersReplenished.join(', ') + 
                             " had run out of verses and were fully REPLENISHED into the Global Universe.";
        alert(alertMessage);
    }
}

function generateAllVerses() {
    const allVerses = [];
    selectedChapters.forEach(ch => {
        const maxVerse = CHAPTER_VERSES[ch];
        for (let vs = 1; vs <= maxVerse; vs++) {
            allVerses.push(formatVerse(ch, vs));
        }
    });
    return allVerses;
}

function initializeState() {
    const restored = loadState();

    if (!restored) {
        for (let i = 1; i <= MAX_CHAPTER; i++) selectedChapters.add(i);
        performFullReset();
    }

    renderUniverseSelector();
    updateUniverseButtonLabel();
    // console.log("Calling renderMainDisplay() from initializeState with currentGeneratedKey:", currentGeneratedKey);
    // calling setMode not only sets the displayMode and updates the mode toggle button styles but also calls renderMainDisplay() to ensure that the main display is rendered according to the current displayMode when the app is initialized or when the state is restored from local storage.
    setMode(displayMode); 
    // renderMainDisplay();

    if (currentGeneratedKey) {
        toggleShlokaBtn.disabled = false;
        replayAudioBtn.disabled = false;
    } else {
        toggleShlokaBtn.disabled = true;
        replayAudioBtn.disabled = true;
    }

    updateUI();
}

function performFullReset() {
    const allVerses = generateAllVerses(); 
    globalUniverse = [...allVerses];
    
    roundUniverse = [...globalUniverse];
    chaptersInRound.clear();
    selectedChapters.forEach(ch => {
        if(globalUniverse.some(v => parseVerse(v).chapter === ch)){
            chaptersInRound.add(ch);
        }
    });

    currentDisplayVerses = [];
    currentGeneratedKey = null;
    toggleShlokaBtn.textContent = "Show Full Shloka Text";
    toggleShlokaBtn.disabled = true;
    replayAudioBtn.disabled = true;

    shlokaDisplayContainer.classList.add('hidden');
    renderMainDisplay(); 

    updateUI();
    saveState();
}

function resetRound() {
    // replenishGlobalUniverse();
    roundUniverse = [...globalUniverse]; 
    
    chaptersInRound.clear();
    
    selectedChapters.forEach(ch => {
        const chapterHasRemainingVerses = globalUniverse.some(v => {
            const verseObj = parseVerse(v);
            return verseObj.chapter === ch;
        });

        if (chapterHasRemainingVerses) {
            chaptersInRound.add(ch);
        }
    });
    
    currentDisplayVerses = [];
    currentGeneratedKey = null;
    toggleShlokaBtn.textContent = "Show Full Shloka Text";
    toggleShlokaBtn.disabled = true;
    replayAudioBtn.disabled = true;

    shlokaDisplayContainer.classList.add('hidden');
    renderMainDisplay();

    updateUI();
    saveState();
}

// 🔐 LOCAL STORAGE HELPERS
function saveState() {
    const state = {
        globalUniverse,
        roundUniverse,
        chaptersInRound: Array.from(chaptersInRound),
        selectedChapters: Array.from(selectedChapters),
        currentDisplayVerses,
        currentGeneratedKey,
        displayMode
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
        const state = JSON.parse(raw);

        globalUniverse = state.globalUniverse || [];
        roundUniverse = state.roundUniverse || [];
        chaptersInRound = new Set(state.chaptersInRound || []);
        selectedChapters = new Set(state.selectedChapters || []);
        currentDisplayVerses = state.currentDisplayVerses || [];
        currentGeneratedKey = state.currentGeneratedKey || null;
        displayMode = state.displayMode || "NUMBER";

        return true;
    } catch (e) {
        console.warn("Failed to restore saved state:", e);
        return false;
    }
}

// ---------------------------------------------------------
// 5. UNIVERSE SELECTOR UI LOGIC
// ---------------------------------------------------------

function renderUniverseSelector() {
    chapterCheckboxContainer.innerHTML = '';
    
    for (let i = 1; i <= MAX_CHAPTER; i++) {
        const div = document.createElement('div');
        div.className = "flex items-center space-x-2 hover:bg-gray-50 p-1 rounded";
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `ch_checkbox_${i}`;
        checkbox.value = i;
        checkbox.checked = true; 
        checkbox.className = "form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out";
        
        checkbox.addEventListener('change', (e) => {
            handleChapterSelectionChange(i, e.target.checked);
        });

        const label = document.createElement('label');
        label.htmlFor = `ch_checkbox_${i}`;
        label.className = "text-sm text-gray-700 cursor-pointer select-none flex-grow";
        label.innerText = `Adhyaya ${i}`;

        div.appendChild(checkbox);
        div.appendChild(label);
        chapterCheckboxContainer.appendChild(div);
    }
}

function handleChapterSelectionChange(chapterNum, isChecked) {
    if (isChecked) {
        selectedChapters.add(chapterNum);
    } else {
        selectedChapters.delete(chapterNum);
    }
    
    syncSelectAllCheckbox();
    updateUniverseButtonLabel();
    performFullReset(); 
    saveState();
}

function toggleAllChapters(isChecked) {
    const checkboxes = chapterCheckboxContainer.querySelectorAll('input[type="checkbox"]');
    selectedChapters.clear();
    
    checkboxes.forEach(cb => {
        cb.checked = isChecked;
        if (isChecked) {
            selectedChapters.add(parseInt(cb.value));
        }
    });

    updateUniverseButtonLabel();
    performFullReset();
    saveState();
}

function syncSelectAllCheckbox() {
    const allSelected = selectedChapters.size === MAX_CHAPTER;
    selectAllChaptersCheckbox.checked = allSelected;
}

function updateUniverseButtonLabel() {
    const count = selectedChapters.size;
    
    if (count === MAX_CHAPTER) {
        universeBtnText.textContent = "All Adhyayas";
    } else if (count === 0) {
        universeBtnText.textContent = "Select Adhyayas...";
    } else {
        universeBtnText.textContent = `${count} Adhyaya${count > 1 ? 's' : ''} Selected`;
    }
}

// Toggle Dropdown Visibility
universeSelectorBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    universeDropdown.classList.toggle('hidden');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!universeSelectorBtn.contains(e.target) && !universeDropdown.contains(e.target)) {
        universeDropdown.classList.add('hidden');
    }
});

// Select All Listener
selectAllChaptersCheckbox.addEventListener('change', (e) => {
    toggleAllChapters(e.target.checked);
});

// ---------------------------------------------------------
// 6. DISPLAY & MODE LOGIC
// ---------------------------------------------------------

function setMode(mode) {
    displayMode = mode;
    
    const activeClass = "bg-white text-indigo-700 shadow-sm font-bold";
    const inactiveClass = "text-gray-500 hover:text-gray-700 font-medium";

    const resetClasses = (el) => {
        el.className = `px-6 py-2 rounded-md text-base transition-all duration-200 ${inactiveClass}`;
    };

    resetClasses(modeNumberBtn);
    resetClasses(modeSanskritBtn);

    if (mode === 'NUMBER') {
        console.log("Switched to NUMBER mode");
        modeNumberBtn.className = `px-6 py-2 rounded-md text-base transition-all duration-200 ${activeClass}`;
    } else {
        console.log("Switched to SANSKRIT mode");
        modeSanskritBtn.className = `px-6 py-2 rounded-md text-base transition-all duration-200 ${activeClass}`;
    }

    renderMainDisplay();
    saveState();
}

function renderMainDisplay() {
    if (!currentGeneratedKey) {
        generatedVerseDisplay.textContent = "";
        return;
    }

    if (displayMode === 'NUMBER') {
        generatedVerseDisplay.textContent = currentGeneratedKey;
        generatedVerseDisplay.classList.remove('text-xl', 'md:text-2xl');
        generatedVerseDisplay.classList.add('text-3xl', 'md:text-5xl');
    } else {
        // console.log("Rendering main display for key:", currentGeneratedKey);
        // console.log("Value:", CHAPTER_VERSE_TO_SHLOKA[currentGeneratedKey]);
        
        let fullText = CHAPTER_VERSE_TO_SHLOKA[currentGeneratedKey];
        
        if (!fullText) {
            const parts = currentGeneratedKey.split('.');
            const simpleKey = `${parseInt(parts[0])}.${parseInt(parts[1])}`;
            fullText = CHAPTER_VERSE_TO_SHLOKA[simpleKey];
        }

        if (fullText) {
            let firstPart = fullText.split(',')[0];
            const keyword = 'वाच\n';
            if (firstPart.includes(keyword)) {
                const parts = firstPart.split(keyword);
                if (parts.length > 1) {
                    firstPart = parts[1].trim();
                }
            }

            // 'Further splitting by a new line for special case v11.22 where comma is not there and then even by - to handle special case for v8.20 where there is a hyphen instead of a comma'
            firstPart = firstPart.split('\n')[0];
            firstPart = firstPart.split('-')[0];

            generatedVerseDisplay.textContent = firstPart.trim();
        } else {
            generatedVerseDisplay.textContent = "(Text Unavailable)";
        }

        generatedVerseDisplay.classList.remove('text-3xl', 'md:text-5xl');
        generatedVerseDisplay.classList.add('text-xl', 'md:text-2xl');
    }
}

// ---------------------------------------------------------
// 7. MAIN LOGIC (Generate & View)
// ---------------------------------------------------------

function updateUI() {
    globalVerseCountDisplay.textContent = globalUniverse.length;
    roundChapterCountDisplay.textContent = chaptersInRound.size;
    
    if (selectedChapters.size === 0) {
        generateVerseBtn.disabled = true;
        generateVerseBtn.textContent = 'Select an Adhyaya'; 
        generatedVerseDisplay.textContent = '';
        return;
    }

    if (globalUniverse.length === 0) {
        generateVerseBtn.disabled = true;
        generateVerseBtn.textContent = 'All Shlokas Exhausted!';
        // generatedVerseDisplay.textContent = '';
        resetRoundBtn.disabled = true;
    } else if (chaptersInRound.size === 0) {
        generateVerseBtn.disabled = true;
        generateVerseBtn.textContent = 'Round Complete! (Reset Required)';
        roundEndDisplay.textContent = 'ROUND END';
        resetRoundBtn.textContent = 'Round Complete! (Click to Reset)';
        resetRoundBtn.disabled = false;
    } else {
        generateVerseBtn.disabled = false;
        generateVerseBtn.textContent = 'Generate Random Shloka';
        resetRoundBtn.textContent = 'Reset Round';
        resetRoundBtn.disabled = false;
        roundEndDisplay.textContent = '';
    }
}

//v1.20 refactored out of toggleShlokaView() when the shloka container is hidden to show all verses: Renders the full shloka text for all verses in currentDisplayVerses
function renderShlokaView() {
    
    shlokaTextContent.innerHTML = ''; 
    if (currentDisplayVerses.length === 0) return;

    currentDisplayVerses.forEach(verseKey => {
        let text = CHAPTER_VERSE_TO_SHLOKA[verseKey];
        if (!text) {
            const parts = verseKey.split('.');
            const simpleKey = `${parseInt(parts[0])}.${parseInt(parts[1])}`;
            text = CHAPTER_VERSE_TO_SHLOKA[simpleKey];
        }

        const verseBlock = document.createElement('div');
        verseBlock.className = "pb-4 border-b border-orange-200 last:border-0";
        
        const title = document.createElement('h4');
        title.className = "font-bold text-orange-600 mb-2";
        title.textContent = `Shloka ${verseKey}`;

        const p = document.createElement('p');
        p.textContent = text || "Shloka text not available in dictionary.";

        verseBlock.appendChild(title);
        verseBlock.appendChild(p);
        shlokaTextContent.appendChild(verseBlock);
    });
}

function toggleShlokaView() {
    const isHidden = shlokaDisplayContainer.classList.contains('hidden');
    
    if (isHidden) {
        // v1.20: Display Refactored into a new function renderShlokaView() above
        renderShlokaView();

        shlokaDisplayContainer.classList.remove('hidden');
        toggleShlokaBtn.textContent = "Hide Full Shloka Text";
        
        // NEW: Scroll down to the displayed shloka section
        shlokaDisplayContainer.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start' 
        });

    } else {
        shlokaDisplayContainer.classList.add('hidden');
        toggleShlokaBtn.textContent = "Show Full Shloka Text";
    }
}

// v1.20 addition: Adds the previous/next sequential verse to currentDisplayVerses array
// v1.21: The whole function refactored even more adaptably to accept a parameter to add either next or previous verse
function addOneFormattedVerse(extractNextVerse = true) {
    if (currentDisplayVerses.length === 0) return false;

    const refVerse = extractNextVerse ? currentDisplayVerses[currentDisplayVerses.length - 1] : currentDisplayVerses[0];
    const parsed = parseVerse(refVerse);
    if (!parsed) return false;

    const newVerseCursor = extractNextVerse ? getNextVerse(parsed.chapter, parsed.verse) : getPreviousVerse(parsed.chapter, parsed.verse);
    if (!newVerseCursor) return false;

    // Depending on the direction, add to the end or beginning of the array 'currentDisplayVerses'
    extractNextVerse ? currentDisplayVerses.push(
        formatVerse(newVerseCursor.chapter, newVerseCursor.verse)
    ) : currentDisplayVerses.unshift(
        formatVerse(newVerseCursor.chapter, newVerseCursor.verse)
    );

    return true;
}

function handleGenerateVerse() {
    if (chaptersInRound.size === 0 || globalUniverse.length === 0) {
        updateUI();
        return;
    }

    const selectableVerses = roundUniverse.filter(verseStr => {
        const { chapter } = parseVerse(verseStr);
        return chaptersInRound.has(chapter);
    });

    if (selectableVerses.length === 0) {
         resetRound();
         return;
    }

    // Selecting verse at random
    // Looping until either: 1) The next verse is in the selectableVerses or 2) the next verse and previous verse both are not in the selectableVerses
    while (true) {
            
        var randomIndex = Math.floor(Math.random() * selectableVerses.length);    
        var selectedVerse = selectableVerses[randomIndex];
        var { chapter, verse } = parseVerse(selectedVerse);
        var nextVerseObj = getNextVerse(chapter, verse);
        var previousVerseObj = getPreviousVerse(chapter, verse);

        var nextVerseStr = nextVerseObj ? formatVerse(nextVerseObj.chapter, nextVerseObj.verse) : null;
        var previousVerseStr = previousVerseObj ? formatVerse(previousVerseObj.chapter, previousVerseObj.verse) : null;

        if (selectableVerses.includes(nextVerseStr)) {
            break; // Accept this verse and exit the loop as the next verse is in selectableVerses
        } else if (!selectableVerses.includes(previousVerseStr) && !selectableVerses.includes(nextVerseStr)) {
            break; // Accept this verse and exit the loop as both previous and next verses are not in selectableVerses and this verse has to be chosen otherwise this verse will never get chosen
        } else { 
            console.log("Re-rolling verse selection as next verse is not in selectableVerses"); 
            console.log(`Selected Verse: ${selectedVerse}, Next Verse: ${nextVerseStr}, Previous Verse: ${previousVerseStr}`);
            console.log(`Selectable Verses were: ${selectableVerses.join(', ')}`);
        }
    }

    currentGeneratedKey = selectedVerse;
    renderMainDisplay(); 
    if (audioToggle.checked) {
        playVerseAudio(chapter, verse);
    }    

    currentDisplayVerses = [selectedVerse]; 
    for (let i = 0; i < 2; i++) {
        // v1.20: Refactored into a separate function
        if (!addOneFormattedVerse(true)) break;
    }

    shlokaDisplayContainer.classList.add('hidden'); 
    toggleShlokaBtn.textContent = "Show Full Shloka Text";
    toggleShlokaBtn.disabled = false; 
    replayAudioBtn.disabled = false;

    // CULLING LOGIC
    const versesToRemove = [selectedVerse];
    let current = { chapter, verse };
    for (let i = 0; i < 2; i++) {
        current = getNextVerse(current.chapter, current.verse);
        if (current) {
            const nextVerseStr = formatVerse(current.chapter, current.verse);
            if (globalUniverse.includes(nextVerseStr)) {
                 versesToRemove.push(nextVerseStr);
            }
        } else {
            break;
        }
    }
    
    globalUniverse = globalUniverse.filter(v => !versesToRemove.includes(v));
    roundUniverse = globalUniverse; 
    
    chaptersInRound.delete(chapter);
    updateUI();
    saveState();
}

function replayCurrentVerseAudio() {
    if (!currentGeneratedKey) return;

    const { chapter, verse } = parseVerse(currentGeneratedKey);
    playVerseAudio(chapter, verse);
}


// ---------------------------------------------------------
// 8. EVENT LISTENERS
// ---------------------------------------------------------

// Load verses from JSON file on DOMContentLoaded before initializing the app state to ensure that the CHAPTER_VERSE_TO_SHLOKA dictionary is populated and ready for use when rendering shloka texts.
document.addEventListener("DOMContentLoaded", async () => {
    // console.log("DOM fully loaded and parsed. Now loading verses...");
    await loadVerses();
    // initialization is now called inside the DOMContentLoaded event listener after verses are loaded to ensure that the CHAPTER_VERSE_TO_SHLOKA dictionary is populated and ready for use when rendering shloka texts.
    initializeState();
});


generateVerseBtn.addEventListener('click', handleGenerateVerse);
resetRoundBtn.addEventListener('click', resetRound);
toggleShlokaBtn.addEventListener('click', toggleShlokaView);
replayAudioBtn.addEventListener("click", replayCurrentVerseAudio);

// Mode Toggle Listeners
modeNumberBtn.addEventListener('click', () => setMode('NUMBER'));
modeSanskritBtn.addEventListener('click', () => setMode('SANSKRIT'));

// v1.20: Show Next Shloka Button Listener
showNextShlokaBtn.addEventListener('click', () => {
    const added = addOneFormattedVerse(true);
    if (added) {
        renderShlokaView();
        
        // Scroll to the Show Next Shloka Button for better visibility
        showNextShlokaBtn.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center' // Center the button for best visibility
        });

    }
});

// v1.21: Show Next Shloka Button Listener
showPrevShlokaBtn.addEventListener('click', () => {
    const added = addOneFormattedVerse(false);
    if (added) {
        renderShlokaView();
        
        // Scroll to the Show Next Shloka Button for better visibility
        showPrevShlokaBtn.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center' // Center the button for best visibility
        });

    }
});

// NEW: Scroll Up Listener
scrollToTopBtn.addEventListener('click', () => {
    // Scroll up to the Generate Verse button
    generateVerseBtn.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center' // Center the button for best visibility
    });
});

const resetAllBtn = document.getElementById("resetAllBtn");

resetAllBtn.addEventListener("click", () => {
    const confirmed = confirm(
        "⚠️ This will RESET ALL SHLOKAS and erase your entire progress.\n\n" +
        "This action cannot be undone.\n\n" +
        "Do you want to continue?"
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);

    globalUniverse = [];
    roundUniverse = [];
    chaptersInRound.clear();
    selectedChapters.clear();
    currentDisplayVerses = [];
    currentGeneratedKey = null;
    displayMode = "NUMBER";

    initializeState();
});

// ---------------------------------------------------------
// 9. INITIALIZATION
// ---------------------------------------------------------
// initializeState();
// initialization is now called inside the DOMContentLoaded event listener after verses are loaded to ensure that the CHAPTER_VERSE_TO_SHLOKA dictionary is populated and ready for use when rendering shloka texts.