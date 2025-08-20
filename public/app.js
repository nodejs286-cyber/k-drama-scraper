class KDramaAPI {
    constructor() {
        this.baseUrl = window.location.origin;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAPIInfo();
    }

    setupEventListeners() {
        // Search form
        document.getElementById('search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        // Recent form
        document.getElementById('recent-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRecent();
        });
    }

    async loadAPIInfo() {
        try {
            const response = await fetch(`${this.baseUrl}/api/`);
            const data = await response.json();
            
            if (data.success) {
                // Update API documentation examples
                document.getElementById('base-url').textContent = this.baseUrl;
                document.getElementById('search-example').textContent = data.endpoints.search.example;
                document.getElementById('recent-example').textContent = data.endpoints.recent.example;
                document.getElementById('details-example').textContent = data.endpoints.details.example;
            }
        } catch (error) {
            console.error('Failed to load API info:', error);
        }
    }

    async handleSearch() {
        const query = document.getElementById('search-query').value.trim();
        const source = document.getElementById('search-source').value;
        const page = document.getElementById('search-page').value;

        if (!query || query.length < 2) {
            this.showError('Please enter at least 2 characters to search.');
            return;
        }

        this.showLoading('search');
        
        try {
            const url = `${this.baseUrl}/api/search?q=${encodeURIComponent(query)}&page=${page}&source=${source}`;
            const response = await fetch(url);
            const data = await response.json();

            this.hideLoading('search');

            if (data.success) {
                this.displayResults('search', data);
            } else {
                this.showError(data.error || 'Failed to fetch search results');
            }
        } catch (error) {
            this.hideLoading('search');
            this.showError('Network error occurred while searching');
            console.error('Search error:', error);
        }
    }

    async handleRecent() {
        const source = document.getElementById('recent-source').value;
        const page = document.getElementById('recent-page').value;

        this.showLoading('recent');

        try {
            const url = `${this.baseUrl}/api/recent?page=${page}&source=${source}`;
            const response = await fetch(url);
            const data = await response.json();

            this.hideLoading('recent');

            if (data.success) {
                this.displayResults('recent', data);
            } else {
                this.showError(data.error || 'Failed to fetch recent dramas');
            }
        } catch (error) {
            this.hideLoading('recent');
            this.showError('Network error occurred while fetching recent dramas');
            console.error('Recent error:', error);
        }
    }

    displayResults(type, data) {
        const resultsContainer = document.getElementById(`${type}-results`);
        const resultsContent = document.getElementById(`${type}-results-content`);

        if (!data.data || data.data.length === 0) {
            resultsContent.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600">No dramas found. Try a different search term or source.</p>
                </div>
            `;
        } else {
            const dramasHTML = data.data.map(drama => this.createDramaCard(drama)).join('');
            
            resultsContent.innerHTML = `
                <div class="mb-4 flex justify-between items-center">
                    <p class="text-sm text-gray-600">
                        Found ${data.total} results on page ${data.page}
                        ${data.sources ? this.createSourcesInfo(data.sources) : ''}
                    </p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    ${dramasHTML}
                </div>
            `;
        }

        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    createDramaCard(drama) {
        const imageUrl = drama.image || 'https://via.placeholder.com/300x400/6366f1/ffffff?text=No+Image';
        const title = drama.title || 'Unknown Title';
        const episode = drama.episode ? `<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">${drama.episode}</span>` : '';
        const genre = drama.genre ? `<span class="text-xs text-gray-600">${drama.genre}</span>` : '';
        const status = drama.status ? `<span class="text-xs text-gray-600">${drama.status}</span>` : '';
        const source = drama.source ? `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${drama.source}</span>` : '';

        return `
            <div class="drama-card bg-white rounded-lg shadow-md overflow-hidden">
                <div class="relative">
                    <img src="${imageUrl}" alt="${title}" class="w-full h-64 object-cover" 
                         onerror="this.src='https://via.placeholder.com/300x400/6366f1/ffffff?text=No+Image'">
                    <div class="absolute top-2 right-2">
                        ${source}
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-gray-800 mb-2 line-clamp-2" title="${title}">${title}</h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${episode}
                        ${genre}
                        ${status}
                    </div>
                    ${drama.url ? `
                        <div class="flex space-x-2">
                            <a href="${drama.url}" target="_blank" rel="noopener noreferrer" 
                               class="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded text-center transition duration-200">
                                <i class="fas fa-external-link-alt mr-1"></i>Visit
                            </a>
                            <button onclick="app.getDetails('${drama.url}')" 
                                    class="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded transition duration-200">
                                <i class="fas fa-info-circle mr-1"></i>Details
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createSourcesInfo(sources) {
        const sourceStatus = Object.entries(sources).map(([source, info]) => {
            const icon = info.success ? 
                `<i class="fas fa-check-circle text-green-500"></i>` : 
                `<i class="fas fa-times-circle text-red-500"></i>`;
            const count = info.success ? ` (${info.count})` : '';
            return `${icon} ${source}${count}`;
        }).join(' ');

        return `<br><span class="text-xs">Sources: ${sourceStatus}</span>`;
    }

    async getDetails(url) {
        try {
            const detailsUrl = `${this.baseUrl}/api/details?url=${encodeURIComponent(url)}`;
            const response = await fetch(detailsUrl);
            const data = await response.json();

            if (data.success && data.data) {
                this.showDetailsModal(data.data);
            } else {
                this.showError('Failed to fetch drama details');
            }
        } catch (error) {
            this.showError('Network error occurred while fetching details');
            console.error('Details error:', error);
        }
    }

    showDetailsModal(details) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="text-2xl font-bold text-gray-800">${details.title || 'Drama Details'}</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    ${details.image ? `
                        <img src="${details.image}" alt="${details.title}" class="w-full h-64 object-cover rounded-lg mb-4"
                             onerror="this.style.display='none'">
                    ` : ''}
                    
                    <div class="space-y-3">
                        ${details.year ? `<p><strong>Year:</strong> ${details.year}</p>` : ''}
                        ${details.genres && details.genres.length ? `<p><strong>Genres:</strong> ${details.genres.join(', ')}</p>` : ''}
                        ${details.description ? `<p><strong>Description:</strong> ${details.description}</p>` : ''}
                        ${details.url ? `<p><strong>URL:</strong> <a href="${details.url}" target="_blank" class="text-purple-600 hover:underline">${details.url}</a></p>` : ''}
                        ${details.source ? `<p><strong>Source:</strong> ${details.source}</p>` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showLoading(type) {
        const button = document.querySelector(`#${type}-form button[type="submit"]`);
        const loading = button.querySelector('.loading');
        button.disabled = true;
        loading.classList.add('show');
    }

    hideLoading(type) {
        const button = document.querySelector(`#${type}-form button[type="submit"]`);
        const loading = button.querySelector('.loading');
        button.disabled = false;
        loading.classList.remove('show');
    }

    showError(message) {
        // Remove existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alert = document.createElement('div');
        alert.className = 'alert fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
        alert.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(alert);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

// Tab functionality
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-purple-600', 'border-b-2', 'border-purple-600');
        btn.classList.add('text-gray-500', 'hover:text-purple-600');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');

    // Add active class to clicked button
    const activeBtn = document.querySelector(`button[onclick="showTab('${tabName}')"]`);
    activeBtn.classList.remove('text-gray-500', 'hover:text-purple-600');
    activeBtn.classList.add('text-purple-600', 'border-b-2', 'border-purple-600');
}

// Initialize the app
const app = new KDramaAPI();