/* ===========================
      COOKIE HELPERS
=========================== */

// Save cookie
function setCookie(name, value, days = 30) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// Read cookie
function getCookie(name) {
    return document.cookie.split("; ").reduce((result, cookie) => {
        const parts = cookie.split("=");
        return parts[0] === name ? decodeURIComponent(parts[1]) : result;
    }, "");
}

// Delete cookie
function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/* ===========================
   AUTO-LOAD & AUTO-SAVE SEARCH
=========================== */

// After DOM loaded, restore last search (if cookie exists)
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const last = getCookie("lastSearch");

    if (last && searchInput) {
        searchInput.value = last;      
        console.log("🔄 Restored last search:", last);
    }
});


// Load jobs from external data file
let jobsData = { all: [] };

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadJobsFromDataFile();
    generateSearchSuggestions(); // Generate dynamic suggestions
    loadMCQs();
    setupSearchFunctionality();
    setupFilterFunctionality();
});

// Load jobs from jobs-data.js file
function loadJobsFromDataFile() {
    // Check if jobsDatabase is available from jobs-data.js
    if (typeof jobsDatabase !== 'undefined') {
        jobsData.all = jobsDatabase;
        console.log('✅ Loaded', jobsData.all.length, 'jobs from database');
    } else {
        console.error('⚠️ jobs-data.js not loaded. Make sure to include it in HTML.');
        // Fallback to empty array
        jobsData.all = [];
    }
    
    // Initial load of jobs into sections
    loadJobs();
}

// Sample MCQs Data
const mcqsData = [
    {
        id: 1,
        question: "Q1. Who is known as the Father of Indian Constitution?",
        options: [
            "Mahatma Gandhi",
            "Dr. B.R. Ambedkar",
            "Jawaharlal Nehru",
            "Sardar Patel"
        ],
        correct: 1
    },
    {
        id: 2,
        question: "Q2. Which is the capital of Nagaland?",
        options: [
            "Dimapur",
            "Kohima",
            "Imphal",
            "Shillong"
        ],
        correct: 1
    },
    {
        id: 3,
        question: "Q3. The Brahmaputra River is known as _____ in Tibet.",
        options: [
            "Tsangpo",
            "Jamuna",
            "Meghna",
            "Padma"
        ],
        correct: 0
    },
    {
        id: 4,
        question: "Q4. Which article of the Indian Constitution deals with Right to Education?",
        options: [
            "Article 19",
            "Article 21A",
            "Article 14",
            "Article 32"
        ],
        correct: 1
    },
    {
        id: 5,
        question: "Q5. Hornbill Festival is celebrated in which state?",
        options: [
            "Assam",
            "Manipur",
            "Nagaland",
            "Meghalaya"
        ],
        correct: 2
    }
];

// Search Suggestions - Will be enhanced with actual job data
let searchSuggestions = [
    "10th pass jobs",
    "12th pass jobs",
    "Graduate jobs",
    "Railway",
    "UPSC",
    "SSC",
    "Banking",
    "Police",
    "Teaching",
    "Defense",
    "Nagaland",
    "Assam",
    "Manipur",
    "All India"
];

// Generate dynamic suggestions from job data
function generateSearchSuggestions() {
    const suggestions = new Set(searchSuggestions);
    
    jobsData.all.forEach(job => {
        // Add job titles
        suggestions.add(job.title);
        
        // Add organizations
        if (job.organization) {
            suggestions.add(job.organization);
        }
        
        // Add categories
        suggestions.add(job.category.toUpperCase());
        
        // Add state-specific searches
        const stateDisplay = job.state === 'all-india' ? 'All India' : 
                            job.state.charAt(0).toUpperCase() + job.state.slice(1).replace('-', ' ');
        suggestions.add(`${stateDisplay} jobs`);
        
        // Add qualification-specific searches
        const qualDisplay = {
            '10th': '10th pass jobs',
            '12th': '12th pass jobs',
            'graduate': 'Graduate jobs',
            'postgraduate': 'Post Graduate jobs',
            'diploma': 'Diploma jobs'
        }[job.qualification];
        if (qualDisplay) suggestions.add(qualDisplay);
    });
    
    searchSuggestions = Array.from(suggestions);
}

// Current filter state
let currentFilters = {
    state: '',
    qualification: '',
    category: '',
    searchQuery: ''
};

// Load Jobs into sections
function loadJobs() {
    // Load by sections initially - Show 6 featured jobs
    loadJobSection('featuredJobs', jobsData.all.filter(j => j.section === 'featured' || j.tag === 'Hot').slice(0, 6));
    loadJobSection('northeastJobs', jobsData.all.filter(j => j.section === 'northeast').slice(0, 4));
    loadJobSection('allIndiaJobs', jobsData.all.filter(j => j.section === 'all-india').slice(0, 4));
    loadJobSection('closingSoonJobs', jobsData.all.filter(j => j.section === 'closing' || j.isUrgent));
}

function loadJobSection(sectionId, jobs) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    if (jobs.length === 0) {
        const hasActiveFilters = currentFilters.state || currentFilters.qualification || 
                                currentFilters.category || currentFilters.searchQuery;
        
        const emptyMessage = hasActiveFilters 
            ? `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: var(--primary);"></i>
                <h3 style="color: var(--dark); margin-bottom: 0.5rem;">No jobs found</h3>
                <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">Try adjusting your search or filters</p>
                <button onclick="resetFilters()" style="margin-right: 0.5rem; padding: 0.8rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-redo"></i> Clear All Filters
                </button>
                <button onclick="showAppModal()" style="padding: 0.8rem 2rem; background: var(--secondary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    <i class="fas fa-mobile-alt"></i> Browse All in App
                </button>
            </div>`
            : '';
        
        section.innerHTML = emptyMessage;
        return;
    }

    section.innerHTML = jobs.map(job => createJobCard(job)).join('');

    // Add click event to all job cards
    section.querySelectorAll('.job-card').forEach(card => {
        card.addEventListener('click', () => showJobModal());
    });
}

function createJobCard(job) {
    const tagClass = job.isUrgent ? 'urgent' : (job.tag === 'Northeast' ? 'northeast' : '');
    const stateDisplay = job.state === 'all-india' ? 'All India' : 
                        job.state.charAt(0).toUpperCase() + job.state.slice(1).replace('-', ' ');
    const qualDisplay = {
        '10th': '10th Pass',
        '12th': '12th Pass',
        'graduate': 'Graduate',
        'postgraduate': 'Post Graduate',
        'diploma': 'Diploma'
    }[job.qualification] || job.qualification;
    
    // Format last date
    let lastDateDisplay = job.lastDate;
    if (job.lastDate && job.lastDate.includes('-')) {
        const date = new Date(job.lastDate);
        lastDateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Highlight search term in title if searching
    let displayTitle = job.title;
    if (currentFilters.searchQuery) {
        const regex = new RegExp(`(${currentFilters.searchQuery})`, 'gi');
        displayTitle = job.title.replace(regex, '<mark style="background: #fef08a; padding: 2px 4px; border-radius: 3px;">$1</mark>');
    }
    
    return `
        <div class="job-card" data-id="${job.id}">
            <div class="job-header">
                <span class="job-tag ${tagClass}">${job.tag || 'New'}</span>
            </div>
            <h3 class="job-title">${displayTitle}</h3>
            ${job.organization ? `<p style="color: var(--gray); font-size: 0.9rem; margin-bottom: 0.5rem;"><i class="fas fa-building"></i> ${job.organization}</p>` : ''}
            <div class="job-meta">
                <div class="job-meta-item">
                    <i class="fas fa-users"></i>
                    <span>${job.posts} Posts</span>
                </div>
                <div class="job-meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Last Date: ${lastDateDisplay}</span>
                </div>
                <div class="job-meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${stateDisplay}</span>
                </div>
                <div class="job-meta-item">
                    <i class="fas fa-graduation-cap"></i>
                    <span>${qualDisplay}</span>
                </div>
            </div>
            <div class="job-footer">
                <span class="locked-badge">
                    <i class="fas fa-lock"></i>
                    Details locked
                </span>
                <button class="view-details-btn" onclick="event.stopPropagation(); showJobModal();">View Details</button>
            </div>
        </div>
    `;
}

// Load MCQs
function loadMCQs() {
    const mcqContainer = document.getElementById('mcqContainer');
    if (!mcqContainer) return;

    mcqContainer.innerHTML = mcqsData.map(mcq => createMCQCard(mcq)).join('');
    
    // Add click handlers for MCQ options
    setupMCQHandlers();
}

function createMCQCard(mcq) {
    return `
        <div class="mcq-card" data-mcq-id="${mcq.id}">
            <div class="mcq-question">${mcq.question}</div>
            <div class="mcq-options">
                ${mcq.options.map((option, index) => `
                    <div class="mcq-option" data-mcq="${mcq.id}" data-option="${index}" data-correct="${mcq.correct}">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function setupMCQHandlers() {
    document.querySelectorAll('.mcq-option').forEach(option => {
        option.addEventListener('click', function() {
            const mcqId = this.getAttribute('data-mcq');
            const selectedOption = parseInt(this.getAttribute('data-option'));
            const correctOption = parseInt(this.getAttribute('data-correct'));
            
            // Get all options for this MCQ
            const allOptions = document.querySelectorAll(`.mcq-option[data-mcq="${mcqId}"]`);
            
            // Disable all options after selection
            allOptions.forEach(opt => opt.classList.add('disabled'));
            
            // Show correct answer
            allOptions[correctOption].classList.add('correct');
            
            // If wrong answer selected, show it as wrong
            if (selectedOption !== correctOption) {
                this.classList.add('wrong');
            }
        });
    });
}

// Search Functionality
function setupSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const searchSuggestionsEl = document.getElementById('searchSuggestions');
    const searchBtn = document.querySelector('.search-btn');

    if (!searchInput || !searchSuggestionsEl) return;

    searchInput.addEventListener('input', function(e) {
        const value = e.target.value.toLowerCase();
        
        if (value.length > 0) {
            const filtered = searchSuggestions.filter(s => 
                s.toLowerCase().includes(value)
            );
            
            if (filtered.length > 0) {
                searchSuggestionsEl.innerHTML = filtered.map(suggestion => `
                    <div class="suggestion-item">
                        <i class="fas fa-search"></i>
                        ${suggestion}
                    </div>
                `).join('');
                searchSuggestionsEl.classList.add('active');

                // Add click events to suggestions
                searchSuggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', function() {
                        searchInput.value = this.textContent.trim();
                        searchSuggestionsEl.classList.remove('active');
                        performSearch(searchInput.value);
                    });
                });
            } else {
                searchSuggestionsEl.classList.remove('active');
            }
        } else {
            searchSuggestionsEl.classList.remove('active');
        }
    });

    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performSearch(searchInput.value);
        });
    }

    // Search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSuggestionsEl.classList.remove('active');
            performSearch(searchInput.value);
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchSuggestionsEl.contains(e.target)) {
            searchSuggestionsEl.classList.remove('active');
        }
    });
}

function performSearch(query) {
    if (!query || query.trim() === '') {
        // If empty search, reset to show all jobs
        currentFilters.searchQuery = '';
        applyAllFilters();
        return;
    }
    
    currentFilters.searchQuery = query.toLowerCase().trim();
    applyAllFilters();
    
    setCookie("lastSearch", query, 7);  // Save last search for 7 days


    // Show search results indicator
    showSearchResults(query);
    
    // Scroll to results
    const firstSection = document.getElementById('featuredJobs');
    if (firstSection) {
        firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function showSearchResults(query) {
    // Count total matching jobs
    const matchingJobs = jobsData.all.filter(job => 
        job.title.toLowerCase().includes(currentFilters.searchQuery) ||
        (job.organization && job.organization.toLowerCase().includes(currentFilters.searchQuery)) ||
        job.category.toLowerCase().includes(currentFilters.searchQuery) ||
        job.state.toLowerCase().includes(currentFilters.searchQuery) ||
        job.qualification.toLowerCase().includes(currentFilters.searchQuery)
    );
    
    // Create or update search indicator
    let searchIndicator = document.getElementById('searchResultsIndicator');
    if (!searchIndicator) {
        searchIndicator = document.createElement('div');
        searchIndicator.id = 'searchResultsIndicator';
        searchIndicator.style.cssText = `
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            padding: 1rem 1rem;
            text-align: center;
            font-weight: 300;
            position: sticky;
            top: 70px;
            z-index: 999;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            margin-bottom: 2rem;
        `;
        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            statsSection.parentNode.insertBefore(searchIndicator, statsSection);
        }
    }
    
    searchIndicator.innerHTML = `
        <i class="fas fa-search"></i>
        Search Results for "<strong>${query}</strong>" - Found ${matchingJobs.length} jobs
        <button onclick="clearSearch()" style="margin-left: 1rem; background: white; color: var(--primary); border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-weight: 600;">
            <i class="fas fa-times"></i> Clear Search
        </button>
    `;
}

function clearSearch() {
    // Clear search input
    document.getElementById('searchInput').value = '';
    
    // Reset search filter
    currentFilters.searchQuery = '';
    
    // Remove search indicator
    const searchIndicator = document.getElementById('searchResultsIndicator');
    if (searchIndicator) {
        searchIndicator.remove();
    }
    
    // If no other filters, reload original jobs
    if (!currentFilters.state && !currentFilters.qualification && !currentFilters.category) {
        loadJobs();
    } else {
        applyAllFilters();
    }
}

// Filter Functionality
function setupFilterFunctionality() {
    const applyFiltersBtn = document.getElementById('applyFilters');
    const stateFilter = document.getElementById('stateFilter');
    const qualificationFilter = document.getElementById('qualificationFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!applyFiltersBtn) return;

    applyFiltersBtn.addEventListener('click', function() {
        currentFilters.state = stateFilter.value;
        currentFilters.qualification = qualificationFilter.value;
        currentFilters.category = categoryFilter.value;

        applyAllFilters();
        
        // Scroll to results
        const firstSection = document.getElementById('featuredJobs');
        if (firstSection) {
            firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // Real-time filtering on dropdown change
    [stateFilter, qualificationFilter, categoryFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', function() {
                currentFilters.state = stateFilter.value;
                currentFilters.qualification = qualificationFilter.value;
                currentFilters.category = categoryFilter.value;
                applyAllFilters();
            });
        }
    });
}

// Apply all active filters
function applyAllFilters() {
    let filteredJobs = jobsData.all;

    // Apply state filter
    if (currentFilters.state) {
        filteredJobs = filteredJobs.filter(job => job.state === currentFilters.state);
    }

    // Apply qualification filter
    if (currentFilters.qualification) {
        filteredJobs = filteredJobs.filter(job => job.qualification === currentFilters.qualification);
    }

    // Apply category filter
    if (currentFilters.category) {
        filteredJobs = filteredJobs.filter(job => job.category === currentFilters.category);
    }

    // Apply search query - Search across multiple fields
    if (currentFilters.searchQuery) {
        const searchTerm = currentFilters.searchQuery;
        filteredJobs = filteredJobs.filter(job => {
            const title = job.title.toLowerCase();
            const organization = (job.organization || '').toLowerCase();
            const category = job.category.toLowerCase();
            const state = job.state.toLowerCase();
            const qualification = job.qualification.toLowerCase();
            const ageLimit = (job.ageLimit || '').toLowerCase();
            const salary = (job.salary || '').toLowerCase();
            
            return title.includes(searchTerm) ||
                   organization.includes(searchTerm) ||
                   category.includes(searchTerm) ||
                   state.includes(searchTerm) ||
                   qualification.includes(searchTerm) ||
                   ageLimit.includes(searchTerm) ||
                   salary.includes(searchTerm);
        });
    }

    // Update all sections with filtered results
    updateAllSections(filteredJobs);

    // Show filter indicator
    showFilterIndicator();
}

function updateAllSections(filteredJobs) {
    // If no filters are active, show original sections
    if (!currentFilters.state && !currentFilters.qualification && !currentFilters.category && !currentFilters.searchQuery) {
        loadJobs();
        return;
    }

    // For search or filters, show all matching jobs across sections
    const maxJobsPerSection = 8; // Show more results when filtering
    
    // Show filtered results in all sections
    const featuredJobs = filteredJobs.filter(j => j.section === 'featured' || j.tag === 'Hot');
    const northeastJobs = filteredJobs.filter(j => j.section === 'northeast' || j.tag === 'Northeast');
    const allIndiaJobs = filteredJobs.filter(j => j.section === 'all-india' || j.state === 'all-india');
    const urgentJobs = filteredJobs.filter(j => j.isUrgent || j.tag === 'Urgent');
    
    // If we have search query, show all matching jobs in featured section
    if (currentFilters.searchQuery) {
        loadJobSection('featuredJobs', filteredJobs.slice(0, 12));
        loadJobSection('northeastJobs', northeastJobs.slice(0, maxJobsPerSection));
        loadJobSection('allIndiaJobs', allIndiaJobs.slice(0, maxJobsPerSection));
        loadJobSection('closingSoonJobs', urgentJobs.slice(0, maxJobsPerSection));
    } else {
        loadJobSection('featuredJobs', featuredJobs.slice(0, maxJobsPerSection));
        loadJobSection('northeastJobs', northeastJobs.slice(0, maxJobsPerSection));
        loadJobSection('allIndiaJobs', allIndiaJobs.slice(0, maxJobsPerSection));
        loadJobSection('closingSoonJobs', urgentJobs.slice(0, maxJobsPerSection));
    }
}

function showFilterIndicator() {
    const hasFilters = currentFilters.state || currentFilters.qualification || 
                       currentFilters.category || currentFilters.searchQuery;
    
    if (hasFilters) {
        let filterText = 'Showing filtered results: ';
        const filters = [];
        
        if (currentFilters.state) {
            const stateName = currentFilters.state === 'all-india' ? 'All India' : 
                            currentFilters.state.charAt(0).toUpperCase() + currentFilters.state.slice(1);
            filters.push(stateName);
        }
        if (currentFilters.qualification) {
            const qualMap = {
                '10th': '10th Pass',
                '12th': '12th Pass',
                'graduate': 'Graduate',
                'postgraduate': 'Post Graduate',
                'diploma': 'Diploma'
            };
            filters.push(qualMap[currentFilters.qualification] || currentFilters.qualification);
        }
        if (currentFilters.category) {
            filters.push(currentFilters.category.toUpperCase());
        }
        if (currentFilters.searchQuery) {
            filters.push(`"${currentFilters.searchQuery}"`);
        }
        
        filterText += filters.join(' + ');
        
        // Show indicator
        let indicator = document.getElementById('filterIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'filterIndicator';
            indicator.style.cssText = `
                background: linear-gradient(135deg, var(--secondary) 0%, #059669 100%);
                color: white;
                padding: 1rem 1rem;
                text-align: center;
                font-weight: 300;
                top: 70px;
                z-index: 999;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            `;
            const statsSection = document.querySelector('.stats-section');
            if (statsSection) {
                statsSection.parentNode.insertBefore(indicator, statsSection);
            }
        }
        indicator.innerHTML = `
            ${filterText}
            <button onclick="resetFilters()" style="margin-left: 1rem; background: white; color: var(--secondary); border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-weight: 600;">
                Clear All Filters
            </button>
        `;
    } else {
        const indicator = document.getElementById('filterIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

function resetFilters() {
    currentFilters = {
        state: '',
        qualification: '',
        category: '',
        searchQuery: ''
    };
    
    // Reset form elements
    document.getElementById('stateFilter').value = '';
    document.getElementById('qualificationFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    // Reload original jobs
    loadJobs();
    
    // Remove indicator
    const indicator = document.getElementById('filterIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Modal Functions
function showJobModal() {
    const modal = document.getElementById('jobModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('jobModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function downloadApp() {
    // In production, this would link to actual app stores
    alert('🎉 Redirecting to App Store...\n\nDownload Sarkari Ai app to:\n✓ View complete job details\n✓ Get instant notifications\n✓ Access unlimited MCQs\n✓ Join Northeast community');
    
    // Simulate app store redirect
    console.log('Redirecting to app store...');
}

function joinWhatsApp() {
    window.open("https://whatsapp.com/channel/0029VbBUDWZLtOj7bNUn3V0g", "_blank");
}


// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('jobModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Mobile menu functionality
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.querySelector('.nav-menu');

if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', function() {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '100%';
        navMenu.style.left = '0';
        navMenu.style.right = '0';
        navMenu.style.background = 'white';
        navMenu.style.padding = '1rem';
        navMenu.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Quick search shortcut - Press "/" to focus search
document.addEventListener('keydown', function(e) {
    // Check if "/" key is pressed and not in an input field
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    // Press ESC to clear search
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            clearSearch();
        }
        // Also close modal if open
        closeModal();
    }
});

// Add animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all job cards and sections
setTimeout(() => {
    document.querySelectorAll('.job-card, .mcq-card, .affair-card, .exam-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.5s ease-out';
        observer.observe(el);
    });
}, 100);

// Track user interactions for analytics
function trackEvent(eventName, data) {
    console.log('Event tracked:', eventName, data);
    // In production, send to analytics service
}

// Track button clicks
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function() {
        trackEvent('button_click', {
            button: this.textContent,
            timestamp: new Date().toISOString()
        });
    });
});

console.log('🎉 Sarkari Ai initialized successfully!');
console.log('📱 Total jobs loaded:', jobsData.all.length);
console.log('🔍 Search & filter system active!');
console.log('💡 Search Tips:');
console.log('   - Type job name: "Railway", "Police", "Banking"');
console.log('   - Search by state: "Nagaland", "Assam", "All India"');
console.log('   - Search by qualification: "10th", "Graduate"');
console.log('   - Press "/" key for quick search');
console.log('   - Press ESC to clear search');
console.log('   - Use filters for precise results');
//