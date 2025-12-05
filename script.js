// JavaScript Logic (script.js)

// 1. Configuration: Chapter and Verse Counts
const CHAPTER_VERSES = {
    1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
    7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
    13: 34, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78
};
const MAX_CHAPTER = 18;
// const MAX_VERSE_18 = 78; // Not strictly needed as it's in CHAPTER_VERSES

// 2. DOM Elements
const generateVerseBtn = document.getElementById('generateVerseBtn');
const resetRoundBtn = document.getElementById('resetRoundBtn');
const generatedVerseDisplay = document.getElementById('generatedVerseDisplay');
const roundEndDisplay = document.getElementById('roundEndStatus');
const globalVerseCountDisplay = document.getElementById('globalVerseCount');
const roundChapterCountDisplay = document.getElementById('roundChapterCount');

// 3. Global State Variables
let globalUniverse = []; // The 'master' list of remaining verses (culled by 3)
let roundUniverse = [];  // The temporary list for round mode (culled by chapter) - maintained as a copy of globalUniverse
let chaptersInRound = new Set(); // Tracks which chapters are still active in the current round

// 4. Helper Functions

/**
 * Converts chapter and verse numbers to the "C.VV" string format.
 * @param {number} chapter - The chapter number.
 * @param {number} verse - The verse number.
 * @returns {string} - The formatted verse string (e.g., "1.47").
 */
function formatVerse(chapter, verse) {
    return `${chapter}.${verse.toString().padStart(2, '0')}`;
}

/**
 * Converts a "C.VV" verse string back into {chapter, verse} object.
 * @param {string} verseStr - The formatted verse string (e.g., "1.47").
 * @returns {{chapter: number, verse: number}}
 */
function parseVerse(verseStr) {
    const [ch, vs] = verseStr.split('.');
    return {
        chapter: parseInt(ch),
        verse: parseInt(vs)
    };
}

/**
 * Calculates the verse immediately following a given verse.
 * @param {number} chapter - Current chapter.
 * @param {number} verse - Current verse.
 * @returns {{chapter: number, verse: number} | null} - The next verse, or null if it's the last verse.
 */
function getNextVerse(chapter, verse) {
    if (verse < CHAPTER_VERSES[chapter]) {
        return { chapter, verse: verse + 1 };
    } else if (chapter < MAX_CHAPTER) {
        return { chapter: chapter + 1, verse: 1 };
    }
    return null; // Last verse (18.78)
}

/**
 * Generates the initial list of all 700 verses.
 * @returns {string[]} - Array of all verse strings (e.g., ["1.01", "1.02", ..., "18.78"]).
 */
function generateAllVerses() {
    const allVerses = [];
    for (let ch = 1; ch <= MAX_CHAPTER; ch++) {
        const maxVerse = CHAPTER_VERSES[ch];
        for (let vs = 1; vs <= maxVerse; vs++) {
            allVerses.push(formatVerse(ch, vs));
        }
    }
    return allVerses;
}

/**
 * Initializes the state: the Global Universe and the Round Universe.
 */
function initializeState() {
    const allVerses = generateAllVerses();
    globalUniverse = [...allVerses];
    resetRound(); // Sets up the initial round
    updateUI();
}

/**
 * Resets the Round-Based Universe to the current Global Universe state.
 */
function resetRound() {
    // 1. Reset the verse list for the round (must be a subset of global)
    roundUniverse = [...globalUniverse]; 
    
    // 2. Determine which chapters in the global universe still exist
    chaptersInRound.clear();
    for (let ch = 1; ch <= MAX_CHAPTER; ch++) {
        // Simple check: if any verse from the chapter is present in the global list, the chapter is considered 'active'
        const startVerse = formatVerse(ch, 1);
        const endVerse = formatVerse(ch, CHAPTER_VERSES[ch]);
        
        // Check if the chapter has at least one remaining verse in globalUniverse
        const chapterHasRemainingVerses = globalUniverse.some(v => {
            const verseObj = parseVerse(v);
            return verseObj.chapter === ch;
        });

        if (chapterHasRemainingVerses) {
            chaptersInRound.add(ch);
        }
    }
    
    updateUI();
}

/**
 * Updates the display elements with current universe sizes.
 */
function updateUI() {
    globalVerseCountDisplay.textContent = globalUniverse.length;
    roundChapterCountDisplay.textContent = chaptersInRound.size;
    
    // Disable button if global universe is exhausted
    if (globalUniverse.length === 0) {
        generateVerseBtn.disabled = true;
        generateVerseBtn.textContent = 'All Verses Exhausted!';
        generatedVerseDisplay.textContent = 'GAME OVER';
        resetRoundBtn.disabled = true;
    } else if (chaptersInRound.size === 0) {
         // Round complete, global universe might still have verses
        generateVerseBtn.disabled = true;
        generateVerseBtn.textContent = 'Round Complete! (Reset Required)';
        // generatedVerseDisplay.textContent += '\n ROUND END';
        roundEndDisplay.textContent = 'ROUND END';
        resetRoundBtn.textContent = 'Round Complete! (Click to Reset)';
        resetRoundBtn.disabled = false;
    } else {
         generateVerseBtn.disabled = false;
         generateVerseBtn.textContent = 'Generate Random Shloka';
         resetRoundBtn.textContent = 'Reset Round';
         resetRoundBtn.disabled = false;
         roundEndDisplay.textContent = ''
         roundEndDisplay.disabled = false;
    }
}


// 5. Main Logic Functions

/**
 * Handles the click event for generating a random verse and culling the universes.
 */
function handleGenerateVerse() {
    // 1. Pre-Check for Round/Global status
    if (chaptersInRound.size === 0 || globalUniverse.length === 0) {
        // UI handles disabling, but this prevents unexpected behavior
        updateUI();
        return;
    }

    // 2. Select Random Verse from the current selectable set (Round Universe Logic)
    // The selectable set is the subset of verses from roundUniverse whose chapters are active.
    const selectableVerses = roundUniverse.filter(verseStr => {
        const { chapter } = parseVerse(verseStr);
        return chaptersInRound.has(chapter);
    });

    if (selectableVerses.length === 0) {
         // Should not happen if chaptersInRound > 0, but as a safeguard
         alert('Error: No verses found in the selectable set. Attempting reset...');
         resetRound();
         return;
    }

    const randomIndex = Math.floor(Math.random() * selectableVerses.length);
    const selectedVerse = selectableVerses[randomIndex];
    const { chapter, verse } = parseVerse(selectedVerse);

    generatedVerseDisplay.textContent = selectedVerse;


    // --- A. Culling the Global Universe (3 verses at a time) ---

    const versesToRemove = [selectedVerse];

    // Get the next two sequential verses (V+1, V+2)
    let current = { chapter, verse };
    for (let i = 0; i < 2; i++) {
        current = getNextVerse(current.chapter, current.verse);
        if (current) {
            const nextVerseStr = formatVerse(current.chapter, current.verse);
            
            // The rule is to remove the next two sequential verses, *if they exist*.
            // We only need to check if they are currently in the Global Universe array before removing.
            if (globalUniverse.includes(nextVerseStr)) {
                 versesToRemove.push(nextVerseStr);
            }
            // Continue iteration even if a verse was already removed, as the next one might still be there.
            // Example: If 7.30 is chosen, V+1 is 8.01. If 8.01 was already removed, V+2 (8.02) might still be present.
        } else {
            // Reached 18.78
            break;
        }
    }
    
    // Remove the collected verses from the Global Universe
    globalUniverse = globalUniverse.filter(v => !versesToRemove.includes(v));

    // IMPORTANT: The roundUniverse MUST be updated to reflect the new state of the global universe.
    roundUniverse = globalUniverse; 
    
    // --- B. Culling the Round-Based Universe (entire chapter) ---

    // Remove the selected verse's chapter from the set of active chapters in the round
    chaptersInRound.delete(chapter);


    // 3. Update UI
    updateUI();
}

// 6. Event Listeners
generateVerseBtn.addEventListener('click', handleGenerateVerse);
resetRoundBtn.addEventListener('click', resetRound);

// 7. Initial Setup
initializeState();
