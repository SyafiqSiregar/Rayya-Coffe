import { RAYA_LOGO_DARK, RAYA_LOGO_BLACK } from './logo-data.js';
import { connectBluetoothPrinter, printDirectBluetooth, printViaRawBtIntent } from './thermal-printer.js';
import { saveFileToLocalDevice } from './local-file-saver.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Initialize Lucide icons
lucide.createIcons();

// --- Toast Notifications ---
window.showToast = function(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'alert-circle';
  toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => { 
    toast.remove(); 
  }, 2400);
};

// Format Currency Utility
const formatRp = (num) => `Rp ${(num || 0).toLocaleString('id-ID')}`;

// Format Date
const todayStr = new Date().toLocaleDateString('id-ID', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});
const todayEl = document.getElementById('current-date');
if (todayEl) todayEl.textContent = todayStr;

// --- Persistent Database & Local Storage Layer ---
const STORAGE_KEYS = {
  HISTORY: 'raya_pos_history_v2',
  PRODUCTS: 'raya_pos_products_v1',
  EXPENSES: 'raya_pos_expenses_v2',
  TAXES: 'raya_pos_taxes_v1',
  USERS: 'raya_pos_users_v1',
  SESSION: 'raya_pos_session_v1',
  CLEAN_INITIAL: 'raya_pos_clean_slate_v2'
};

// Automatic cleanup of legacy trial data so production starts 100% clean
try {
  if (!localStorage.getItem(STORAGE_KEYS.CLEAN_INITIAL)) {
    localStorage.removeItem('raya_pos_history_v1');
    localStorage.removeItem('raya_pos_expenses_v1');
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLEAN_INITIAL, 'true');
  }
} catch (e) {}

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Gagal membaca database lokal:', key, err);
  }
  return fallback;
}

function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Gagal menyimpan ke database lokal:', key, err);
  }
}

// Default Data Seed (jika database lokal belum ada data)
const defaultProducts = [
  { id: 1, name: 'Kopi Susu Gula Aren', price: 18000, category: 'KAFE' },
  { id: 2, name: 'Caffe Latte', price: 22000, category: 'KAFE' },
  { id: 3, name: 'Americano', price: 15000, category: 'KAFE' },
  { id: 4, name: 'Matcha Latte', price: 24000, category: 'KAFE' },
  { id: 5, name: 'Butter Croissant', price: 20000, category: 'KAFE' },
  { id: 6, name: 'Cuci Mobil Hidrolik', price: 50000, category: 'CUCI' },
  { id: 7, name: 'Cuci Motor Premium', price: 25000, category: 'CUCI' },
  { id: 8, name: 'Wax Interior Mobil', price: 100000, category: 'CUCI' },
];

const defaultHistory = [];

function normalizeExpense(e) {
  const todayIso = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('id-ID');
  const fund = e.fundSource || 'KASIR';
  return {
    id: e.id ? String(e.id) : ('EXP-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
    desc: e.desc || 'Pengeluaran Operasional',
    amount: Math.max(0, parseInt(e.amount, 10) || 0),
    category: e.category || (e.desc && e.desc.toLowerCase().includes('shampoo') ? 'CUCI' : 'KAFE'),
    fundSource: fund,
    employeeName: e.employeeName || (fund === 'KARYAWAN' ? 'Karyawan' : ''),
    reimbursementStatus: e.reimbursementStatus || (fund === 'KARYAWAN' ? 'PENDING' : 'SETTLED'),
    reimbursedAt: e.reimbursedAt || '',
    date: e.date || todayFormatted,
    isoDate: e.isoDate || todayIso,
    timestamp: e.timestamp || Date.now()
  };
}

const todayIso = new Date().toISOString().split('T')[0];
const todayFormatted = new Date().toLocaleDateString('id-ID');

const defaultExpenses = [];

const defaultTaxes = [
  { id: 1, name: 'Pajak PB1 Resto', pct: 11, active: true },
  { id: 2, name: 'Service Charge', pct: 5, active: false }
];

const defaultUsers = [
  {
    id: 'USR-1',
    name: 'Admin Utama',
    username: 'admin',
    pin: 'admin',
    role: 'ADMIN',
    phone: '081234567890',
    status: 'ACTIVE',
    createdAt: '01/10/2026'
  },
  {
    id: 'USR-2',
    name: 'Budi Santoso',
    username: 'kasir',
    pin: 'kasir',
    role: 'KASIR',
    phone: '085678912345',
    status: 'ACTIVE',
    createdAt: '02/10/2026'
  },
  {
    id: 'USR-3',
    name: 'Siti Rahma',
    username: 'siti',
    pin: '1234',
    role: 'KASIR',
    phone: '087812345678',
    status: 'ACTIVE',
    createdAt: '02/10/2026'
  }
];

// Persistent State Instances
let products = loadStorage(STORAGE_KEYS.PRODUCTS, defaultProducts);
let history = loadStorage(STORAGE_KEYS.HISTORY, defaultHistory);
let expenses = loadStorage(STORAGE_KEYS.EXPENSES, defaultExpenses).map(normalizeExpense);
let taxes = loadStorage(STORAGE_KEYS.TAXES, defaultTaxes);
let users = loadStorage(STORAGE_KEYS.USERS, defaultUsers);

// Ensure default admin & cashier accounts are always guaranteed to exist initially
if (!users || !Array.isArray(users) || users.length === 0) {
  users = JSON.parse(JSON.stringify(defaultUsers));
  saveStorage(STORAGE_KEYS.USERS, users);
} else {
  const hasAdmin = users.some(u => u.username && u.username.toLowerCase() === 'admin');
  if (!hasAdmin) {
    users.unshift({
      id: 'USR-1',
      name: 'Admin Utama',
      username: 'admin',
      pin: 'admin',
      role: 'ADMIN',
      phone: '081234567890',
      status: 'ACTIVE',
      createdAt: '01/10/2026'
    });
    saveStorage(STORAGE_KEYS.USERS, users);
  }
}

let currentUser = loadStorage(STORAGE_KEYS.SESSION, null);

let currentExpenseFilter = 'ALL'; // ALL, KASIR, PENDING, SETTLED
let editingExpenseId = null;

// Storage helper functions
function saveHistory() { saveStorage(STORAGE_KEYS.HISTORY, history); }
function saveProducts() { saveStorage(STORAGE_KEYS.PRODUCTS, products); }
function saveExpenses() { saveStorage(STORAGE_KEYS.EXPENSES, expenses); }
function saveTaxes() { saveStorage(STORAGE_KEYS.TAXES, taxes); }
function saveUsers() { saveStorage(STORAGE_KEYS.USERS, users); }

// Generate Monotonically Increasing TRX ID
function generateNextTrxId() {
  let maxNum = 1000;
  history.forEach(t => {
    if (t.id) {
      const match = t.id.match(/TRX-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  return 'TRX-' + (maxNum + 1);
}

let cart = [];
let currentOrderType = 'DINE_IN'; // DINE_IN, TAKE_AWAY, CARWASH
let currentDiscountType = 'NOMINAL';
let currentDiscountVal = 0;

// DOM Elements
const posGrid = document.getElementById('pos-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartDiscountEl = document.getElementById('cart-discount');
const cartTaxEl = document.getElementById('cart-tax');
const cartTotalEl = document.getElementById('cart-total');
const searchInput = document.getElementById('pos-search');
const filterBtns = document.querySelectorAll('.filter-btn');
const navItems = document.querySelectorAll('.nav-item[data-target]');
const pageViews = document.querySelectorAll('.page-view');
const drawerMenu = document.getElementById('drawer-menu');
const orderRefInput = document.getElementById('order-reference');

// --- Auth / Login Logic with Role-Based Access ---
function applyUserSession(user) {
  currentUser = user;
  saveStorage(STORAGE_KEYS.SESSION, user);

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-app').style.display = 'flex';
  
  const roleEl = document.getElementById('current-user-role');
  if (roleEl) {
    roleEl.innerHTML = `${user.name} <br><small style="font-weight:600; font-size:11px; color:${user.role === 'ADMIN' ? 'var(--primary)' : 'var(--success)'};">${user.role === 'ADMIN' ? 'Administrator' : 'Kasir Toko'}</small>`;
  }

  if (user.role === 'KASIR') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    const activeNav = document.querySelector('.nav-item.active');
    if (!activeNav || activeNav.classList.contains('admin-only')) {
      const posNav = document.querySelector('.nav-item[data-target="pos"]');
      if (posNav) posNav.click();
    }
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
  }
}

function handleLogin() {
  const usernameInput = document.getElementById('login-user').value.trim().toLowerCase();
  const passwordInput = document.getElementById('login-pass').value.trim();

  if (!usernameInput) {
    showToast('Masukkan username Anda!', 'error');
    return;
  }

  let foundUser = users.find(u => u.username && u.username.toLowerCase() === usernameInput);

  // Auto-restore default admin account if username is admin
  if (!foundUser && usernameInput === 'admin') {
    foundUser = {
      id: 'USR-1',
      name: 'Admin Utama',
      username: 'admin',
      pin: 'admin',
      role: 'ADMIN',
      phone: '081234567890',
      status: 'ACTIVE',
      createdAt: '01/10/2026'
    };
    users.unshift(foundUser);
    saveUsers();
  }

  if (!foundUser) {
    showToast('Username tidak ditemukan di sistem!', 'error');
    return;
  }

  if (foundUser.status === 'INACTIVE') {
    showToast('Akun ini dinonaktifkan. Hubungi Administrator.', 'error');
    return;
  }

  // Validasi password/PIN
  const expectedPin = (foundUser.pin !== undefined && foundUser.pin !== null && foundUser.pin !== '') 
    ? String(foundUser.pin) 
    : (foundUser.username === 'admin' ? 'admin' : (foundUser.username === 'kasir' ? 'kasir' : ''));

  if (expectedPin && passwordInput !== expectedPin) {
    showToast('Password / PIN salah!', 'error');
    return;
  }

  applyUserSession(foundUser);
  showToast(`Selamat datang, ${foundUser.name}! (${foundUser.role === 'ADMIN' ? 'Admin' : 'Kasir'})`, 'success');
}

document.getElementById('btn-login').addEventListener('click', handleLogin);
document.getElementById('login-pass')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});
document.getElementById('login-user')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});

document.getElementById('btn-logout').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  document.getElementById('main-app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  showToast('Anda telah keluar dari sistem', 'info');
});

// Check existing session on load
if (currentUser && currentUser.username) {
  const freshUser = users.find(u => u.id === currentUser.id || u.username === currentUser.username);
  if (freshUser && freshUser.status === 'ACTIVE') {
    applyUserSession(freshUser);
  } else {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
}

// --- Drawer Toggle ---
document.getElementById('btn-menu-toggle').addEventListener('click', () => {
  drawerMenu.classList.add('show');
});
document.getElementById('btn-close-drawer').addEventListener('click', () => {
  drawerMenu.classList.remove('show');
});
drawerMenu.addEventListener('click', (e) => {
  if (e.target === drawerMenu) drawerMenu.classList.remove('show');
});

// --- Navigation ---
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    const target = e.currentTarget.dataset.target;
    if (!target) return;
    
    navItems.forEach(n => n.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    pageViews.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(target);
    if (targetPage) targetPage.classList.add('active');

    if (target === 'users') {
      renderUsers();
    } else if (target === 'expense') {
      renderExpense();
    } else if (target === 'reports') {
      renderReports();
    } else if (target === 'dashboard') {
      updateDashboardStats();
    }
    
    drawerMenu.classList.remove('show');
  });
});

// --- Order Type Selector for Tablets ---
document.querySelectorAll('.order-type-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentOrderType = e.currentTarget.dataset.type;
    
    if (currentOrderType === 'DINE_IN') orderRefInput.placeholder = 'No. Meja...';
    else if (currentOrderType === 'TAKE_AWAY') orderRefInput.placeholder = 'Nama Pelanggan...';
    else if (currentOrderType === 'CARWASH') orderRefInput.placeholder = 'Plat Nomor Kendaraan...';
  });
});

// --------------------------------------------------
// POS Logic & Rendering
// --------------------------------------------------
function renderPOS(filter = 'all', search = '') {
  posGrid.innerHTML = '';
  
  const filtered = products.filter(p => {
    const matchCat = filter === 'all' || p.category === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    posGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
        <p style="font-size: 13px;">Tidak ada menu yang sesuai dengan pencarian.</p>
      </div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'pos-card';
    card.onclick = () => addToCart(p.id);
    card.innerHTML = `
      <div class="pos-card-header">
        <span class="category-tag ${p.category}">${p.category}</span>
      </div>
      <div>
        <div class="pos-card-title">${p.name}</div>
        <div class="pos-card-price">${formatRp(p.price)}</div>
      </div>
    `;
    posGrid.appendChild(card);
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    filterBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderPOS(e.target.dataset.filter, searchInput.value);
  });
});

searchInput.addEventListener('input', (e) => {
  const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
  renderPOS(activeFilter, e.target.value);
});

// --------------------------------------------------
// Cart Logic
// --------------------------------------------------
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1, notes: '' });
  }
  updateCart();
}

window.openNotes = (id) => {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  document.getElementById('input-notes-id').value = id;
  document.getElementById('input-notes-text').value = item.notes || '';
  document.getElementById('modal-notes').classList.add('show');
};

document.getElementById('btn-save-notes').addEventListener('click', () => {
  const id = parseInt(document.getElementById('input-notes-id').value);
  const text = document.getElementById('input-notes-text').value.trim();
  const item = cart.find(c => c.id === id);
  if (item) item.notes = text;
  document.getElementById('modal-notes').classList.remove('show');
  updateCart();
});

function updateCartQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }
  updateCart();
}

function updateCart() {
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="shopping-bag"></i>
        <p>Pesanan masih kosong</p>
      </div>`;
    lucide.createIcons();
    cartSubtotalEl.textContent = formatRp(0);
    if (cartDiscountEl) cartDiscountEl.textContent = '-Rp 0';
    if (cartTaxEl) cartTaxEl.textContent = formatRp(0);
    cartTotalEl.textContent = formatRp(0);
    return;
  }

  let subtotal = 0;
  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatRp(item.price)} × ${item.qty} = <strong>${formatRp(itemTotal)}</strong></div>
        ${item.notes ? `<div class="cart-item-notes">📝 ${item.notes}</div>` : ''}
      </div>
      <div class="cart-item-controls">
        <button class="btn-qty" onclick="openNotes(${item.id})" title="Catatan"><i data-lucide="edit-2" style="width:14px;height:14px;"></i></button>
        <button class="btn-qty" onclick="updateCartQty(${item.id}, -1)"><i data-lucide="minus" style="width:14px;height:14px;"></i></button>
        <span class="qty-val">${item.qty}</span>
        <button class="btn-qty" onclick="updateCartQty(${item.id}, 1)"><i data-lucide="plus" style="width:14px;height:14px;"></i></button>
      </div>
    `;
    cartItemsContainer.appendChild(div);
  });
  lucide.createIcons();
  
  // Calculate Discount
  let discountNominal = 0;
  if (currentDiscountType === 'PERCENT') {
    discountNominal = subtotal * (currentDiscountVal / 100);
  } else {
    discountNominal = currentDiscountVal;
  }
  if (discountNominal > subtotal) discountNominal = subtotal;

  const afterDiscount = subtotal - discountNominal;
  
  // Calculate Active Taxes
  let totalTaxPct = taxes.filter(t => t.active).reduce((sum, t) => sum + t.pct, 0);
  const taxNominal = Math.round(afterDiscount * (totalTaxPct / 100));
  const grandTotal = Math.round(afterDiscount + taxNominal);
  
  cartSubtotalEl.textContent = formatRp(subtotal);
  if (cartDiscountEl) cartDiscountEl.textContent = '-Rp ' + discountNominal.toLocaleString('id-ID');
  if (cartTaxEl) cartTaxEl.textContent = formatRp(taxNominal);
  cartTotalEl.textContent = formatRp(grandTotal);
}

document.getElementById('btn-apply-discount').addEventListener('click', () => {
  currentDiscountType = document.getElementById('input-disc-type').value;
  currentDiscountVal = parseFloat(document.getElementById('input-disc-val').value) || 0;
  document.getElementById('modal-discount').classList.remove('show');
  updateCart();
});

document.getElementById('btn-clear-cart').addEventListener('click', () => {
  if (cart.length > 0) {
    cart = [];
    currentDiscountVal = 0;
    orderRefInput.value = '';
    updateCart();
    showToast('Pesanan direset', 'info');
  }
});

// --------------------------------------------------
// Checkout & Payment Logic (Tablet Touch Numpad)
// --------------------------------------------------
let currentTotal = 0;
let paymentMethod = 'TUNAI';
let cashInputValue = '';

document.getElementById('btn-checkout').addEventListener('click', () => {
  if (cart.length === 0) return showToast('Pilih menu terlebih dahulu!', 'error');
  
  const totalStr = document.getElementById('cart-total').textContent.replace(/[Rp\s.]/g, '');
  currentTotal = parseInt(totalStr) || 0;
  
  document.getElementById('payment-total-amount').textContent = formatRp(currentTotal);
  
  paymentMethod = 'TUNAI';
  document.querySelectorAll('.pay-method').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.pay-method[data-method="TUNAI"]').classList.add('active');
  document.getElementById('cash-input-section').style.display = 'block';
  
  cashInputValue = currentTotal.toString();
  updateCashDisplay();
  renderQuickCashOptions(currentTotal);
  
  document.getElementById('modal-payment').classList.add('show');
  lucide.createIcons();
});

// Tablet On-Screen Keypad Functions
window.appendNumpad = function(val) {
  if (cashInputValue === '0' || cashInputValue === currentTotal.toString()) {
    cashInputValue = val;
  } else {
    cashInputValue += val;
  }
  updateCashDisplay();
};

window.clearNumpad = function() {
  cashInputValue = '0';
  updateCashDisplay();
};

window.backspaceNumpad = function() {
  cashInputValue = cashInputValue.slice(0, -1);
  if (cashInputValue === '') cashInputValue = '0';
  updateCashDisplay();
};

window.setExactCash = function() {
  cashInputValue = currentTotal.toString();
  updateCashDisplay();
};

function updateCashDisplay() {
  const cashNum = parseInt(cashInputValue) || 0;
  document.getElementById('input-cash-amount').value = cashNum.toLocaleString('id-ID');
  
  const change = cashNum - currentTotal;
  const changeEl = document.getElementById('payment-change');
  if (change < 0) {
    changeEl.textContent = 'Kurang ' + formatRp(Math.abs(change));
    changeEl.style.color = 'var(--danger)';
  } else {
    changeEl.textContent = formatRp(change);
    changeEl.style.color = 'var(--text-main)';
  }
}

function renderQuickCashOptions(total) {
  const container = document.getElementById('quick-cash-container');
  container.innerHTML = '';
  
  const options = new Set();
  options.add(total);
  
  const denominations = [20000, 50000, 100000, 200000, 500000];
  const next50k = Math.ceil(total / 50000) * 50000;
  const next100k = Math.ceil(total / 100000) * 100000;
  
  if (next50k > total) options.add(next50k);
  if (next100k > total) options.add(next100k);
  denominations.forEach(d => {
    if (d > total && options.size < 4) options.add(d);
  });

  Array.from(options).sort((a, b) => a - b).forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'btn-quick-cash';
    btn.textContent = val === total ? 'Uang Pas' : formatRp(val);
    btn.onclick = () => {
      cashInputValue = val.toString();
      updateCashDisplay();
    };
    container.appendChild(btn);
  });
}

document.querySelectorAll('.pay-method').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    paymentMethod = e.currentTarget.dataset.method;
    document.getElementById('cash-input-section').style.display = paymentMethod === 'TUNAI' ? 'block' : 'none';
  });
});

document.getElementById('btn-confirm-payment').addEventListener('click', () => {
  let cash = 0;
  if (paymentMethod === 'TUNAI') {
    cash = parseInt(cashInputValue) || 0;
    if (cash < currentTotal) return showToast('Nominal pembayaran kurang!', 'error');
  } else {
    cash = currentTotal;
  }
  
  let typeText = 'Dine In';
  if (currentOrderType === 'TAKE_AWAY') typeText = 'Takeaway';
  if (currentOrderType === 'CARWASH') typeText = 'Carwash';
  
  const refText = orderRefInput.value.trim() || '-';

  // Subtotal & discount & tax
  const subtotalStr = document.getElementById('cart-subtotal').textContent.replace(/[Rp\s.]/g, '');
  const subtotal = parseInt(subtotalStr) || 0;
  const discountStr = document.getElementById('cart-discount').textContent.replace(/[-Rp\s.]/g, '');
  const discount = parseInt(discountStr) || 0;
  const taxStr = document.getElementById('cart-tax').textContent.replace(/[Rp\s.]/g, '');
  const tax = parseInt(taxStr) || 0;

  const cashierName = currentUser ? currentUser.name : 'Kasir Raya';
  const cashierId = currentUser ? currentUser.id : 'USR-1';

  const newTrx = {
    id: generateNextTrxId(),
    time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('id-ID'),
    isoDate: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    type: typeText,
    ref: refText,
    cashierName,
    cashierId,
    items: JSON.parse(JSON.stringify(cart)),
    subtotal,
    discount,
    tax,
    total: currentTotal,
    paid: cash,
    change: cash > currentTotal ? cash - currentTotal : 0,
    method: paymentMethod,
    status: 'Selesai'
  };
  
  history.unshift(newTrx);
  saveHistory(); // Simpan ke database lokal permanen
  
  updateDashboardStats();
  renderHistory();
  renderReports();
  
  document.getElementById('modal-payment').classList.remove('show');
  
  // Clear Active Cart
  cart = [];
  currentDiscountVal = 0;
  orderRefInput.value = '';
  updateCart();
  
  showToast(`Transaksi ${newTrx.id} Berhasil (${paymentMethod})`, 'success');
  
  // Auto-open thermal receipt preview
  openReceiptModal(newTrx);
});

// --------------------------------------------------
// Thermal Receipt Modal & Print
// --------------------------------------------------
window.currentReceiptTrx = null;
window.receiptPaperWidth = 32; // 32 chars for 58mm, 48 chars for 80mm

window.setReceiptPaperWidth = function(width) {
  window.receiptPaperWidth = width;
  const btn58 = document.getElementById('btn-paper-58');
  const btn80 = document.getElementById('btn-paper-80');
  if (btn58 && btn80) {
    if (width === 32) {
      btn58.style.background = 'var(--primary)';
      btn58.style.color = '#fff';
      btn58.style.borderColor = 'var(--primary)';
      btn80.style.background = 'var(--surface)';
      btn80.style.color = 'var(--text-main)';
      btn80.style.borderColor = 'var(--border-color)';
    } else {
      btn80.style.background = 'var(--primary)';
      btn80.style.color = '#fff';
      btn80.style.borderColor = 'var(--primary)';
      btn58.style.background = 'var(--surface)';
      btn58.style.color = 'var(--text-main)';
      btn58.style.borderColor = 'var(--border-color)';
    }
  }
};

window.handlePrintBluetooth = async function() {
  if (!window.currentReceiptTrx) {
    return showToast('Tidak ada transaksi aktif untuk dicetak', 'error');
  }
  try {
    showToast('Menghubungkan ke Printer Bluetooth...', 'info');
    await printDirectBluetooth(window.currentReceiptTrx, window.receiptPaperWidth);
    showToast('Struk berhasil dicetak ke printer thermal!', 'success');
  } catch (err) {
    console.warn('Direct Bluetooth print failed, suggesting RawBT:', err);
    showToast(err.message || 'Gagal cetak Bluetooth. Silakan gunakan opsi RawBT / POS.', 'error');
  }
};

window.handlePrintRawBt = function() {
  if (!window.currentReceiptTrx) {
    return showToast('Tidak ada transaksi aktif untuk dicetak', 'error');
  }
  try {
    printViaRawBtIntent(window.currentReceiptTrx, window.receiptPaperWidth);
    showToast('Mengirim struk ke driver thermal (RawBT)...', 'info');
  } catch (err) {
    showToast('Gagal memanggil driver printer: ' + err.message, 'error');
  }
};

window.handleScanBluetoothPrinter = async function() {
  try {
    showToast('Mencari printer thermal Bluetooth di sekitar...', 'info');
    const deviceName = await connectBluetoothPrinter();
    showToast(`Printer Bluetooth terhubung: ${deviceName}`, 'success');
  } catch (err) {
    showToast(err.message || 'Pencarian printer dibatalkan', 'error');
  }
};

window.openReceiptModal = function(param) {
  const trx = typeof param === 'string' ? history.find(t => t.id === param) : param;
  if (!trx) return;
  window.currentReceiptTrx = trx;

  const cashierDisplay = trx.cashierName || (currentUser ? currentUser.name : 'Kasir Raya');
  document.getElementById('receipt-date-time').textContent = `${trx.date} ${trx.time} WIB`;
  document.getElementById('receipt-id').textContent = `No: ${trx.id} (Kasir: ${cashierDisplay})`;
  document.getElementById('receipt-type-label').textContent = `Tipe: ${trx.type} (${trx.ref})`;
  
  const table = document.getElementById('receipt-items-table');
  table.innerHTML = '';
  trx.items.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.name} ${item.notes ? `<small>(${item.notes})</small>` : ''}<br><span style="color:#555;">${formatRp(item.price)} × ${item.qty}</span></td>
      <td style="text-align:right; vertical-align:bottom;">${formatRp(item.price * item.qty)}</td>
    `;
    table.appendChild(tr);
  });

  document.getElementById('receipt-subtotal').textContent = formatRp(trx.subtotal);
  if (trx.discount > 0) {
    document.getElementById('receipt-discount-row').style.display = 'table-row';
    document.getElementById('receipt-discount').textContent = '-' + formatRp(trx.discount);
  } else {
    document.getElementById('receipt-discount-row').style.display = 'none';
  }
  document.getElementById('receipt-tax').textContent = formatRp(trx.tax);
  document.getElementById('receipt-total').textContent = formatRp(trx.total);
  document.getElementById('receipt-method-label').textContent = trx.method;
  document.getElementById('receipt-paid').textContent = formatRp(trx.paid);
  
  if (trx.method === 'TUNAI') {
    document.getElementById('receipt-change-row').style.display = 'table-row';
    document.getElementById('receipt-change').textContent = formatRp(trx.change);
  } else {
    document.getElementById('receipt-change-row').style.display = 'none';
  }

  document.getElementById('modal-receipt').classList.add('show');
  lucide.createIcons();
};

// --------------------------------------------------
// Menu Management Logic
// --------------------------------------------------
function renderMenuTable() {
  const tbody = document.getElementById('table-menu');
  tbody.innerHTML = '';
  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.name}</strong></td>
      <td><span class="category-tag ${p.category}">${p.category}</span></td>
      <td>${formatRp(p.price)}</td>
      <td style="text-align:right;">
        <div style="display:flex; gap:6px; justify-content:flex-end;">
          <button class="btn-outline" style="padding: 4px 8px; font-size:12px; min-height:36px;" onclick="openEditMenu(${p.id})">
            <i data-lucide="pencil" style="width:14px;height:14px;"></i> Edit
          </button>
          <button class="btn-outline danger" style="padding: 4px 8px; font-size:12px; min-height:36px;" onclick="deleteMenu(${p.id})">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Hapus
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

window.deleteMenu = (id) => {
  if (confirm("Hapus menu ini dari katalog?")) {
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderMenuTable();
    renderPOS();
    showToast('Menu berhasil dihapus', 'info');
  }
};

// Edit menu: open modal pre-filled with current product data
let editingMenuId = null;

window.openEditMenu = (id) => {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  editingMenuId = id;
  document.getElementById('edit-menu-name').value = product.name;
  document.getElementById('edit-menu-category').value = product.category;
  document.getElementById('edit-menu-price').value = product.price;
  document.getElementById('modal-edit-menu').classList.add('show');
};

document.getElementById('btn-update-menu').addEventListener('click', () => {
  const name = document.getElementById('edit-menu-name').value.trim();
  const cat = document.getElementById('edit-menu-category').value;
  const price = parseInt(document.getElementById('edit-menu-price').value);
  
  if (!name || isNaN(price) || price <= 0) {
    return showToast('Mohon lengkapi nama dan harga produk', 'error');
  }
  
  const product = products.find(p => p.id === editingMenuId);
  if (!product) return;
  
  product.name = name;
  product.category = cat;
  product.price = price;
  
  saveProducts();
  document.getElementById('modal-edit-menu').classList.remove('show');
  renderMenuTable();
  renderPOS();
  editingMenuId = null;
  showToast(`Produk "${name}" berhasil diperbarui`, 'success');
});

document.getElementById('btn-save-menu').addEventListener('click', () => {
  const name = document.getElementById('input-menu-name').value.trim();
  const cat = document.getElementById('input-menu-category').value;
  const price = parseInt(document.getElementById('input-menu-price').value);
  
  if (!name || isNaN(price) || price <= 0) {
    return showToast('Mohon lengkapi nama dan harga produk', 'error');
  }
  
  products.push({
    id: Date.now(),
    name, 
    category: cat, 
    price
  });
  
  saveProducts();
  document.getElementById('modal-add-menu').classList.remove('show');
  renderMenuTable();
  renderPOS();
  
  document.getElementById('input-menu-name').value = '';
  document.getElementById('input-menu-price').value = '';
  showToast(`Produk "${name}" ditambahkan`, 'success');
});

// --------------------------------------------------
// History & Expenses Logic
// --------------------------------------------------
let currentHistoryFilter = 'ALL'; // 'ALL', 'KAFE', 'CUCI'
let currentReportFilter = 'ALL';  // 'ALL', 'KAFE', 'CUCI'

function getTrxServices(trx) {
  let hasKafe = false;
  let hasCuci = false;
  let kafeTotal = 0;
  let cuciTotal = 0;
  let kafeQty = 0;
  let cuciQty = 0;

  if (trx.items && trx.items.length > 0) {
    trx.items.forEach(item => {
      if (item.category === 'KAFE') {
        hasKafe = true;
        kafeTotal += (item.price * item.qty);
        kafeQty += item.qty;
      } else if (item.category === 'CUCI') {
        hasCuci = true;
        cuciTotal += (item.price * item.qty);
        cuciQty += item.qty;
      }
    });
  } else {
    if (trx.type === 'Carwash') {
      hasCuci = true;
      cuciTotal = trx.total || 0;
      cuciQty = 1;
    } else {
      hasKafe = true;
      kafeTotal = trx.total || 0;
      kafeQty = 1;
    }
  }

  return { hasKafe, hasCuci, kafeTotal, cuciTotal, kafeQty, cuciQty };
}

function renderHistory() {
  const tbody = document.getElementById('table-history');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  // Calculate summary metrics for all transactions
  let allOmset = 0;
  let kafeOmset = 0;
  let cuciOmset = 0;
  let kafeTrxCount = 0;
  let cuciTrxCount = 0;
  let kafeItemCount = 0;
  let cuciUnitCount = 0;

  history.forEach(trx => {
    allOmset += trx.total;
    const s = getTrxServices(trx);
    if (s.hasKafe) {
      kafeOmset += s.kafeTotal;
      kafeTrxCount++;
      kafeItemCount += s.kafeQty;
    }
    if (s.hasCuci) {
      cuciOmset += s.cuciTotal;
      cuciTrxCount++;
      cuciUnitCount += s.cuciQty;
    }
  });

  const histAllOmsetEl = document.getElementById('hist-stat-all-omset');
  if (histAllOmsetEl) histAllOmsetEl.textContent = formatRp(allOmset);
  const histAllCountEl = document.getElementById('hist-stat-all-count');
  if (histAllCountEl) histAllCountEl.textContent = `${history.length} Transaksi`;

  const histKafeOmsetEl = document.getElementById('hist-stat-kafe-omset');
  if (histKafeOmsetEl) histKafeOmsetEl.textContent = formatRp(kafeOmset);
  const histKafeCountEl = document.getElementById('hist-stat-kafe-count');
  if (histKafeCountEl) histKafeCountEl.textContent = `${kafeTrxCount} Trx (${kafeItemCount} item)`;

  const histWashOmsetEl = document.getElementById('hist-stat-wash-omset');
  if (histWashOmsetEl) histWashOmsetEl.textContent = formatRp(cuciOmset);
  const histWashCountEl = document.getElementById('hist-stat-wash-count');
  if (histWashCountEl) histWashCountEl.textContent = `${cuciTrxCount} Trx (${cuciUnitCount} unit)`;

  // Filter based on active service tab
  let filtered = history;
  if (currentHistoryFilter === 'KAFE') {
    filtered = history.filter(h => getTrxServices(h).hasKafe);
  } else if (currentHistoryFilter === 'CUCI') {
    filtered = history.filter(h => getTrxServices(h).hasCuci);
  }

  if (filtered.length === 0) {
    const filterName = currentHistoryFilter === 'KAFE' ? 'Kafe' : (currentHistoryFilter === 'CUCI' ? 'Carwash' : 'semua layanan');
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px;">Belum ada riwayat transaksi untuk ${filterName}.</td></tr>`;
    return;
  }
  
  filtered.forEach(h => {
    const s = getTrxServices(h);
    let serviceBadge = '';
    if (s.hasKafe && s.hasCuci) {
      serviceBadge = `<span class="category-tag KAFE">Kafe</span> <span class="category-tag CUCI" style="margin-left:2px;">Carwash</span>`;
    } else if (s.hasKafe) {
      serviceBadge = `<span class="category-tag KAFE">Kafe</span>`;
    } else {
      serviceBadge = `<span class="category-tag CUCI">Carwash</span>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${h.id}</strong></td>
      <td>${h.time} WIB</td>
      <td>${serviceBadge}</td>
      <td>${h.type || '-'} <small style="color:var(--text-muted);">(${h.ref || '-'})</small></td>
      <td><strong>${formatRp(h.total)}</strong></td>
      <td><span class="status-badge" style="background:var(--surface-subtle); color:var(--text-secondary); border:1px solid var(--border-color);">${h.method}</span></td>
      <td style="text-align:right; white-space:nowrap;">
        <button class="btn-outline" style="padding:4px 8px; font-size:12px; min-height:34px; display:inline-flex; align-items:center; gap:4px;" onclick='openReceiptModal("${h.id}")' title="Lihat Struk">
          <i data-lucide="receipt" style="width:13px;height:13px;"></i> Struk
        </button>
        <button class="btn-outline" style="padding:4px 8px; font-size:12px; min-height:34px; display:inline-flex; align-items:center; gap:4px; margin-left:4px; color:var(--primary); border-color:var(--primary-border);" onclick='openEditTrx("${h.id}")' title="Edit Transaksi">
          <i data-lucide="edit-3" style="width:13px;height:13px;"></i> Edit
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

// --- Edit Transaction State & Logic ---
let editingTrxId = null;
let editingTrxItems = [];

window.openEditTrx = function(id) {
  const trx = history.find(t => t.id === id);
  if (!trx) return showToast('Transaksi tidak ditemukan', 'error');

  editingTrxId = id;
  editingTrxItems = JSON.parse(JSON.stringify(trx.items || []));

  document.getElementById('edit-trx-badge').textContent = trx.id;
  document.getElementById('edit-trx-time').value = trx.time || '';
  document.getElementById('edit-trx-method').value = trx.method || 'TUNAI';
  document.getElementById('edit-trx-type').value = trx.type || 'Dine In';
  document.getElementById('edit-trx-ref').value = trx.ref || '';
  document.getElementById('edit-trx-discount').value = trx.discount || 0;
  document.getElementById('edit-trx-tax').value = trx.tax || 0;

  // Populate Add Product Select
  const select = document.getElementById('edit-trx-add-product-select');
  if (select) {
    select.innerHTML = products.map(p => `
      <option value="${p.id}">${p.name} (${p.category}) - ${formatRp(p.price)}</option>
    `).join('');
  }

  renderEditTrxItems();
  calcEditTrxTotal();

  document.getElementById('modal-edit-trx').classList.add('show');
  lucide.createIcons();
};

function renderEditTrxItems() {
  const container = document.getElementById('edit-trx-items-container');
  if (!container) return;
  container.innerHTML = '';

  if (editingTrxItems.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:12px;">Tidak ada item. Tambahkan item di bawah.</div>`;
    document.getElementById('edit-trx-item-count').textContent = '0 item';
    calcEditTrxTotal();
    return;
  }

  document.getElementById('edit-trx-item-count').textContent = `${editingTrxItems.length} item`;

  editingTrxItems.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'edit-trx-item-row';
    row.innerHTML = `
      <div class="edit-trx-item-info">
        <div class="edit-trx-item-name">${item.name}</div>
        <div class="edit-trx-item-price">${formatRp(item.price)} × ${item.qty} = <strong>${formatRp(item.price * item.qty)}</strong></div>
      </div>
      <div class="edit-trx-qty-ctrl">
        <button type="button" class="btn-qty-mini" onclick="changeEditTrxItemQty(${idx}, -1)">−</button>
        <span class="qty-mini-val">${item.qty}</span>
        <button type="button" class="btn-qty-mini" onclick="changeEditTrxItemQty(${idx}, 1)">+</button>
        <button type="button" class="btn-remove-item" onclick="removeEditTrxItem(${idx})" title="Hapus item">
          <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });
  lucide.createIcons();
  calcEditTrxTotal();
}

window.changeEditTrxItemQty = function(idx, delta) {
  if (!editingTrxItems[idx]) return;
  editingTrxItems[idx].qty += delta;
  if (editingTrxItems[idx].qty <= 0) {
    editingTrxItems.splice(idx, 1);
  }
  renderEditTrxItems();
};

window.removeEditTrxItem = function(idx) {
  if (!editingTrxItems[idx]) return;
  editingTrxItems.splice(idx, 1);
  renderEditTrxItems();
};

document.getElementById('btn-edit-trx-add-item').addEventListener('click', () => {
  const select = document.getElementById('edit-trx-add-product-select');
  if (!select) return;
  const prodId = parseInt(select.value);
  const prod = products.find(p => p.id === prodId);
  if (!prod) return;

  const existing = editingTrxItems.find(i => i.id === prod.id || i.name === prod.name);
  if (existing) {
    existing.qty += 1;
  } else {
    editingTrxItems.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      category: prod.category,
      qty: 1
    });
  }
  renderEditTrxItems();
});

function calcEditTrxTotal() {
  const subtotal = editingTrxItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountInput = document.getElementById('edit-trx-discount');
  const taxInput = document.getElementById('edit-trx-tax');
  const discount = Math.max(0, parseInt(discountInput ? discountInput.value : 0) || 0);
  const tax = Math.max(0, parseInt(taxInput ? taxInput.value : 0) || 0);
  const total = Math.max(0, subtotal - discount + tax);

  const previewEl = document.getElementById('edit-trx-total-preview');
  if (previewEl) previewEl.textContent = formatRp(total);
  return { subtotal, discount, tax, total };
}

document.getElementById('edit-trx-discount').addEventListener('input', calcEditTrxTotal);
document.getElementById('edit-trx-tax').addEventListener('input', calcEditTrxTotal);

document.getElementById('btn-save-edit-trx').addEventListener('click', () => {
  if (!editingTrxId) return;
  const trx = history.find(t => t.id === editingTrxId);
  if (!trx) return showToast('Transaksi tidak ditemukan', 'error');

  if (editingTrxItems.length === 0) {
    return showToast('Transaksi harus memiliki minimal 1 item pesanan', 'error');
  }

  const timeVal = document.getElementById('edit-trx-time').value.trim() || trx.time;
  const methodVal = document.getElementById('edit-trx-method').value;
  const typeVal = document.getElementById('edit-trx-type').value;
  const refVal = document.getElementById('edit-trx-ref').value.trim();

  const { subtotal, discount, tax, total } = calcEditTrxTotal();

  trx.time = timeVal;
  trx.method = methodVal;
  trx.type = typeVal;
  trx.ref = refVal;
  trx.items = JSON.parse(JSON.stringify(editingTrxItems));
  trx.subtotal = subtotal;
  trx.discount = discount;
  trx.tax = tax;
  trx.total = total;
  trx.paid = trx.paid >= total ? trx.paid : total;
  trx.change = trx.paid > total ? trx.paid - total : 0;

  saveHistory();
  document.getElementById('modal-edit-trx').classList.remove('show');
  renderHistory();
  updateDashboardStats();
  renderReports();

  showToast(`Transaksi ${trx.id} berhasil diperbarui`, 'success');
  editingTrxId = null;
});

document.getElementById('btn-delete-trx').addEventListener('click', () => {
  if (!editingTrxId) return;
  if (!confirm(`Hapus transaksi ${editingTrxId} dari riwayat? Total omset dan laporan akan diperbarui otomatis.`)) {
    return;
  }

  const deletedId = editingTrxId;
  history = history.filter(t => t.id !== deletedId);
  saveHistory();
  document.getElementById('modal-edit-trx').classList.remove('show');
  renderHistory();
  updateDashboardStats();
  renderReports();

  showToast(`Transaksi ${deletedId} telah dihapus`, 'info');
  editingTrxId = null;
});

// --------------------------------------------------
// Biaya Operasional & Talangan Karyawan Logic
// --------------------------------------------------
function formatDateIndo(isoStr) {
  if (!isoStr) return '';
  try {
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const dayName = days[d.getDay()];
      const dayNum = d.getDate();
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      return `${dayName}, ${dayNum} ${monthName} ${year}`;
    }
  } catch (err) {
    console.error('Error formatting date:', err);
  }
  return isoStr;
}

function openAddExpenseModal() {
  const modal = document.getElementById('modal-add-expense');
  if (!modal) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('input-expense-date');
  if (dateInput) dateInput.value = todayStr;

  const descInput = document.getElementById('input-expense-desc');
  if (descInput) descInput.value = '';

  const amountInput = document.getElementById('input-expense-amount');
  if (amountInput) amountInput.value = '';

  const employeeInput = document.getElementById('input-expense-employee');
  if (employeeInput) employeeInput.value = '';

  const reimbursedNowCheckbox = document.getElementById('input-expense-reimbursed-now');
  if (reimbursedNowCheckbox) reimbursedNowCheckbox.checked = false;

  const catSelect = document.getElementById('input-expense-category');
  if (catSelect) catSelect.value = 'KAFE';

  // Set fund radio to Kasir by default
  const kasirRadio = document.querySelector('input[name="add-expense-fund"][value="KASIR"]');
  if (kasirRadio) kasirRadio.checked = true;
  document.getElementById('card-fund-kasir')?.classList.add('active');
  document.getElementById('card-fund-karyawan')?.classList.remove('active');
  
  const empContainer = document.getElementById('add-expense-employee-container');
  if (empContainer) empContainer.style.display = 'none';

  modal.classList.add('show');
}

// Radio change listeners for Add Expense Modal
document.querySelectorAll('input[name="add-expense-fund"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const isKaryawan = e.target.value === 'KARYAWAN';
    document.getElementById('card-fund-kasir')?.classList.toggle('active', !isKaryawan);
    document.getElementById('card-fund-karyawan')?.classList.toggle('active', isKaryawan);
    const empContainer = document.getElementById('add-expense-employee-container');
    if (empContainer) empContainer.style.display = isKaryawan ? 'block' : 'none';
  });
});

// Radio change listeners for Edit Expense Modal
document.querySelectorAll('input[name="edit-expense-fund"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const isKaryawan = e.target.value === 'KARYAWAN';
    document.getElementById('edit-card-fund-kasir')?.classList.toggle('active', !isKaryawan);
    document.getElementById('edit-card-fund-karyawan')?.classList.toggle('active', isKaryawan);
    const empContainer = document.getElementById('edit-expense-employee-container');
    if (empContainer) empContainer.style.display = isKaryawan ? 'block' : 'none';
  });
});

// Save New Expense
document.getElementById('btn-save-expense').addEventListener('click', () => {
  const dateInput = document.getElementById('input-expense-date');
  const catInput = document.getElementById('input-expense-category');
  const descInput = document.getElementById('input-expense-desc');
  const amountInput = document.getElementById('input-expense-amount');

  const isoDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
  const category = catInput ? catInput.value : 'KAFE';
  const desc = descInput ? descInput.value.trim() : '';
  const amount = parseInt(amountInput ? amountInput.value : 0, 10);

  if (!desc || isNaN(amount) || amount <= 0) {
    return showToast('Mohon isi keterangan dan nominal biaya dengan benar', 'error');
  }

  const fundRadio = document.querySelector('input[name="add-expense-fund"]:checked');
  const fundSource = fundRadio ? fundRadio.value : 'KASIR';

  let employeeName = '';
  let reimbursementStatus = 'SETTLED';
  let reimbursedAt = '';

  if (fundSource === 'KARYAWAN') {
    const empInput = document.getElementById('input-expense-employee');
    employeeName = empInput ? empInput.value.trim() : '';
    if (!employeeName) {
      return showToast('Mohon isi nama karyawan yang menalangi pengeluaran ini', 'error');
    }

    const isReimbursedNow = document.getElementById('input-expense-reimbursed-now')?.checked;
    if (isReimbursedNow) {
      reimbursementStatus = 'SETTLED';
      reimbursedAt = new Date().toLocaleTimeString('id-ID') + ', ' + new Date().toLocaleDateString('id-ID');
    } else {
      reimbursementStatus = 'PENDING';
    }
  }

  let formattedDate = isoDate;
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      formattedDate = `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;
    }
  } catch (err) {}

  const newExpense = {
    id: 'EXP-' + Date.now(),
    desc,
    amount,
    category,
    fundSource,
    employeeName,
    reimbursementStatus,
    reimbursedAt,
    date: formattedDate,
    isoDate,
    timestamp: Date.now()
  };

  expenses.unshift(newExpense);
  saveExpenses();

  document.getElementById('modal-add-expense')?.classList.remove('show');
  renderExpense();
  updateDashboardStats();
  renderReports();

  if (fundSource === 'KARYAWAN' && reimbursementStatus === 'PENDING') {
    showToast(`Pengeluaran dicatat sebagai talangan ${employeeName} (Menunggu Penggantian)`, 'info');
  } else {
    showToast('Pengeluaran berhasil dicatat ke sistem', 'success');
  }
});

// Confirm Reimbursement (1-Click Action)
window.confirmReimbursement = function(id) {
  const exp = expenses.find(e => String(e.id) === String(id));
  if (!exp) return;

  const emp = exp.employeeName || 'Karyawan';
  const nominalStr = formatRp(exp.amount);

  if (!confirm(`Konfirmasi pelunasan uang talangan untuk ${emp} sebesar ${nominalStr} dari kasir sekarang?`)) {
    return;
  }

  exp.reimbursementStatus = 'SETTLED';
  exp.reimbursedAt = new Date().toLocaleTimeString('id-ID') + ', ' + new Date().toLocaleDateString('id-ID');

  saveExpenses();
  renderExpense();
  updateDashboardStats();
  renderReports();

  showToast(`Uang talangan ${emp} sebesar ${nominalStr} telah lunas diganti kasir`, 'success');
};

// Open Edit Expense Modal
window.openEditExpense = function(id) {
  const exp = expenses.find(e => String(e.id) === String(id));
  if (!exp) return;

  editingExpenseId = exp.id;

  const modal = document.getElementById('modal-edit-expense');
  if (!modal) return;

  document.getElementById('edit-expense-date').value = exp.isoDate || new Date().toISOString().split('T')[0];
  document.getElementById('edit-expense-category').value = exp.category || 'KAFE';
  document.getElementById('edit-expense-desc').value = exp.desc || '';
  document.getElementById('edit-expense-amount').value = exp.amount || 0;

  const isKaryawan = exp.fundSource === 'KARYAWAN';
  const kasirRadio = document.querySelector('input[name="edit-expense-fund"][value="KASIR"]');
  const karyawanRadio = document.querySelector('input[name="edit-expense-fund"][value="KARYAWAN"]');

  if (isKaryawan && karyawanRadio) {
    karyawanRadio.checked = true;
  } else if (kasirRadio) {
    kasirRadio.checked = true;
  }

  document.getElementById('edit-card-fund-kasir')?.classList.toggle('active', !isKaryawan);
  document.getElementById('edit-card-fund-karyawan')?.classList.toggle('active', isKaryawan);

  const empContainer = document.getElementById('edit-expense-employee-container');
  if (empContainer) empContainer.style.display = isKaryawan ? 'block' : 'none';

  document.getElementById('edit-expense-employee').value = exp.employeeName || '';
  document.getElementById('edit-expense-reimb-status').value = exp.reimbursementStatus || 'PENDING';

  modal.classList.add('show');
};

// Save Edit Expense
document.getElementById('btn-save-edit-expense').addEventListener('click', () => {
  if (!editingExpenseId) return;
  const exp = expenses.find(e => String(e.id) === String(editingExpenseId));
  if (!exp) return showToast('Catatan pengeluaran tidak ditemukan', 'error');

  const isoDate = document.getElementById('edit-expense-date').value;
  const category = document.getElementById('edit-expense-category').value;
  const desc = document.getElementById('edit-expense-desc').value.trim();
  const amount = parseInt(document.getElementById('edit-expense-amount').value, 10);

  if (!desc || isNaN(amount) || amount <= 0) {
    return showToast('Mohon isi keterangan dan nominal biaya dengan benar', 'error');
  }

  const fundRadio = document.querySelector('input[name="edit-expense-fund"]:checked');
  const fundSource = fundRadio ? fundRadio.value : 'KASIR';

  let employeeName = '';
  let reimbursementStatus = 'SETTLED';
  let reimbursedAt = exp.reimbursedAt;

  if (fundSource === 'KARYAWAN') {
    employeeName = document.getElementById('edit-expense-employee').value.trim();
    if (!employeeName) {
      return showToast('Mohon isi nama karyawan yang menalangi biaya ini', 'error');
    }
    reimbursementStatus = document.getElementById('edit-expense-reimb-status').value;
    if (reimbursementStatus === 'SETTLED' && !reimbursedAt) {
      reimbursedAt = new Date().toLocaleTimeString('id-ID') + ', ' + new Date().toLocaleDateString('id-ID');
    }
  }

  let formattedDate = isoDate;
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      formattedDate = `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;
    }
  } catch (err) {}

  exp.desc = desc;
  exp.amount = amount;
  exp.category = category;
  exp.fundSource = fundSource;
  exp.employeeName = employeeName;
  exp.reimbursementStatus = reimbursementStatus;
  exp.reimbursedAt = reimbursedAt;
  exp.date = formattedDate;
  exp.isoDate = isoDate;

  saveExpenses();
  document.getElementById('modal-edit-expense')?.classList.remove('show');
  renderExpense();
  updateDashboardStats();
  renderReports();

  showToast('Catatan pengeluaran berhasil diperbarui', 'success');
  editingExpenseId = null;
});

// Delete Expense
window.deleteExpense = function(id) {
  if (!confirm('Hapus catatan pengeluaran ini? Laba bersih dan laporan omset akan diperbarui otomatis.')) {
    return;
  }

  expenses = expenses.filter(e => String(e.id) !== String(id));
  saveExpenses();

  document.getElementById('modal-edit-expense')?.classList.remove('show');
  renderExpense();
  updateDashboardStats();
  renderReports();

  showToast('Catatan pengeluaran telah dihapus', 'info');
  editingExpenseId = null;
};

document.getElementById('btn-delete-expense')?.addEventListener('click', () => {
  if (editingExpenseId) {
    deleteExpense(editingExpenseId);
  }
});

// Render Expense Grouped by Date
function renderExpense() {
  const container = document.getElementById('expense-grouped-container');
  if (!container) return;

  const nowIso = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = nowIso.substring(0, 7); // YYYY-MM

  // Calculate Metrics
  let totalThisMonth = 0;
  let countThisMonth = 0;
  let totalToday = 0;
  let totalTodayKasir = 0;
  let totalKafe = 0;
  let totalCuci = 0;
  let pendingReimbCount = 0;
  let pendingReimbAmount = 0;

  expenses.forEach(e => {
    const amt = Number(e.amount) || 0;
    if (e.isoDate && e.isoDate.startsWith(currentMonthPrefix)) {
      totalThisMonth += amt;
      countThisMonth++;
    }
    if (e.isoDate === nowIso) {
      totalToday += amt;
      if (e.fundSource === 'KASIR' || e.reimbursementStatus === 'SETTLED') {
        totalTodayKasir += amt;
      }
    }
    if (e.category === 'KAFE') totalKafe += amt;
    if (e.category === 'CUCI') totalCuci += amt;

    if (e.fundSource === 'KARYAWAN' && e.reimbursementStatus === 'PENDING') {
      pendingReimbCount++;
      pendingReimbAmount += amt;
    }
  });

  // Update Summary DOM Cards
  const expMonthEl = document.getElementById('exp-stat-month');
  if (expMonthEl) expMonthEl.textContent = formatRp(totalThisMonth);

  const expMonthSubEl = document.getElementById('exp-stat-month-sub');
  if (expMonthSubEl) expMonthSubEl.textContent = `${countThisMonth} Biaya Bulan Ini`;

  const expTodayEl = document.getElementById('exp-stat-today');
  if (expTodayEl) expTodayEl.textContent = formatRp(totalToday);

  const expTodaySubEl = document.getElementById('exp-stat-today-sub');
  if (expTodaySubEl) expTodaySubEl.textContent = `Dari Kas Kasir: ${formatRp(totalTodayKasir)}`;

  const expSplitEl = document.getElementById('exp-stat-split');
  if (expSplitEl) expSplitEl.textContent = `${formatRp(totalKafe)} / ${formatRp(totalCuci)}`;

  const expReimbEl = document.getElementById('exp-stat-reimb-pending');
  if (expReimbEl) expReimbEl.textContent = formatRp(pendingReimbAmount);

  const expReimbCountEl = document.getElementById('exp-stat-reimb-count');
  if (expReimbCountEl) expReimbCountEl.textContent = `${pendingReimbCount} Menunggu Penggantian`;

  const reimbCardEl = document.getElementById('card-metric-reimb');
  if (reimbCardEl) {
    if (pendingReimbCount > 0) {
      reimbCardEl.style.background = '#FFFBEB';
      reimbCardEl.style.borderColor = '#FCD34D';
    } else {
      reimbCardEl.style.background = 'var(--surface)';
      reimbCardEl.style.borderColor = 'var(--border-color)';
    }
  }

  // Filter expenses
  let filtered = expenses.slice();
  if (currentExpenseFilter === 'KASIR') {
    filtered = filtered.filter(e => e.fundSource === 'KASIR');
  } else if (currentExpenseFilter === 'PENDING') {
    filtered = filtered.filter(e => e.fundSource === 'KARYAWAN' && e.reimbursementStatus === 'PENDING');
  } else if (currentExpenseFilter === 'SETTLED') {
    filtered = filtered.filter(e => e.fundSource === 'KARYAWAN' && e.reimbursementStatus === 'SETTLED');
  }

  // Sort descending by isoDate, then timestamp
  filtered.sort((a, b) => {
    if (a.isoDate !== b.isoDate) {
      return (b.isoDate || '').localeCompare(a.isoDate || '');
    }
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  if (filtered.length === 0) {
    let emptyMsg = 'Belum ada catatan pengeluaran operasional.';
    if (currentExpenseFilter === 'KASIR') emptyMsg = 'Belum ada pengeluaran dari kas kasir toko.';
    if (currentExpenseFilter === 'PENDING') emptyMsg = 'Tidak ada uang talangan karyawan yang menanti penggantian.';
    if (currentExpenseFilter === 'SETTLED') emptyMsg = 'Belum ada riwayat talangan karyawan yang telah lunas diganti.';

    container.innerHTML = `
      <div class="panel" style="text-align:center; padding: 48px 24px; color:var(--text-muted);">
        <div style="width:52px; height:52px; border-radius:50%; background:#F1F5F9; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; color:var(--text-secondary);">
          <i data-lucide="wallet" style="width:24px;height:24px;"></i>
        </div>
        <h4 style="margin-bottom:6px; color:var(--text-main); font-size:15px;">${emptyMsg}</h4>
        <p style="font-size:12px; margin-bottom:16px;">Catat belanja bahan baku kopi, semir carwash, atau operasional toko.</p>
        <button class="btn-primary-sm" onclick="openAddExpenseModal()" style="display:inline-flex; align-items:center; gap:6px;">
          <i data-lucide="plus" style="width:14px;height:14px;"></i> Catat Biaya Sekarang
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Group by isoDate
  const dateGroups = {};
  filtered.forEach(e => {
    const key = e.isoDate || 'Tanpa Tanggal';
    if (!dateGroups[key]) dateGroups[key] = [];
    dateGroups[key].push(e);
  });

  let html = '';
  Object.keys(dateGroups).forEach(dateKey => {
    const items = dateGroups[dateKey];
    const groupSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const kasirSubtotal = items.filter(i => i.fundSource === 'KASIR' || i.reimbursementStatus === 'SETTLED').reduce((sum, i) => sum + i.amount, 0);
    const pendingSubtotal = items.filter(i => i.fundSource === 'KARYAWAN' && i.reimbursementStatus === 'PENDING').reduce((sum, i) => sum + i.amount, 0);

    const friendlyDate = formatDateIndo(dateKey);
    const isToday = dateKey === nowIso;

    html += `
      <div class="expense-date-card">
        <div class="expense-date-header">
          <div class="expense-date-title">
            <span class="expense-date-badge" style="background:${isToday ? 'var(--primary)' : '#486581'};">
              ${isToday ? 'Hari Ini' : dateKey}
            </span>
            <div>
              <strong style="color:var(--text-main); font-size:14px;">${friendlyDate}</strong>
              <div class="expense-date-meta">${items.length} Catatan Biaya</div>
            </div>
          </div>
          <div class="expense-date-subtotal">
            <div class="expense-date-subtotal-val">${formatRp(groupSubtotal)}</div>
            <div class="expense-date-subtotal-sub">
              Kasir: ${formatRp(kasirSubtotal)} ${pendingSubtotal > 0 ? `• <span style="color:#D97706; font-weight:600;">Talangan: ${formatRp(pendingSubtotal)}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" style="margin:0;">
            <thead>
              <tr>
                <th style="width:110px;">Layanan</th>
                <th>Keterangan Biaya</th>
                <th>Sumber Dana & Status</th>
                <th style="text-align:right; width:130px;">Nominal</th>
                <th style="text-align:right; width:110px;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                let categoryBadge = `<span class="category-tag KAFE">Kafe</span>`;
                if (item.category === 'CUCI') {
                  categoryBadge = `<span class="category-tag CUCI">Carwash</span>`;
                } else if (item.category === 'UMUM') {
                  categoryBadge = `<span class="category-tag" style="background:#E2E8F0; color:#334155;">Umum</span>`;
                }

                let fundHtml = '';
                if (item.fundSource === 'KASIR') {
                  fundHtml = `
                    <span class="fund-badge kasir" title="Dipungut dari uang laci kasir toko">
                      <i data-lucide="wallet" style="width:12px;height:12px;"></i> Kas Toko
                    </span>
                  `;
                } else if (item.fundSource === 'KARYAWAN') {
                  const empName = item.employeeName || 'Karyawan';
                  if (item.reimbursementStatus === 'PENDING') {
                    fundHtml = `
                      <div style="display:inline-flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        <span class="fund-badge talangan-pending" title="Uang talangan karyawan menanti penggantian dari kasir">
                          <i data-lucide="clock" style="width:12px;height:12px;"></i> Talangan: ${empName} (Belum Diganti)
                        </span>
                        <button class="btn-reimb-action" onclick="confirmReimbursement('${item.id}')" title="Klik untuk mengonfirmasi bahwa kasir telah mengganti uang ini">
                          <i data-lucide="check-circle" style="width:12px;height:12px;"></i> Ganti Uang
                        </button>
                      </div>
                    `;
                  } else {
                    fundHtml = `
                      <span class="fund-badge talangan-settled" title="Telah lunas diganti oleh kasir pada ${item.reimbursedAt || 'hari ini'}">
                        <i data-lucide="check" style="width:12px;height:12px;"></i> Lunas (${empName})
                      </span>
                    `;
                  }
                }

                return `
                  <tr>
                    <td>${categoryBadge}</td>
                    <td>
                      <strong>${item.desc}</strong>
                      ${item.reimbursedAt ? `<div style="font-size:10px; color:var(--text-muted); margin-top:2px;">Diganti kasir: ${item.reimbursedAt}</div>` : ''}
                    </td>
                    <td>${fundHtml}</td>
                    <td style="text-align:right; font-weight:700; color:var(--danger); font-variant-numeric:tabular-nums; font-size:13px;">
                      ${formatRp(item.amount)}
                    </td>
                    <td style="text-align:right;">
                      <div style="display:flex; justify-content:flex-end; gap:6px;">
                        <button class="btn-outline" style="min-height:36px; min-width:36px; padding:6px 10px; font-size:12px;" onclick="openEditExpense('${item.id}')" title="Ubah catatan">
                          <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
                        </button>
                        <button class="btn-outline danger" style="min-height:36px; min-width:36px; padding:6px 10px; font-size:12px;" onclick="deleteExpense('${item.id}')" title="Hapus catatan">
                          <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Mobile Reflow Cards (Auto active at <= 680px) -->
        <div class="expense-mobile-list" style="display:none; flex-direction:column; gap:10px; padding:12px;">
          ${items.map(item => {
            let catTag = `<span class="category-tag KAFE">Kafe</span>`;
            if (item.category === 'CUCI') catTag = `<span class="category-tag CUCI">Carwash</span>`;
            else if (item.category === 'UMUM') catTag = `<span class="category-tag" style="background:#E2E8F0; color:#334155;">Umum</span>`;

            let fundTag = '';
            if (item.fundSource === 'KASIR') {
              fundTag = `<span class="fund-badge kasir"><i data-lucide="wallet" style="width:12px;height:12px;"></i> Kas Toko</span>`;
            } else if (item.fundSource === 'KARYAWAN') {
              const empName = item.employeeName || 'Karyawan';
              if (item.reimbursementStatus === 'PENDING') {
                fundTag = `<span class="fund-badge talangan-pending"><i data-lucide="clock" style="width:12px;height:12px;"></i> Talangan: ${empName}</span>`;
              } else {
                fundTag = `<span class="fund-badge talangan-settled"><i data-lucide="check" style="width:12px;height:12px;"></i> Lunas (${empName})</span>`;
              }
            }

            return `
              <div class="expense-mobile-card">
                <div class="expense-mobile-top">
                  <span class="expense-mobile-desc">${item.desc}</span>
                  <span class="expense-mobile-amount">${formatRp(item.amount)}</span>
                </div>
                <div class="expense-mobile-meta">
                  ${catTag}
                  ${fundTag}
                </div>
                ${item.reimbursedAt ? `<div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">Diganti kasir: ${item.reimbursedAt}</div>` : ''}
                <div class="expense-mobile-actions">
                  ${item.fundSource === 'KARYAWAN' && item.reimbursementStatus === 'PENDING' ? `
                    <button class="btn-primary-sm btn-mobile-touch" onclick="confirmReimbursement('${item.id}')" style="flex:1;">
                      <i data-lucide="check-circle" style="width:15px;height:15px;"></i> Ganti Uang
                    </button>
                  ` : ''}
                  <button class="btn-outline btn-mobile-touch" onclick="openEditExpense('${item.id}')">
                    <i data-lucide="edit-3" style="width:14px;height:14px;"></i> Edit
                  </button>
                  <button class="btn-outline danger btn-mobile-touch" onclick="deleteExpense('${item.id}')">
                    <i data-lucide="trash-2" style="width:14px;height:14px;"></i> Hapus
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  lucide.createIcons();
}

// --------------------------------------------------
// Taxes & Charges Logic
// --------------------------------------------------
function renderTaxes() {
  const tbody = document.getElementById('table-taxes');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (taxes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding:24px; color:var(--text-muted);">
          Belum ada pajak atau biaya layanan. Tambahkan dengan tombol "Tambah Pajak".
        </td>
      </tr>
    `;
    return;
  }

  taxes.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${t.name}</strong></td>
      <td>${t.pct}%</td>
      <td>
        <span class="status-badge ${t.active ? 'success' : 'danger'}">
          ${t.active ? 'Aktif' : 'Non-aktif'}
        </span>
      </td>
      <td style="text-align:right;">
        <div style="display:flex; justify-content:flex-end; align-items:center; gap:6px;">
          <button class="btn-outline" style="padding: 4px 8px; font-size:12px; min-height:34px;" onclick="toggleTax(${t.id})">
            ${t.active ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
          <button class="btn-outline danger" style="padding: 4px 8px; font-size:12px; min-height:34px;" onclick="deleteTax(${t.id})" title="Hapus Pajak">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  lucide.createIcons();
}

window.toggleTax = (id) => {
  const tax = taxes.find(t => String(t.id) === String(id));
  if (tax) {
    tax.active = !tax.active;
    saveTaxes();
    renderTaxes();
    updateCart();
    showToast(`Status ${tax.name} diperbarui`, 'info');
  }
};

window.deleteTax = (id) => {
  const tax = taxes.find(t => String(t.id) === String(id));
  if (!tax) return;

  if (!confirm(`Hapus tarif pajak/biaya "${tax.name}" (${tax.pct}%)?`)) {
    return;
  }

  taxes = taxes.filter(t => String(t.id) !== String(id));
  saveTaxes();
  renderTaxes();
  updateCart();
  showToast(`Pajak "${tax.name}" berhasil dihapus`, 'info');
};

document.getElementById('btn-save-tax').addEventListener('click', () => {
  const name = document.getElementById('input-tax-name').value.trim();
  const pct = parseFloat(document.getElementById('input-tax-pct').value);
  
  if (!name || isNaN(pct) || pct <= 0) {
    return showToast('Mohon isi nama dan persentase pajak', 'error');
  }
  
  taxes.push({
    id: Date.now(),
    name,
    pct,
    active: true
  });
  
  saveTaxes();
  document.getElementById('modal-add-tax').classList.remove('show');
  renderTaxes();
  updateCart();
  
  document.getElementById('input-tax-name').value = '';
  document.getElementById('input-tax-pct').value = '';
  showToast(`Pajak "${name}" berhasil ditambahkan`, 'success');
});

// --------------------------------------------------
// Manajemen Anggota & Kasir (User Management)
// --------------------------------------------------
window.userPinVisibilityState = {};

window.toggleUserPinVisibility = function(userId, pinValue) {
  const isVisible = !!window.userPinVisibilityState[userId];
  const nextVisible = !isVisible;
  window.userPinVisibilityState[userId] = nextVisible;
  
  const textEl = document.getElementById(`user-pin-text-${userId}`);
  const iconEl = document.getElementById(`user-pin-icon-${userId}`);
  
  if (textEl) {
    textEl.textContent = nextVisible ? (pinValue || '-') : '••••••';
    textEl.style.color = nextVisible ? 'var(--primary)' : 'var(--text-main)';
  }
  if (iconEl) {
    iconEl.setAttribute('data-lucide', nextVisible ? 'eye-off' : 'eye');
    lucide.createIcons();
  }
};

window.toggleEditCurrentPin = function() {
  const pinInput = document.getElementById('user-edit-current-pin');
  const icon = document.getElementById('icon-toggle-edit-pin');
  if (!pinInput) return;
  const isPass = pinInput.type === 'password';
  pinInput.type = isPass ? 'text' : 'password';
  if (icon) {
    icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
    lucide.createIcons();
  }
};

function renderUsers() {
  const tbody = document.getElementById('table-users');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Update Summary Metrics
  const totalEl = document.getElementById('user-stat-total');
  const cashiersEl = document.getElementById('user-stat-cashiers');
  const adminsEl = document.getElementById('user-stat-admins');

  const totalCount = users.length;
  const activeCashiers = users.filter(u => u.role === 'KASIR' && u.status === 'ACTIVE').length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;

  if (totalEl) totalEl.textContent = totalCount;
  if (cashiersEl) cashiersEl.textContent = activeCashiers;
  if (adminsEl) adminsEl.textContent = adminCount;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
          Belum ada anggota terdaftar. Tambahkan anggota baru di atas.
        </td>
      </tr>
    `;
    return;
  }

  users.forEach(u => {
    const initials = (u.name || 'U')
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const roleBadge = u.role === 'ADMIN'
      ? `<span class="role-badge admin"><i data-lucide="shield-check" style="width:12px;height:12px;"></i> Admin</span>`
      : `<span class="role-badge kasir"><i data-lucide="user" style="width:12px;height:12px;"></i> Kasir</span>`;

    const statusBadge = u.status === 'ACTIVE'
      ? `<span class="status-badge success">Aktif</span>`
      : `<span class="status-badge danger">Nonaktif</span>`;

    const isPrimaryAdmin = u.username === 'admin' || u.id === 'USR-1';
    const userPin = (u.pin !== undefined && u.pin !== null && u.pin !== '') ? u.pin : u.username;
    const isVisible = !!window.userPinVisibilityState[u.id];

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="user-avatar-badge">${initials}</div>
          <div>
            <strong style="color:var(--text-main); font-size:13px;">${u.name}</strong>
            <div style="font-size:11px; color:var(--text-muted);">${u.phone && u.phone !== '-' ? u.phone : 'Tanpa No. HP'}</div>
          </div>
        </div>
      </td>
      <td><code style="background:var(--bg-color); padding:2px 6px; border-radius:4px; font-size:12px;">@${u.username}</code></td>
      <td>
        <div style="display:inline-flex; align-items:center; gap:6px;">
          <span id="user-pin-text-${u.id}" class="user-pin-masked" style="font-family:monospace; font-weight:600; background:var(--bg-color); padding:3px 8px; border-radius:4px; font-size:12px; border:1px solid var(--border-color); color:${isVisible ? 'var(--primary)' : 'var(--text-main)'}; min-width:65px; text-align:center;">
            ${isVisible ? userPin : '••••••'}
          </span>
          <button type="button" class="btn-outline" style="min-height:28px; min-width:28px; padding:2px 6px; border-radius:4px;" onclick="toggleUserPinVisibility('${u.id}', '${userPin}')" title="Lihat / Sembunyikan Password">
            <i data-lucide="${isVisible ? 'eye-off' : 'eye'}" id="user-pin-icon-${u.id}" style="width:13px;height:13px;"></i>
          </button>
        </div>
      </td>
      <td>${roleBadge}</td>
      <td>${statusBadge}</td>
      <td style="font-size:12px; color:var(--text-secondary);">${u.createdAt || '-'}</td>
      <td style="text-align:right;">
        <div style="display:flex; justify-content:flex-end; gap:6px;">
          <button class="btn-outline" style="min-height:36px; min-width:36px; padding:6px 10px; font-size:12px;" onclick="openEditUserModal('${u.id}')" title="Edit Anggota & Lihat Password">
            <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
          </button>
          ${!isPrimaryAdmin ? `
            <button class="btn-outline danger" style="min-height:36px; min-width:36px; padding:6px 10px; font-size:12px;" onclick="deleteUser('${u.id}')" title="Hapus Anggota">
              <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
            </button>
          ` : `
            <span style="font-size:11px; color:var(--text-muted); padding:4px 6px;">Utama</span>
          `}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  lucide.createIcons();
}

window.openAddUserModal = function() {
  document.getElementById('form-add-user')?.reset();
  document.getElementById('modal-add-user')?.classList.add('show');
};

window.closeAddUserModal = function() {
  document.getElementById('modal-add-user')?.classList.remove('show');
};

window.saveNewUser = function() {
  const name = document.getElementById('user-add-name')?.value.trim();
  const username = document.getElementById('user-add-username')?.value.trim().toLowerCase();
  const pin = document.getElementById('user-add-pin')?.value.trim();
  const role = document.getElementById('user-add-role')?.value || 'KASIR';
  const phone = document.getElementById('user-add-phone')?.value.trim();
  const status = document.getElementById('user-add-status')?.value || 'ACTIVE';

  if (!name || !username || !pin) {
    showToast('Mohon lengkapi Nama, Username, dan Password / PIN', 'error');
    return;
  }

  // Check unique username
  const exists = users.some(u => u.username && u.username.toLowerCase() === username);
  if (exists) {
    showToast(`Username "${username}" sudah digunakan anggota lain!`, 'error');
    return;
  }

  const newUser = {
    id: 'USR-' + Date.now().toString().slice(-4),
    name,
    username,
    pin,
    role,
    phone: phone || '-',
    status,
    createdAt: new Date().toLocaleDateString('id-ID')
  };

  users.push(newUser);
  saveUsers();
  renderUsers();
  closeAddUserModal();
  showToast(`Anggota baru "${newUser.name}" (${newUser.role}) berhasil didaftarkan`, 'success');
};

document.getElementById('form-add-user')?.addEventListener('submit', (e) => {
  e.preventDefault();
  window.saveNewUser();
});

document.getElementById('btn-save-new-user')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.saveNewUser();
});

window.openEditUserModal = function(userId) {
  const u = users.find(user => user.id === userId);
  if (!u) return;

  document.getElementById('user-edit-id').value = u.id;
  document.getElementById('user-edit-name').value = u.name;
  document.getElementById('user-edit-username').value = u.username;
  document.getElementById('user-edit-pin').value = '';
  document.getElementById('user-edit-role').value = u.role;
  document.getElementById('user-edit-phone').value = u.phone === '-' ? '' : (u.phone || '');
  document.getElementById('user-edit-status').value = u.status;

  const currentPinEl = document.getElementById('user-edit-current-pin');
  if (currentPinEl) {
    currentPinEl.value = (u.pin !== undefined && u.pin !== null && u.pin !== '') ? u.pin : u.username;
    currentPinEl.type = 'password';
  }
  const icon = document.getElementById('icon-toggle-edit-pin');
  if (icon) {
    icon.setAttribute('data-lucide', 'eye');
    lucide.createIcons();
  }

  const roleSelect = document.getElementById('user-edit-role');
  const isPrimary = u.username === 'admin' || u.id === 'USR-1';
  if (isPrimary && roleSelect) {
    roleSelect.disabled = true;
  } else if (roleSelect) {
    roleSelect.disabled = false;
  }

  document.getElementById('modal-edit-user')?.classList.add('show');
};

window.closeEditUserModal = function() {
  document.getElementById('modal-edit-user')?.classList.remove('show');
};

window.saveEditUser = function() {
  const id = document.getElementById('user-edit-id')?.value;
  const name = document.getElementById('user-edit-name')?.value.trim();
  const pin = document.getElementById('user-edit-pin')?.value.trim();
  const role = document.getElementById('user-edit-role')?.value || 'KASIR';
  const phone = document.getElementById('user-edit-phone')?.value.trim();
  const status = document.getElementById('user-edit-status')?.value || 'ACTIVE';

  if (!name) {
    showToast('Nama anggota tidak boleh kosong', 'error');
    return;
  }

  const userIdx = users.findIndex(u => u.id === id);
  if (userIdx === -1) return;

  const user = users[userIdx];
  user.name = name;
  if (pin) user.pin = pin;
  
  if (user.username !== 'admin' && user.id !== 'USR-1') {
    user.role = role;
    user.status = status;
  }
  user.phone = phone || '-';

  saveUsers();
  renderUsers();
  closeEditUserModal();

  if (currentUser && currentUser.id === user.id) {
    applyUserSession(user);
  }

  showToast(`Data anggota "${user.name}" berhasil diperbarui`, 'success');
};

document.getElementById('form-edit-user')?.addEventListener('submit', (e) => {
  e.preventDefault();
  window.saveEditUser();
});

document.getElementById('btn-save-edit-user')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.saveEditUser();
});

window.deleteUser = function(userId) {
  const u = users.find(user => user.id === userId);
  if (!u) return;

  if (u.username === 'admin' || u.id === 'USR-1') {
    showToast('Akun Admin Utama tidak boleh dihapus!', 'error');
    return;
  }

  if (currentUser && (currentUser.id === u.id || currentUser.username === u.username)) {
    showToast('Anda tidak dapat menghapus akun yang sedang Anda gunakan!', 'error');
    return;
  }

  if (!confirm(`Hapus anggota "${u.name}" (@${u.username}) dari sistem?`)) {
    return;
  }

  users = users.filter(user => user.id !== userId);
  saveUsers();
  renderUsers();
  showToast(`Anggota "${u.name}" berhasil dihapus`, 'info');
};

// --------------------------------------------------
// Reports Generation
// --------------------------------------------------
function renderReports() {
  const thead = document.getElementById('thead-reports');
  const tbody = document.getElementById('table-reports');
  if (!tbody || !thead) return;
  tbody.innerHTML = '';

  let totalKafe = 0;
  let totalCuci = 0;
  let totalOmset = 0;
  let kafeTrxCount = 0;
  let cuciTrxCount = 0;
  let kafeItemsSold = 0;
  let cuciUnitsDone = 0;

  const topKafeMap = {};
  const topCuciMap = {};

  history.forEach(trx => {
    totalOmset += trx.total;
    const s = getTrxServices(trx);
    if (s.hasKafe) {
      totalKafe += s.kafeTotal;
      kafeTrxCount++;
      kafeItemsSold += s.kafeQty;
    }
    if (s.hasCuci) {
      totalCuci += s.cuciTotal;
      cuciTrxCount++;
      cuciUnitsDone += s.cuciQty;
    }

    if (trx.items) {
      trx.items.forEach(item => {
        if (item.category === 'KAFE') {
          topKafeMap[item.name] = (topKafeMap[item.name] || 0) + item.qty;
        } else if (item.category === 'CUCI') {
          topCuciMap[item.name] = (topCuciMap[item.name] || 0) + item.qty;
        }
      });
    }
  });

  // Calculate Expenses per category
  let totalKafeExpense = 0;
  let totalCuciExpense = 0;
  let totalGeneralExpense = 0;

  expenses.forEach(exp => {
    const amt = Number(exp.amount) || 0;
    if (exp.category === 'KAFE') totalKafeExpense += amt;
    else if (exp.category === 'CUCI') totalCuciExpense += amt;
    else totalGeneralExpense += amt;
  });

  const totalExpenseAll = totalKafeExpense + totalCuciExpense + totalGeneralExpense;
  const netProfitAll = totalOmset - totalExpenseAll;
  const netKafe = totalKafe - totalKafeExpense;
  const netCuci = totalCuci - totalCuciExpense;

  // Update Summary Metrics on top of Reports page
  const repAllOmsetEl = document.getElementById('rep-stat-all-omset');
  if (repAllOmsetEl) repAllOmsetEl.textContent = formatRp(totalOmset);
  const repAllCountEl = document.getElementById('rep-stat-all-count');
  if (repAllCountEl) repAllCountEl.textContent = `${history.length} Transaksi`;

  const repExpenseEl = document.getElementById('rep-stat-expense');
  if (repExpenseEl) repExpenseEl.textContent = formatRp(totalExpenseAll);
  const repExpenseCountEl = document.getElementById('rep-stat-expense-count');
  if (repExpenseCountEl) repExpenseCountEl.textContent = `${expenses.length} Catatan Biaya`;

  const repNetProfitEl = document.getElementById('rep-stat-net-profit');
  if (repNetProfitEl) {
    repNetProfitEl.textContent = formatRp(netProfitAll);
    repNetProfitEl.style.color = netProfitAll >= 0 ? 'var(--success)' : 'var(--danger)';
  }
  const repMarginEl = document.getElementById('rep-stat-margin');
  if (repMarginEl) {
    const marginPct = totalOmset > 0 ? Math.round((netProfitAll / totalOmset) * 100) : 0;
    repMarginEl.textContent = `Margin Laba Bersih: ${marginPct}%`;
  }

  const repSplitOmsetEl = document.getElementById('rep-stat-split-omset');
  if (repSplitOmsetEl) repSplitOmsetEl.textContent = `${formatRp(totalKafe)} / ${formatRp(totalCuci)}`;
  const repSplitCountEl = document.getElementById('rep-stat-split-count');
  if (repSplitCountEl) repSplitCountEl.textContent = `${kafeTrxCount} Trx Kafe | ${cuciTrxCount} Trx Cuci`;

  const today = new Date().toLocaleDateString('id-ID');

  // Render Table Head & Body based on currentReportFilter
  if (currentReportFilter === 'KAFE') {
    thead.innerHTML = `
      <tr>
        <th>Periode</th>
        <th>Jml Transaksi Kafe</th>
        <th>Total Cup / Item Terjual</th>
        <th>Total Omset Kafe</th>
        <th>Biaya Bahan Baku Kafe</th>
        <th>Estimasi Laba Kafe</th>
      </tr>
    `;
    tbody.innerHTML = `
      <tr>
        <td><strong>Hari Ini (${today})</strong></td>
        <td><span class="category-tag KAFE">Kafe</span> ${kafeTrxCount} Transaksi</td>
        <td><strong>${kafeItemsSold} item/cup</strong></td>
        <td style="color:var(--text-main); font-weight:700;">${formatRp(totalKafe)}</td>
        <td style="color:var(--danger); font-weight:600;">-${formatRp(totalKafeExpense)}</td>
        <td style="color:${netKafe >= 0 ? 'var(--success)' : 'var(--danger)'}; font-size:15px; font-weight:700;">
          <strong>${formatRp(netKafe)}</strong>
        </td>
      </tr>
    `;
  } else if (currentReportFilter === 'CUCI') {
    thead.innerHTML = `
      <tr>
        <th>Periode</th>
        <th>Jml Transaksi Cuci</th>
        <th>Unit Kendaraan Dicuci</th>
        <th>Total Omset Carwash</th>
        <th>Biaya Bahan Sabun & Cuci</th>
        <th>Estimasi Laba Carwash</th>
      </tr>
    `;
    tbody.innerHTML = `
      <tr>
        <td><strong>Hari Ini (${today})</strong></td>
        <td><span class="category-tag CUCI">Carwash</span> ${cuciTrxCount} Transaksi</td>
        <td><strong>${cuciUnitsDone} Kendaraan</strong></td>
        <td style="color:var(--text-main); font-weight:700;">${formatRp(totalCuci)}</td>
        <td style="color:var(--danger); font-weight:600;">-${formatRp(totalCuciExpense)}</td>
        <td style="color:${netCuci >= 0 ? 'var(--success)' : 'var(--danger)'}; font-size:15px; font-weight:700;">
          <strong>${formatRp(netCuci)}</strong>
        </td>
      </tr>
    `;
  } else {
    // ALL (Rekap Gabungan)
    thead.innerHTML = `
      <tr>
        <th>Periode</th>
        <th>Total Transaksi</th>
        <th>Porsi Kafe</th>
        <th>Porsi Carwash</th>
        <th>Total Omset (Kotor)</th>
        <th>Total Biaya Operasional</th>
        <th>Estimasi Laba Bersih</th>
      </tr>
    `;
    tbody.innerHTML = `
      <tr>
        <td><strong>Hari Ini (${today})</strong></td>
        <td>${history.length} Transaksi</td>
        <td><span class="category-tag KAFE">Kafe</span> <strong>${formatRp(totalKafe)}</strong></td>
        <td><span class="category-tag CUCI">Carwash</span> <strong>${formatRp(totalCuci)}</strong></td>
        <td style="font-weight:700; color:var(--text-main);">${formatRp(totalOmset)}</td>
        <td style="color:var(--danger); font-weight:600;">-${formatRp(totalExpenseAll)}</td>
        <td style="color:${netProfitAll >= 0 ? 'var(--success)' : 'var(--danger)'}; font-size:16px; font-weight:700;">
          <strong>${formatRp(netProfitAll)}</strong>
        </td>
      </tr>
    `;
  }
}

// --------------------------------------------------
// Dashboard Calculation
// --------------------------------------------------
function updateDashboardStats() {
  let totalKafe = 0;
  let totalCuci = 0;
  let totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const productCountMap = {};
  products.forEach(p => productCountMap[p.name] = { name: p.name, qty: 0 });
  
  history.forEach(trx => {
    if (trx.items && trx.items.length > 0) {
      trx.items.forEach(item => {
        if (item.category === 'KAFE') totalKafe += (item.price * item.qty);
        if (item.category === 'CUCI') totalCuci += (item.price * item.qty);
        if (productCountMap[item.name]) {
          productCountMap[item.name].qty += item.qty;
        } else {
          productCountMap[item.name] = { name: item.name, qty: item.qty };
        }
      });
    }
  });
  
  const totalOmset = totalKafe + totalCuci;
  const netProfit = totalOmset - totalExpense;
  
  const dashLabaEl = document.getElementById('dash-laba');
  if (dashLabaEl) dashLabaEl.textContent = formatRp(totalOmset);

  const dashNetEl = document.getElementById('dash-net-profit');
  if (dashNetEl) {
    dashNetEl.textContent = formatRp(netProfit);
    dashNetEl.style.color = netProfit >= 0 ? 'var(--success)' : 'var(--danger)';
  }

  const dashTrxCountEl = document.getElementById('dash-trx-count');
  if (dashTrxCountEl) dashTrxCountEl.textContent = `${history.length} Transaksi`;

  const dashKafeEl = document.getElementById('dash-kafe');
  if (dashKafeEl) dashKafeEl.textContent = formatRp(totalKafe);

  const dashCuciEl = document.getElementById('dash-cuci');
  if (dashCuciEl) dashCuciEl.textContent = formatRp(totalCuci);

  const dashPengeluaranEl = document.getElementById('dash-pengeluaran');
  if (dashPengeluaranEl) dashPengeluaranEl.textContent = formatRp(totalExpense);

  // Top Products List
  const dashTopProducts = document.getElementById('dash-top-products');
  if (dashTopProducts) {
    const sorted = Object.values(productCountMap)
      .filter(p => p.qty > 0)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
      
    if (sorted.length === 0) {
      dashTopProducts.innerHTML = `<li style="color:var(--text-muted); font-size:13px; padding:12px 0;">Belum ada produk terjual hari ini.</li>`;
    } else {
      dashTopProducts.innerHTML = sorted.map((p, idx) => `
        <li>
          <span><span class="rank-num">${idx + 1}</span> <strong>${p.name}</strong></span>
          <span style="color:var(--primary); font-weight:600;">${p.qty}x</span>
        </li>
      `).join('');
    }
  }

  // Recent Transactions in Dashboard
  const dashRecentTrx = document.getElementById('dash-recent-trx');
  if (dashRecentTrx) {
    const recents = history.slice(0, 5);
    if (recents.length === 0) {
      dashRecentTrx.innerHTML = `<li style="color:var(--text-muted); font-size:13px; padding:12px 0;">Belum ada transaksi.</li>`;
    } else {
      dashRecentTrx.innerHTML = recents.map(h => `
        <li>
          <span><strong>${h.id}</strong> <small style="color:var(--text-muted); margin-left:4px;">(${h.time})</small></span>
          <strong>${formatRp(h.total)}</strong>
        </li>
      `).join('');
    }
  }
}

// --------------------------------------------------
// Keyboard Shortcuts & Escape Handler (antislop-human)
// --------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    if (drawerMenu) drawerMenu.classList.remove('show');
  }
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault();
    if (document.getElementById('pos').classList.contains('active')) {
      searchInput.focus();
    }
  }
});

// --------------------------------------------------
// Export & Print Report Modal Logic
// --------------------------------------------------
let exportSelectedService = 'ALL';
let exportSelectedPeriod = 'today';
let exportSelectedFormat = 'PDF';

function getTrxDateObj(trx) {
  if (trx.timestamp) return new Date(trx.timestamp);
  if (trx.isoDate) return new Date(trx.isoDate + 'T00:00:00');
  if (trx.date) {
    const parts = trx.date.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  return new Date();
}

function filterTransactionsForExport(service, period, customStart, customEnd) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 86400000 - 1;

  return history.filter(trx => {
    // 1. Service filter
    const s = getTrxServices(trx);
    if (service === 'KAFE' && !s.hasKafe) return false;
    if (service === 'CUCI' && !s.hasCuci) return false;

    // 2. Period filter
    const trxDate = getTrxDateObj(trx);
    const trxTime = trxDate.getTime();

    if (period === 'today') {
      return trxTime >= startOfToday && trxTime <= endOfToday;
    } else if (period === 'yesterday') {
      const startOfYesterday = startOfToday - 86400000;
      const endOfYesterday = startOfToday - 1;
      return trxTime >= startOfYesterday && trxTime <= endOfYesterday;
    } else if (period === 'week') {
      const sevenDaysAgo = startOfToday - (6 * 86400000);
      return trxTime >= sevenDaysAgo && trxTime <= endOfToday;
    } else if (period === 'month') {
      return trxDate.getFullYear() === now.getFullYear() && trxDate.getMonth() === now.getMonth();
    } else if (period === 'custom') {
      if (customStart) {
        const [sy, sm, sd] = customStart.split('-').map(Number);
        const startTime = new Date(sy, sm - 1, sd, 0, 0, 0).getTime();
        if (trxTime < startTime) return false;
      }
      if (customEnd) {
        const [ey, em, ed] = customEnd.split('-').map(Number);
        const endTime = new Date(ey, em - 1, ed, 23, 59, 59).getTime();
        if (trxTime > endTime) return false;
      }
      return true;
    }
    // 'all'
    return true;
  });
}

function getPeriodLabel(period, customStart, customEnd) {
  const now = new Date();
  const todayStr = now.toLocaleDateString('id-ID');
  if (period === 'today') return `Hari Ini (${todayStr})`;
  if (period === 'yesterday') {
    const yest = new Date(now.getTime() - 86400000).toLocaleDateString('id-ID');
    return `Kemarin (${yest})`;
  }
  if (period === 'week') return '7 Hari Terakhir';
  if (period === 'month') {
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  if (period === 'custom') {
    return `${customStart || 'Awal'} s/d ${customEnd || 'Sekarang'}`;
  }
  return 'Semua Riwayat';
}

function getServiceLabel(service) {
  if (service === 'KAFE') return 'Kafe F&B';
  if (service === 'CUCI') return 'Carwash (Cuci Kendaraan)';
  return 'Gabungan (Semua Layanan)';
}

function updateExportModalPreview() {
  const customStart = document.getElementById('export-date-start')?.value || '';
  const customEnd = document.getElementById('export-date-end')?.value || '';
  const matching = filterTransactionsForExport(exportSelectedService, exportSelectedPeriod, customStart, customEnd);
  
  let totalFiltered = 0;
  matching.forEach(trx => {
    const s = getTrxServices(trx);
    if (exportSelectedService === 'KAFE') {
      totalFiltered += s.kafeTotal;
    } else if (exportSelectedService === 'CUCI') {
      totalFiltered += s.cuciTotal;
    } else {
      totalFiltered += trx.total;
    }
  });

  const countEl = document.getElementById('export-matched-count');
  const totalEl = document.getElementById('export-matched-total');
  if (countEl) countEl.textContent = `${matching.length} Transaksi`;
  if (totalEl) totalEl.textContent = formatRp(totalFiltered);

  // Update button text & icon based on format
  const btnText = document.getElementById('btn-process-text');
  const btnIcon = document.getElementById('btn-process-icon');
  if (btnText && btnIcon) {
    if (exportSelectedFormat === 'PDF') {
      btnText.textContent = 'Cetak / Simpan PDF';
      btnIcon.setAttribute('data-lucide', 'printer');
    } else {
      btnText.textContent = 'Unduh File Excel (.xls)';
      btnIcon.setAttribute('data-lucide', 'file-spreadsheet');
    }
    lucide.createIcons();
  }
}

function openExportReportModal() {
  // Sync selected service with current report tab if available
  if (currentReportFilter && ['ALL', 'KAFE', 'CUCI'].includes(currentReportFilter)) {
    exportSelectedService = currentReportFilter;
  }
  
  // Set active classes on service cards
  document.querySelectorAll('.service-options .export-radio-card').forEach(card => {
    card.classList.toggle('active', card.dataset.exportService === exportSelectedService);
  });

  // Set active format card
  document.querySelectorAll('.format-options .export-radio-card').forEach(card => {
    card.classList.toggle('active', card.dataset.exportFormat === exportSelectedFormat);
  });

  // Set period select
  const periodSelect = document.getElementById('export-period-select');
  if (periodSelect) periodSelect.value = exportSelectedPeriod;
  
  const customDateContainer = document.getElementById('export-custom-date-container');
  if (customDateContainer) {
    customDateContainer.style.display = exportSelectedPeriod === 'custom' ? 'grid' : 'none';
  }

  // Pre-fill default dates for custom if empty
  const todayIso = new Date().toISOString().split('T')[0];
  const startInput = document.getElementById('export-date-start');
  const endInput = document.getElementById('export-date-end');
  if (startInput && !startInput.value) startInput.value = todayIso;
  if (endInput && !endInput.value) endInput.value = todayIso;

  updateExportModalPreview();
  document.getElementById('modal-export-report').classList.add('show');
}

async function generatePdfReport(matchingTrx, service, periodLabel) {
  const serviceLabel = getServiceLabel(service);
  const now = new Date();
  const exportTimestamp = now.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  try {
    showToast('Memproses file PDF laporan...', 'info');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Header Logo & Company Info
    if (RAYA_LOGO_BLACK) {
      try {
        doc.addImage(RAYA_LOGO_BLACK, 'PNG', 14, 10, 32, 14);
      } catch (imgErr) {
        console.warn('Logo image render warning:', imgErr);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(7, 60, 100); // #073C64
    doc.text('RAYA KOFFIE & CARWASH', 50, 16);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 42, 67);
    doc.text('LAPORAN REKAPITULASI PENJUALAN', 50, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Daya Asri, TUBABA • IG: @raya_koffie_tubaba', 50, 27);

    // Divider Line
    doc.setDrawColor(217, 226, 236);
    doc.setLineWidth(0.4);
    doc.line(14, 30, 196, 30);

    // Info Parameter Box
    doc.setFillColor(246, 247, 249);
    doc.roundedRect(14, 33, 182, 14, 2, 2, 'F');

    doc.setFontSize(7.5);
    doc.setTextColor(130, 154, 177);
    doc.text('LAYANAN:', 18, 38);
    doc.text('PERIODE:', 75, 38);
    doc.text('DICETAK PADA:', 135, 38);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 42, 67);
    doc.text(serviceLabel, 18, 43);
    doc.text(periodLabel, 75, 43);
    doc.text(exportTimestamp, 135, 43);

    // Table Data Construction
    let grandTotal = 0;
    const tableData = matchingTrx.map((trx, index) => {
      const s = getTrxServices(trx);
      let displayTotal = trx.total;
      let relevantItems = trx.items || [];
      let kategoriLayanan = 'Kafe';

      if (service === 'KAFE') {
        displayTotal = s.kafeTotal;
        relevantItems = relevantItems.filter(i => i.category === 'KAFE');
        kategoriLayanan = 'Kafe F&B';
      } else if (service === 'CUCI') {
        displayTotal = s.cuciTotal;
        relevantItems = relevantItems.filter(i => i.category === 'CUCI');
        kategoriLayanan = 'Carwash';
      } else {
        if (s.hasKafe && s.hasCuci) {
          kategoriLayanan = 'Kafe + Cuci';
        } else if (s.hasCuci) {
          kategoriLayanan = 'Carwash';
        } else {
          kategoriLayanan = 'Kafe F&B';
        }
      }

      grandTotal += displayTotal;
      const itemsSummary = relevantItems.map(i => `${i.qty}x ${i.name}`).join(', ') || '-';

      return [
        index + 1,
        trx.id,
        `${trx.date}\n${trx.time} (${trx.type})`,
        kategoriLayanan,
        itemsSummary,
        trx.method,
        formatRp(displayTotal)
      ];
    });

    autoTable(doc, {
      startY: 50,
      head: [['No', 'ID Trx', 'Waktu & Tipe', 'Kategori', 'Rincian Item / Pesanan', 'Metode', 'Subtotal']],
      body: tableData.length > 0 ? tableData : [['-', '-', '-', '-', 'Tidak ada data transaksi.', '-', 'Rp 0']],
      foot: [
        ['', '', '', '', 'TOTAL REKAPITULASI PENJUALAN', '', formatRp(grandTotal)]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [7, 60, 100],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [16, 42, 67]
      },
      footStyles: {
        fillColor: [232, 238, 244],
        textColor: [7, 60, 100],
        fontStyle: 'bold',
        fontSize: 8.5
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 24 },
        2: { cellWidth: 26 },
        3: { cellWidth: 22 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    // Signature Area
    const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 200;
    const sigY = lastY > 245 ? 30 : lastY;
    if (lastY > 245) {
      doc.addPage();
    }

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(72, 101, 129);
    doc.text('Kasir / Pelaksana,', 30, sigY);
    doc.text('Manager / Owner,', 140, sigY);

    doc.setDrawColor(16, 42, 67);
    doc.setLineWidth(0.3);
    doc.line(22, sigY + 18, 62, sigY + 18);
    doc.line(132, sigY + 18, 172, sigY + 18);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 42, 67);
    doc.text('( Kasir Raya )', 28, sigY + 22);
    doc.text('( Owner Raya )', 138, sigY + 22);

    // Extract Base64 and Save Locally to Device
    const pdfDataUri = doc.output('datauristring');
    const pdfBase64 = pdfDataUri.split(',')[1];
    const safeService = service.toLowerCase();
    const safeDate = now.toISOString().split('T')[0];
    const fileName = `Laporan_RayaKoffie_${safeService}_${safeDate}.pdf`;

    const result = await saveFileToLocalDevice(fileName, pdfBase64, 'application/pdf', true);
    document.getElementById('modal-export-report').classList.remove('show');
    showToast(result.message, 'success');
  } catch (err) {
    console.error('PDF Generation Error:', err);
    showToast('Gagal membuat PDF: ' + err.message, 'error');
  }
}


async function generateExcelReport(matchingTrx, service, periodLabel) {
  const serviceLabel = getServiceLabel(service);
  const now = new Date();
  const exportTimestamp = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID');

  let grandTotal = 0;

  const rows = matchingTrx.map((trx, index) => {
    const s = getTrxServices(trx);
    let displayTotal = trx.total;
    let relevantItems = trx.items || [];
    let kategoriLayanan = 'Kafe';

    if (service === 'KAFE') {
      displayTotal = s.kafeTotal;
      relevantItems = relevantItems.filter(i => i.category === 'KAFE');
      kategoriLayanan = 'Kafe F&B';
    } else if (service === 'CUCI') {
      displayTotal = s.cuciTotal;
      relevantItems = relevantItems.filter(i => i.category === 'CUCI');
      kategoriLayanan = 'Carwash';
    } else {
      if (s.hasKafe && s.hasCuci) {
        kategoriLayanan = 'Kafe + Carwash';
      } else if (s.hasCuci) {
        kategoriLayanan = 'Carwash';
      } else {
        kategoriLayanan = 'Kafe F&B';
      }
    }

    grandTotal += displayTotal;
    const itemsText = relevantItems.map(i => `${i.qty}x ${i.name} (@Rp ${i.price.toLocaleString('id-ID')})`).join('; ');

    return `
      <tr>
        <td style="text-align:center;">${index + 1}</td>
        <td style="text-align:center;">${trx.id}</td>
        <td style="text-align:center;">${trx.date}</td>
        <td style="text-align:center;">${trx.time}</td>
        <td>${trx.type}</td>
        <td>${trx.ref || '-'}</td>
        <td>${kategoriLayanan}</td>
        <td>${itemsText}</td>
        <td style="text-align:center;">${trx.method}</td>
        <td style="text-align:right;">${displayTotal}</td>
      </tr>
    `;
  }).join('');

  const excelContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Rekap Penjualan</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Arial, sans-serif; font-size: 10pt; }
        table { border-collapse: collapse; }
        .header-title { font-size: 14pt; font-weight: bold; color: #073C64; }
        .meta-label { font-weight: bold; color: #486581; }
        th { background-color: #073C64; color: #FFFFFF; font-weight: bold; border: 1px solid #B4C9DC; padding: 8px 10px; font-size: 10pt; }
        td { border: 1px solid #D9E2EC; padding: 6px 8px; }
        .total-cell { background-color: #E8EEF4; font-weight: bold; color: #073C64; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="2" rowspan="3" style="vertical-align:middle; text-align:center; padding:8px; background:#ffffff; border:none;">
            <img src="${RAYA_LOGO_DARK}" width="150" height="65" alt="Raya Koffie Logo" style="display:block; margin:auto;" />
          </td>
          <td colspan="8" class="header-title" style="font-size:16pt; font-weight:bold; color:#073C64; vertical-align:bottom; border:none;">
            RAYA KOFFIE & CARWASH
          </td>
        </tr>
        <tr>
          <td colspan="8" style="font-size:12pt; font-weight:bold; color:#102A43; border:none;">
            LAPORAN REKAPITULASI PENJUALAN
          </td>
        </tr>
        <tr>
          <td colspan="8" style="color:#555555; font-size:9.5pt; border:none;">
            Daya Asri, TUBABA • IG: @raya_koffie_tubaba
          </td>
        </tr>
        <tr><td colspan="10" style="border:none; height:10px;"></td></tr>
        <tr>
          <td class="meta-label">Rekapan Layanan:</td>
          <td colspan="3">${serviceLabel}</td>
          <td class="meta-label">Total Transaksi:</td>
          <td>${matchingTrx.length}</td>
          <td colspan="4"></td>
        </tr>
        <tr>
          <td class="meta-label">Periode Rekap:</td>
          <td colspan="3">${periodLabel}</td>
          <td class="meta-label">Total Omset:</td>
          <td style="font-weight:bold; color:#073C64;">Rp ${grandTotal.toLocaleString('id-ID')}</td>
          <td colspan="4"></td>
        </tr>
        <tr>
          <td class="meta-label">Waktu Ekspor:</td>
          <td colspan="3">${exportTimestamp} WIB</td>
          <td colspan="6"></td>
        </tr>
        <tr><td colspan="10"></td></tr>
        <thead>
          <tr>
            <th>No</th>
            <th>ID Transaksi</th>
            <th>Tanggal</th>
            <th>Jam</th>
            <th>Tipe Pesanan</th>
            <th>Ref / Meja / Plat</th>
            <th>Layanan</th>
            <th>Rincian Item (Menu / Paket Cuci)</th>
            <th>Metode Bayar</th>
            <th>Total (Rp)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="9" class="total-cell" style="text-align:right;">TOTAL KESELURUHAN:</td>
            <td class="total-cell" style="text-align:right;">Rp ${grandTotal.toLocaleString('id-ID')}</td>
          </tr>
        </tfoot>
      </table>
    </body>
    </html>
  `;

  const safeService = service.toLowerCase();
  const safeDate = now.toISOString().split('T')[0];
  const fileName = `Rekap_RayaKoffie_${safeService}_${safeDate}.xls`;

  try {
    showToast('Menyimpan file rekap Excel ke memori lokal...', 'info');
    const result = await saveFileToLocalDevice(fileName, excelContent, 'application/vnd.ms-excel');
    document.getElementById('modal-export-report').classList.remove('show');
    showToast(result.message, 'success');
  } catch (err) {
    showToast('Gagal menyimpan file: ' + err.message, 'error');
  }
}

function processExport() {
  const customStart = document.getElementById('export-date-start')?.value || '';
  const customEnd = document.getElementById('export-date-end')?.value || '';
  const matching = filterTransactionsForExport(exportSelectedService, exportSelectedPeriod, customStart, customEnd);
  const periodLabel = getPeriodLabel(exportSelectedPeriod, customStart, customEnd);

  if (matching.length === 0) {
    if (!confirm('Tidak ada data transaksi yang cocok dengan filter yang dipilih. Tetap lanjutkan cetak/ekspor?')) {
      return;
    }
  }

  if (exportSelectedFormat === 'PDF') {
    generatePdfReport(matching, exportSelectedService, periodLabel);
  } else {
    generateExcelReport(matching, exportSelectedService, periodLabel);
  }

}

// --------------------------------------------------
// Global Exposures & Initial Run
// --------------------------------------------------
window.updateCartQty = updateCartQty;
window.deleteMenu = deleteMenu;
window.openEditMenu = openEditMenu;
window.openEditTrx = openEditTrx;
window.changeEditTrxItemQty = changeEditTrxItemQty;
window.removeEditTrxItem = removeEditTrxItem;
window.openExportReportModal = openExportReportModal;
window.openAddExpenseModal = openAddExpenseModal;
window.openEditExpense = openEditExpense;
window.deleteExpense = deleteExpense;
window.confirmReimbursement = confirmReimbursement;
window.openAddUserModal = openAddUserModal;
window.closeAddUserModal = closeAddUserModal;
window.saveNewUser = saveNewUser;
window.openEditUserModal = openEditUserModal;
window.closeEditUserModal = closeEditUserModal;
window.saveEditUser = saveEditUser;
window.deleteUser = deleteUser;

// User Management Modal Forms
document.getElementById('form-add-user')?.addEventListener('submit', (e) => {
  e.preventDefault();
  saveNewUser();
});
document.getElementById('btn-save-new-user')?.addEventListener('click', (e) => {
  e.preventDefault();
  saveNewUser();
});

document.getElementById('form-edit-user')?.addEventListener('submit', (e) => {
  e.preventDefault();
  saveEditUser();
});
document.getElementById('btn-save-edit-user')?.addEventListener('click', (e) => {
  e.preventDefault();
  saveEditUser();
});

// Open Export Modal
const btnOpenExport = document.getElementById('btn-open-export-modal');
if (btnOpenExport) {
  btnOpenExport.addEventListener('click', openExportReportModal);
}

// Service Radio Cards in Export Modal
document.querySelectorAll('.service-options .export-radio-card').forEach(card => {
  card.addEventListener('click', (e) => {
    document.querySelectorAll('.service-options .export-radio-card').forEach(c => c.classList.remove('active'));
    e.currentTarget.classList.add('active');
    exportSelectedService = e.currentTarget.dataset.exportService;
    updateExportModalPreview();
  });
});

// Format Radio Cards in Export Modal
document.querySelectorAll('.format-options .export-radio-card').forEach(card => {
  card.addEventListener('click', (e) => {
    document.querySelectorAll('.format-options .export-radio-card').forEach(c => c.classList.remove('active'));
    e.currentTarget.classList.add('active');
    exportSelectedFormat = e.currentTarget.dataset.exportFormat;
    updateExportModalPreview();
  });
});

// Period Select in Export Modal
const exportPeriodSelect = document.getElementById('export-period-select');
if (exportPeriodSelect) {
  exportPeriodSelect.addEventListener('change', (e) => {
    exportSelectedPeriod = e.target.value;
    const customContainer = document.getElementById('export-custom-date-container');
    if (customContainer) {
      customContainer.style.display = exportSelectedPeriod === 'custom' ? 'grid' : 'none';
    }
    updateExportModalPreview();
  });
}

// Custom Date Inputs
document.getElementById('export-date-start')?.addEventListener('input', updateExportModalPreview);
document.getElementById('export-date-end')?.addEventListener('input', updateExportModalPreview);

// Process Export Button
document.getElementById('btn-process-export')?.addEventListener('click', processExport);

// History Service Filter Tabs
document.querySelectorAll('.service-tab-btn[data-service]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.service-tab-btn[data-service]').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentHistoryFilter = e.currentTarget.dataset.service;
    renderHistory();
  });
});

// Reports Service Filter Tabs
document.querySelectorAll('.service-tab-btn[data-report-service]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.service-tab-btn[data-report-service]').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentReportFilter = e.currentTarget.dataset.reportService;
    renderReports();
  });
});

// Expense Filter Tabs & Touch-Scrollable Filter Chips
document.querySelectorAll('.filter-chip[data-expense-filter], .service-tab-btn[data-expense-filter]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.filter-chip[data-expense-filter], .service-tab-btn[data-expense-filter]').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentExpenseFilter = e.currentTarget.dataset.expenseFilter;
    renderExpense();
  });
});

// Multi-Tab & Window Database Synchronization
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEYS.HISTORY) {
    history = loadStorage(STORAGE_KEYS.HISTORY, defaultHistory);
    updateDashboardStats();
    renderHistory();
    renderReports();
  }
  if (e.key === STORAGE_KEYS.PRODUCTS) {
    products = loadStorage(STORAGE_KEYS.PRODUCTS, defaultProducts);
    renderPOS();
    renderMenuTable();
  }
  if (e.key === STORAGE_KEYS.EXPENSES) {
    expenses = loadStorage(STORAGE_KEYS.EXPENSES, defaultExpenses).map(normalizeExpense);
    renderExpense();
    updateDashboardStats();
    renderReports();
  }
  if (e.key === STORAGE_KEYS.TAXES) {
    taxes = loadStorage(STORAGE_KEYS.TAXES, defaultTaxes);
    renderTaxes();
    updateCart();
  }
  if (e.key === STORAGE_KEYS.USERS) {
    users = loadStorage(STORAGE_KEYS.USERS, defaultUsers);
    renderUsers();
  }
});

renderPOS();
updateCart();
renderMenuTable();
renderHistory();
renderExpense();
renderTaxes();
renderReports();
renderUsers();
updateDashboardStats();
