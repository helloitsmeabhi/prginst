// Close Button
document.getElementById("closeBtn").addEventListener("click", (e) => {
    e.preventDefault();
    window.electronAPI.closeApp(); // Securely call the close function
  });
  
  // Maximize Button
  document.getElementById("maxBtn").addEventListener("click", (e) => {
    e.preventDefault();
    window.electronAPI.maximizeApp(); // Securely call the maximize function
  });
  
  // Minimize Button
  document.getElementById("minBtn").addEventListener("click", (e) => {
    e.preventDefault();
    window.electronAPI.minimizeApp(); // Securely call the minimize function
  });
  //Navaigation Bar
  document.getElementById("navbar").addEventListener("dblclick", () => {
    window.electronAPI.maximizeApp(); // Toggle maximize/restore
  });
  //Install Scoop
  document.getElementById('run-command').addEventListener('click', async () => {
        await window.electronAPI.runPowershellCommand();
   
});
// renderer.js (Main Window)
// Generic handler for all language buttons
function setupLanguageButton(languageId) {
  document.getElementById(languageId).addEventListener('click', async () => {
      try {
          await window.electronAPI.openCommandDialog();
          await window.electronAPI.runCommand(languageId);
      } catch (error) {
          console.error(`Error executing ${languageId}:`, error);
      }
  });
}
const languages = [
  'go', 'cppc', 'cs', 'java', 'python', 'node',
  'vsc', 'vs', 'eclipse', 'pycharm', 'arduino',
  'android', 'mysql', 'mongo', 'postgre', 'maria',
  'fire', 'nosql', 'django', 'dotnet', 'react',
  'electronjs', 'spring', 'flask'
];
// Initialize all language buttons
languages.forEach(lang => {
  if (document.getElementById(lang)) {
      setupLanguageButton(lang);
  }
});
//Search Bar
document.addEventListener('DOMContentLoaded', function () {
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const searchResults = document.getElementById('searchResults');

  async function performSearch() {
      const query = searchInput.value.trim();
      if (!query) {
          searchResults.classList.add('d-none');
          searchResults.innerHTML = '';
          return;
      }

      searchResults.classList.remove('d-none');
      searchResults.innerHTML = '<div class="spinner" id="spinner"><div></div><div></div><div></div><div></div><div></div><div></div></div>';

      try {
          // Fix 1: Ensure IPC channel name matches ('scoop-search' instead of 'search-scoop')
          const results = await window.electronAPI.search(query);

          if (!results || results.length === 0) {
              searchResults.innerHTML = '<div class="text-center py-3">No results found</div>';
              return;
          }

          // Fix 2: Omit the first two rows of the results (header rows)
          const filteredResults = results.slice(2); // Skip the first two rows

          // Fix 3: Add null checks and default values
          let tableRows = filteredResults.map(item => `
              <tr>
                  <td>${item.name || ''}</td>
                  <td>${item.version || ''}</td>
                  <td>${item.source || ''}</td>
                  <td>${item.binaries || ''}</td>
                  <td>
                  <button class="btn btn-sm btn-primary install-btn" data-name="${item.name}" id="${item.name}">
                    Install
                  </button>
                </td>
              </tr>
          `).join('');
          searchResults.addEventListener('click', async(event) => {
            if (event.target.classList.contains('install-btn')) {
              const packageName = event.target.dataset.name;
              try{
                await window.electronAPI.openCommandDialog();
                await window.electronAPI.install(packageName);
                
              } catch (error) {
                console.error(`Error executing ${packageName}:`, error);
            }
            }
          });
          // Fix 4: Proper HTML structure with error handling
          const resultsHTML = tableRows 
              ? `<div class="card shadow" style="background-color:rgba(0, 21, 255, 0.242);">
                      <div class="card-body">
                          <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px;">
                              <table class="table table-striped">
                                  <thead class="table-dark">
                                      <tr>
                                          <th>Name</th>
                                          <th>Version</th>
                                          <th>Source</th>
                                          <th>Binaries</th>
                                          <th>Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody>${tableRows}</tbody>
                              </table>
                          </div>
                          
                      </div>
                   </div>`
              : '<div class="text-center py-3">No valid results found</div>';

          // Ensure the results are properly set
          searchResults.innerHTML = resultsHTML;

      } catch (error) {
          console.error('Search error:', error);
          searchResults.innerHTML = '<div class="text-center py-3 text-danger">Error fetching results</div>';
      }
  }

  // Fix 5: Add input field enter key support
  searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
  });
  searchButton.addEventListener('click', performSearch);
});

