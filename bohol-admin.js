// --- Firebase Configuration (Placeholder for actual Firebase setup) ---
// Import Firebase SDKs from CDN for modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "boholsean-admin.firebaseapp.com",
  projectId: "boholsean-admin",
  storageBucket: "boholsean-admin.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (uncomment when config is real)
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
// const storage = getStorage(app);

// --- Web Components Definitions ---

// 1. Dashboard View
class DashboardView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Import global styles to apply inside shadow DOM if needed, or define specific ones */
        @import url('admin.css');
        
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .stat-card {
          background: var(--surface-color, #fff);
          padding: 1.5rem;
          border-radius: 16px;
          box-shadow: var(--shadow-card, 0 4px 6px rgba(0,0,0,0.1));
          border: 1px solid var(--border-color, #eee);
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: var(--primary-light, #e6f7f3);
          color: var(--primary-color, #00b48a);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon span { font-size: 24px; }
        .stat-details h3 { margin: 0; font-size: 0.875rem; color: var(--text-muted, #666); }
        .stat-details p { margin: 0; font-size: 1.5rem; font-weight: bold; color: var(--text-main, #333); }
      </style>
      <div class="dashboard-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <span class="material-symbols-outlined" style="font-family: 'Material Symbols Outlined'">book_online</span>
          </div>
          <div class="stat-details">
            <h3>New Bookings Today</h3>
            <p>12</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <span class="material-symbols-outlined" style="font-family: 'Material Symbols Outlined'">check_circle</span>
          </div>
          <div class="stat-details">
            <h3>Confirmed This Week</h3>
            <p>45</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <span class="material-symbols-outlined" style="font-family: 'Material Symbols Outlined'">payments</span>
          </div>
          <div class="stat-details">
            <h3>Pending Payments</h3>
            <p>8</p>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 2rem;">
        <div class="card" style="background: var(--surface-color, #fff); padding: 1.5rem; border-radius: 16px; box-shadow: var(--shadow-card, 0 4px 6px rgba(0,0,0,0.1));">
          <h3>Upcoming Schedules</h3>
          <p style="color: var(--text-muted, #666); margin-bottom: 1rem;">Tours and activities for the next 3 days.</p>
          <!-- Placeholder for schedule list -->
          <ul style="list-style: none; padding: 0; margin: 0;">
             <li style="padding: 1rem 0; border-bottom: 1px solid var(--border-color, #eee); display: flex; justify-content: space-between;">
               <span><strong>Balicasag Island Hopping</strong> - 4 Pax (John Doe)</span>
               <span style="color: var(--text-muted, #666);">Tomorrow, 08:00 AM</span>
             </li>
             <li style="padding: 1rem 0; border-bottom: 1px solid var(--border-color, #eee); display: flex; justify-content: space-between;">
               <span><strong>Chocolate Hills Tour</strong> - 2 Pax (Jane Smith)</span>
               <span style="color: var(--text-muted, #666);">May 15, 09:00 AM</span>
             </li>
          </ul>
        </div>
      </div>
    `;
  }
}
customElements.define('dashboard-view', DashboardView);

// 2. Reservations View
class ReservationsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('admin.css');
        .controls { display: flex; justify-content: space-between; margin-bottom: 1rem; }
        .search-input { padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border-color); }
      </style>
      <div class="card">
        <div class="controls">
          <input type="text" class="search-input" placeholder="Search reservations...">
          <button class="btn btn-primary">
            <span class="material-symbols-outlined" style="font-family: 'Material Symbols Outlined'; font-size: 18px;">filter_list</span>
            Filter
          </button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Name</th>
                <th>Tour/Hotel</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#RES-1001</td>
                <td>John Doe</td>
                <td>Balicasag Island Hopping</td>
                <td>2024-05-14</td>
                <td><span class="badge badge-warning">Pending</span></td>
                <td>
                  <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Confirm</button>
                </td>
              </tr>
              <tr>
                <td>#RES-1002</td>
                <td>Jane Smith</td>
                <td>Henann Resort Bohol (3 Nights)</td>
                <td>2024-05-20</td>
                <td><span class="badge badge-success">Confirmed</span></td>
                <td>
                  <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}
customElements.define('reservations-view', ReservationsView);

// 3. Products View
class ProductsView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('admin.css');
        .header-actions { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .product-card { padding: 1rem; border: 1px solid var(--border-color); border-radius: 12px; display: flex; flex-direction: column; gap: 0.5rem;}
        .product-img { width: 100%; height: 120px; background-color: #e2e8f0; border-radius: 8px; object-fit: cover; }
      </style>
      <div class="header-actions">
        <button class="btn btn-primary">
          <span class="material-symbols-outlined" style="font-family: 'Material Symbols Outlined'; font-size: 18px;">add</span>
          Add New Product
        </button>
      </div>
      <div class="card">
        <div class="product-grid">
          <div class="product-card">
            <div class="product-img" style="background: linear-gradient(45deg, var(--primary-light), var(--primary-color)); display: flex; align-items:center; justify-content:center; color: white;">
              <span class="material-symbols-outlined" style="font-family: 'Material Symbols Outlined'; font-size: 36px;">sailing</span>
            </div>
            <h3 style="margin-top:0.5rem; font-size: 1rem;">Balicasag Island Hopping</h3>
            <p style="font-size: 0.8rem;">Full day tour with lunch included.</p>
            <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
              <strong>$50 / pax</strong>
              <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Edit</button>
            </div>
          </div>
          <div class="product-card">
            <div class="product-img" style="background: linear-gradient(45deg, #fef3c7, #f59e0b); display: flex; align-items:center; justify-content:center; color: white;">
               <span class="material-symbols-outlined" style="font-family: 'Material Symbols Outlined'; font-size: 36px;">hotel</span>
            </div>
            <h3 style="margin-top:0.5rem; font-size: 1rem;">Henann Resort Bohol</h3>
            <p style="font-size: 0.8rem;">Premier room, 1 night stay.</p>
            <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
              <strong>$150 / night</strong>
              <button class="btn btn-outline" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Edit</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('products-view', ProductsView);

// 4. Vouchers View
class VouchersView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        @import url('admin.css');
        .voucher-container { display: flex; gap: 2rem; flex-wrap: wrap; }
        .voucher-form { flex: 1; min-width: 300px; }
        .voucher-preview { flex: 1; min-width: 300px; background: #fff; padding: 2rem; border: 1px dashed var(--primary-color); border-radius: 8px; text-align: center; }
      </style>
      <div class="card">
        <h2>Voucher Generator</h2>
        <p style="margin-bottom: 1.5rem;">Generate and download PDF vouchers for confirmed bookings.</p>
        
        <div class="voucher-container">
          <div class="voucher-form">
            <div class="form-group">
              <label class="form-label">Reservation ID</label>
              <input type="text" class="form-input" placeholder="e.g. #RES-1002">
            </div>
            <div class="form-group">
              <label class="form-label">Customer Name</label>
              <input type="text" class="form-input" placeholder="Customer Name">
            </div>
            <div class="form-group">
              <label class="form-label">Service Details</label>
              <input type="text" class="form-input" placeholder="Service description">
            </div>
            <button class="btn btn-primary" style="width: 100%;">Generate Voucher</button>
          </div>
          
          <div class="voucher-preview">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">BOHOL SEAN</h3>
            <h4 style="margin-bottom: 1rem;">TOUR VOUCHER</h4>
            <div style="text-align: left; background: var(--bg-color); padding: 1rem; border-radius: 8px; font-size: 0.875rem;">
              <p><strong>Name:</strong> <span id="prev-name">Jane Smith</span></p>
              <p><strong>Service:</strong> <span id="prev-service">Henann Resort Bohol (3 Nights)</span></p>
              <p><strong>Date:</strong> <span>2024-05-20</span></p>
            </div>
            <button class="btn btn-outline" style="margin-top: 1rem;">
               <span class="material-symbols-outlined" style="font-family: 'Material Symbols Outlined'; font-size: 18px;">download</span>
               Download PDF
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('vouchers-view', VouchersView);

// --- App Logic & Routing ---
document.addEventListener('DOMContentLoaded', () => {
  const viewContainer = document.getElementById('view-container');
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  const titles = {
    'dashboard': { title: 'Dashboard', sub: 'Overview of your daily operations.' },
    'reservations': { title: 'Reservations', sub: 'Manage tour and hotel bookings.' },
    'products': { title: 'Products', sub: 'Manage your tour courses and accommodations.' },
    'vouchers': { title: 'Vouchers', sub: 'Generate and download booking vouchers.' }
  };

  function switchView(viewName) {
    // Update Active Nav
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${viewName}"]`)?.classList.add('active');

    // Update Header
    if (titles[viewName]) {
      pageTitle.textContent = titles[viewName].title;
      pageSubtitle.textContent = titles[viewName].sub;
    }

    // Update Content
    viewContainer.innerHTML = `<${viewName}-view></${viewName}-view>`;
  }

  // Add click listeners to nav items
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = e.currentTarget.getAttribute('data-view');
      switchView(view);
    });
  });
});
