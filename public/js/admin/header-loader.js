/**
 * Brooklyn Barbearia - Admin Header Loader
 * Loads and initializes header navigation
 * Used across all admin pages
 */

function loadAdminHeader(activePage) {
    const headerContainer = document.getElementById('headerContainer');
    if (!headerContainer) return;

    fetch('/admin/header.html')
        .then(response => response.text())
        .then(html => {
            headerContainer.innerHTML = html;
            
            // Mark active navigation item
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-view') === activePage) {
                    item.classList.add('active');
                }
            });

            console.log(`✅ Header loaded and ${activePage} marked as active`);
        })
        .catch(error => console.error('❌ Error loading header:', error));
}

// Auto-load on DOMContentLoaded if data-page attribute exists
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const pageAttr = document.body.getAttribute('data-page');
        if (pageAttr) {
            loadAdminHeader(pageAttr);
        }
    });
} else {
    const pageAttr = document.body.getAttribute('data-page');
    if (pageAttr) {
        loadAdminHeader(pageAttr);
    }
}
