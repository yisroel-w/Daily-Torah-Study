// Enhanced API Integration for Daily Chitas and Rambam Content

// API Endpoints
const SEFARIA_API = {
    CALENDARS: 'https://www.sefaria.org/api/calendars',
    TEXTS: 'https://www.sefaria.org/api/texts/',
    LINKS: 'https://www.sefaria.org/api/links/'
};

// DOM Elements
const gregorianDateEl = document.getElementById('gregorian-date');
const hebrewDateEl = document.getElementById('hebrew-date');
const toggleLangBtn = document.getElementById('toggle-lang');
const toggleThemeBtn = document.getElementById('toggle-theme');
const textModal = document.getElementById('text-modal');
const modalTitle = document.getElementById('modal-title');
const textContent = document.getElementById('text-content');
const closeModal = document.querySelector('.close-modal');
const otherDailyStudy = document.getElementById('other-daily-study');

// References elements
const chumashRefEl = document.getElementById('chumash-ref');
const tehillimRefEl = document.getElementById('tehillim-ref');
const tanyaRefEl = document.getElementById('tanya-ref');
const rambam1RefEl = document.getElementById('rambam-1-ref');
const rambam3RefEl = document.getElementById('rambam-3-ref');

// View buttons
const viewChumashBtn = document.getElementById('view-chumash');
const viewTehillimBtn = document.getElementById('view-tehillim');
const viewTanyaBtn = document.getElementById('view-tanya');
const viewRambam1Btn = document.getElementById('view-rambam-1');
const viewRambam3Btn = document.getElementById('view-rambam-3');

// State
let calendarData = null;
let currentLanguage = 'en'; // 'en' or 'he'
let isDarkTheme = false;
let textCache = {}; // Cache for text content

// Initialize the application
async function init() {
    setCurrentDate();
    await fetchCalendarData();
    setupEventListeners();
    populateContent();
}

// Set current date display
function setCurrentDate() {
    const now = new Date();
    
    // Format Gregorian date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    gregorianDateEl.textContent = now.toLocaleDateString('en-US', options);
}

// Fetch calendar data from Sefaria API
async function fetchCalendarData() {
    try {
        showLoading('Loading daily study materials...');
        
        const response = await fetch(SEFARIA_API.CALENDARS);
        if (!response.ok) {
            throw new Error('Failed to fetch calendar data');
        }
        
        const data = await response.json();
        calendarData = data;
        
        // Set Hebrew date from API response
        if (data.date) {
            // Format Hebrew date
            const hebrewDateResponse = await fetch(`https://www.hebcal.com/converter?cfg=json&date=${data.date}&g2h=1`);
            if (hebrewDateResponse.ok) {
                const hebrewDateData = await hebrewDateResponse.json();
                hebrewDateEl.textContent = hebrewDateData.hebrew || data.date;
            } else {
                hebrewDateEl.textContent = data.date;
            }
        }
        
        hideLoading();
        return data;
    } catch (error) {
        console.error('Error fetching calendar data:', error);
        showError('Failed to load daily study materials. Please try again later.');
        hideLoading();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Toggle language
    toggleLangBtn.addEventListener('click', () => {
        currentLanguage = currentLanguage === 'en' ? 'he' : 'en';
        document.body.classList.toggle('hebrew-interface', currentLanguage === 'he');
        updateLanguageDisplay();
    });
    
    // Toggle theme
    toggleThemeBtn.addEventListener('click', () => {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle('dark-theme', isDarkTheme);
    });
    
    // View text buttons
    viewChumashBtn.addEventListener('click', () => viewFullText('chumash'));
    viewTehillimBtn.addEventListener('click', () => viewFullText('tehillim'));
    viewTanyaBtn.addEventListener('click', () => viewFullText('tanya'));
    viewRambam1Btn.addEventListener('click', () => viewFullText('rambam1'));
    viewRambam3Btn.addEventListener('click', () => viewFullText('rambam3'));
    
    // Close modal
    closeModal.addEventListener('click', () => {
        textModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === textModal) {
            textModal.style.display = 'none';
        }
    });
}

// Update display based on selected language
function updateLanguageDisplay() {
    // Update text elements based on the selected language
    populateContent();
}

// Populate content from calendar data
function populateContent() {
    if (!calendarData || !calendarData.calendar_items) {
        return;
    }
    
    const items = calendarData.calendar_items;
    
    // Find relevant items
    const parashaItem = items.find(item => item.title.en === 'Parashat Hashavua');
    const tanyaItem = items.find(item => item.title.en === 'Tanya Yomi');
    const rambam1Item = items.find(item => item.title.en === 'Daily Rambam');
    const rambam3Item = items.find(item => item.title.en === 'Daily Rambam (3 Chapters)');
    
    // Calculate Tehillim portion based on day of month
    const tehillimPortion = calculateTehillimPortion();
    
    // Update references
    if (parashaItem) {
        chumashRefEl.innerHTML = formatReference(parashaItem);
    }
    
    tehillimRefEl.innerHTML = tehillimPortion;
    
    if (tanyaItem) {
        tanyaRefEl.innerHTML = formatReference(tanyaItem);
    }
    
    if (rambam1Item) {
        rambam1RefEl.innerHTML = formatReference(rambam1Item);
    }
    
    if (rambam3Item) {
        rambam3RefEl.innerHTML = formatReference(rambam3Item);
    }
    
    // Populate other daily study items
    populateOtherDailyStudy(items);
}

// Format reference display
function formatReference(item) {
    const lang = currentLanguage;
    const displayValue = item.displayValue[lang] || item.displayValue.en;
    const title = item.title[lang] || item.title.en;
    
    return `
        <div class="ref-title">${displayValue}</div>
        <div class="ref-source">${title}</div>
    `;
}

// Calculate Tehillim portion based on day of month
function calculateTehillimPortion() {
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    // Tehillim is divided into 30 portions, one for each day of the month
    const tehillimMap = {
        1: { range: "Psalms 1-9", ref: "Psalms.1-9" },
        2: { range: "Psalms 10-17", ref: "Psalms.10-17" },
        3: { range: "Psalms 18-22", ref: "Psalms.18-22" },
        4: { range: "Psalms 23-28", ref: "Psalms.23-28" },
        5: { range: "Psalms 29-34", ref: "Psalms.29-34" },
        6: { range: "Psalms 35-38", ref: "Psalms.35-38" },
        7: { range: "Psalms 39-43", ref: "Psalms.39-43" },
        8: { range: "Psalms 44-48", ref: "Psalms.44-48" },
        9: { range: "Psalms 49-54", ref: "Psalms.49-54" },
        10: { range: "Psalms 55-59", ref: "Psalms.55-59" },
        11: { range: "Psalms 60-65", ref: "Psalms.60-65" },
        12: { range: "Psalms 66-68", ref: "Psalms.66-68" },
        13: { range: "Psalms 69-71", ref: "Psalms.69-71" },
        14: { range: "Psalms 72-76", ref: "Psalms.72-76" },
        15: { range: "Psalms 77-78", ref: "Psalms.77-78" },
        16: { range: "Psalms 79-82", ref: "Psalms.79-82" },
        17: { range: "Psalms 83-87", ref: "Psalms.83-87" },
        18: { range: "Psalms 88-89", ref: "Psalms.88-89" },
        19: { range: "Psalms 90-96", ref: "Psalms.90-96" },
        20: { range: "Psalms 97-103", ref: "Psalms.97-103" },
        21: { range: "Psalms 104-105", ref: "Psalms.104-105" },
        22: { range: "Psalms 106-107", ref: "Psalms.106-107" },
        23: { range: "Psalms 108-112", ref: "Psalms.108-112" },
        24: { range: "Psalms 113-118", ref: "Psalms.113-118" },
        25: { range: "Psalms 119:1-88", ref: "Psalms.119.1-88" },
        26: { range: "Psalms 119:89-176", ref: "Psalms.119.89-176" },
        27: { range: "Psalms 120-134", ref: "Psalms.120-134" },
        28: { range: "Psalms 135-139", ref: "Psalms.135-139" },
        29: { range: "Psalms 140-144", ref: "Psalms.140-144" },
        30: { range: "Psalms 145-150", ref: "Psalms.145-150" },
    };
    
    // Handle months with less than 30 days
    let adjustedDay = dayOfMonth;
    if (dayOfMonth > 30) {
        adjustedDay = dayOfMonth - 30;
    }
    
    const portion = tehillimMap[adjustedDay] || tehillimMap[1];
    
    return `
        <div class="ref-title">${portion.range}</div>
        <div class="ref-source">Daily Tehillim</div>
    `;
}

// Populate other daily study items
function populateOtherDailyStudy(items) {
    // Filter out items that are already displayed in the main sections
    const otherItems = items.filter(item => 
        item.title.en !== 'Parashat Hashavua' && 
        item.title.en !== 'Tanya Yomi' && 
        item.title.en !== 'Daily Rambam' && 
        item.title.en !== 'Daily Rambam (3 Chapters)'
    );
    
    // Clear previous content
    otherDailyStudy.innerHTML = '';
    
    // Add accordion items
    otherItems.forEach(item => {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item';
        
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.innerHTML = `
            <span>${item.title[currentLanguage] || item.title.en}</span>
            <span>+</span>
        `;
        
        const content = document.createElement('div');
        content.className = 'accordion-content';
        content.innerHTML = `
            <div>${item.displayValue[currentLanguage] || item.displayValue.en}</div>
            <div class="item-actions">
                <button class="btn-view view-other" data-ref="${item.ref || ''}" data-url="${item.url || ''}">
                    View Full Text
                </button>
            </div>
        `;
        
        // Toggle accordion on click
        header.addEventListener('click', () => {
            content.classList.toggle('active');
            header.querySelector('span:last-child').textContent = 
                content.classList.contains('active') ? '-' : '+';
        });
        
        accordionItem.appendChild(header);
        accordionItem.appendChild(content);
        otherDailyStudy.appendChild(accordionItem);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-other').forEach(button => {
        button.addEventListener('click', (e) => {
            const ref = e.target.dataset.ref;
            const url = e.target.dataset.url;
            if (ref) {
                viewTextByRef(ref);
            } else if (url) {
                window.open(`https://www.sefaria.org/${url}`, '_blank');
            }
        });
    });
}

// View full text
async function viewFullText(type) {
    let ref = '';
    let title = '';
    
    switch (type) {
        case 'chumash':
            const parashaItem = calendarData.calendar_items.find(item => item.title.en === 'Parashat Hashavua');
            if (parashaItem) {
                ref = parashaItem.ref;
                title = parashaItem.displayValue[currentLanguage] || parashaItem.displayValue.en;
            }
            break;
        case 'tehillim':
            // For Tehillim, we use the calculated portion based on day of month
            const today = new Date();
            const dayOfMonth = today.getDate();
            let adjustedDay = dayOfMonth > 30 ? dayOfMonth - 30 : dayOfMonth;
            const tehillimMap = {
                1: { range: "Psalms 1-9", ref: "Psalms.1-9" },
                2: { range: "Psalms 10-17", ref: "Psalms.10-17" },
                // ... (other mappings as in calculateTehillimPortion)
            };
            const portion = tehillimMap[adjustedDay] || tehillimMap[1];
            ref = portion.ref;
            title = `Tehillim: ${portion.range}`;
            break;
        case 'tanya':
            const tanyaItem = calendarData.calendar_items.find(item => item.title.en === 'Tanya Yomi');
            if (tanyaItem) {
                ref = tanyaItem.ref;
                title = tanyaItem.displayValue[currentLanguage] || tanyaItem.displayValue.en;
            }
            break;
        case 'rambam1':
            const rambam1Item = calendarData.calendar_items.find(item => item.title.en === 'Daily Rambam');
            if (rambam1Item) {
                ref = rambam1Item.ref;
                title = rambam1Item.displayValue[currentLanguage] || rambam1Item.displayValue.en;
            }
            break;
        case 'rambam3':
            const rambam3Item = calendarData.calendar_items.find(item => item.title.en === 'Daily Rambam (3 Chapters)');
            if (rambam3Item) {
                ref = rambam3Item.ref;
                title = rambam3Item.displayValue[currentLanguage] || rambam3Item.displayValue.en;
            }
            break;
    }
    
    if (ref) {
        viewTextByRef(ref, title);
    }
}

// View text by reference
async function viewTextByRef(ref, title) {
    try {
        modalTitle.textContent = title || ref;
        textContent.innerHTML = '<div class="loading-message">Loading text...</div>';
        textModal.style.display = 'block';
        
        // Check cache first
        if (textCache[ref]) {
            displayText(textCache[ref]);
            return;
        }
        
        // Fetch text from Sefaria API
        const encodedRef = encodeURIComponent(ref);
        const response = await fetch(`${SEFARIA_API.TEXTS}${encodedRef}?context=0`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch text');
        }
        
        const data = await response.json();
        textCache[ref] = data; // Cache the result
        
        displayText(data);
    } catch (error) {
        console.error('Error fetching text:', error);
        textContent.innerHTML = `
            <div class="error-message">
                Failed to load text. Please try viewing on Sefaria directly:
                <a href="https://www.sefaria.org/${encodeURIComponent(ref)}" target="_blank" class="btn-view">
                    Open on Sefaria
                </a>
            </div>
        `;
    }
}

// Display text content
function displayText(data) {
    if (!data || !data.text) {
        textContent.innerHTML = '<div class="error-message">No text content available.</div>';
        return;
    }
    
    let html = '<div class="text-container">';
    
    // Handle array of text (chapters/verses)
    if (Array.isArray(data.text)) {
        data.text.forEach((section, index) => {
            if (typeof section === 'string') {
                html += `<p class="text-section">${section}</p>`;
            } else if (Array.isArray(section)) {
                // Handle nested arrays (verses within chapters)
                html += '<div class="chapter">';
                section.forEach((verse, verseIndex) => {
                    if (verse) {
                        html += `<p class="verse"><span class="verse-num">${verseIndex + 1}</span> ${verse}</p>`;
                    }
                });
                html += '</div>';
            }
        });
    } else if (typeof data.text === 'string') {
        // Handle single text string
        html += `<p class="text-section">${data.text}</p>`;
    }
    
    html += '</div>';
    
    // Add Hebrew text if available
    if (data.he) {
        html += '<div class="text-container hebrew">';
        
        if (Array.isArray(data.he)) {
            data.he.forEach((section, index) => {
                if (typeof section === 'string') {
                    html += `<p class="text-section he">${section}</p>`;
                } else if (Array.isArray(section)) {
                    // Handle nested arrays (verses within chapters)
                    html += '<div class="chapter">';
                    section.forEach((verse, verseIndex) => {
                        if (verse) {
                            html += `<p class="verse he"><span class="verse-num">${verseIndex + 1}</span> ${verse}</p>`;
                        }
                    });
                    html += '</div>';
                }
            });
        } else if (typeof data.he === 'string') {
            html += `<p class="text-section he">${data.he}</p>`;
        }
        
        html += '</div>';
    }
    
    textContent.innerHTML = html;
}

// Show loading message
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = `<div class="loading-spinner"></div><div class="loading-message">${message}</div>`;
    
    document.body.appendChild(loadingDiv);
}

// Hide loading message
function hideLoading() {
    const loadingDiv = document.querySelector('.loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.querySelector('main').prepend(errorDiv);
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
