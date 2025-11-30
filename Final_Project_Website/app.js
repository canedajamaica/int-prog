/* ========= app.js =========
 - Loads products.json
 - Renders product cards
 - Cart with localStorage
 - Mini-cart floating preview (on add)
 - Product detail modal
 - Checkout with form validation and POST to server
 - Scroll reveal with staggered delays
 - Contact form simulated & saved locally
 - Welcome Modal
 - Falling Petals
============================ */

const PRODUCTS_JSON = "products.json";
const CART_KEY = "bloomhaven_cart_v1";

/* ---------- UTIL ---------- */
function qs(sel) {
  return document.querySelector(sel)
}
function qsa(sel) {
  return Array.from(document.querySelectorAll(sel))
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

/* ---------- SCROLL ANIMATIONS (stagger) ---------- */
function checkScroll() {
  const items = qsa('.scroll-animate');
  const vh = window.innerHeight;

  items.forEach((el, idx) => {
    const top = el.getBoundingClientRect().top;

    // Check if the element is currently visible in the viewport (85% up)
    if (top < vh - 80) {

      // Determine the transition delay
      if (el.classList.contains('product')) {
        // Products already have their delay set in renderProductGrid, 
        // but we ensure it's calculated based on their original index in the grid.
        // NOTE: We rely on the initial delay set in renderProductGrid, but 
        // if this check runs first, it uses the global index 'idx'.
        // To be safe and ensure new content (FAQ/About) loads instantly, 
        // we explicitly set the delay for non-products to 0.
      } else {
        // New sections (.about-us, .faqs, .contact) should animate in immediately 
        // when they enter view, without a staggered delay.
        el.style.transitionDelay = '0s';
      }

      // Add the visible class to trigger the CSS animation
      el.classList.add('visible');
    }
    // NOTE: We don't remove 'visible' on scroll up to prevent re-triggering animations endlessly.
  });
}
window.addEventListener('load', checkScroll);
window.addEventListener('scroll', checkScroll);

// --- Products storage must be outside loadProducts for cart/modal access ---
let products = [];


/* ---------- CART (localStorage) ---------- */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return []
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartCount();
}

/* add item */
function addToCart(product) {
  const cart = getCart();
  const found = cart.find(i => i.id === product.id);
  if (found) {
    found.qty += 1;
  } else {
    cart.push({
      ...product,
      qty: 1
    });
  }
  saveCart(cart);
  showMiniCart(product);
  showToast(`${product.name} added to cart 🛒`);
  renderCartItems(); // update drawer UI
}

/* remove item */
function removeFromCart(id) {
  let cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  renderCartItems();
}

/* change qty */
function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) item.qty = 1;
  saveCart(cart);
  renderCartItems();
}

/* count */
function renderCartCount() {
  const cart = getCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const el = qs('#cartCount');
  if (el) el.innerText = count;
}

/* render cart drawer */
function renderCartItems() {
  const container = qs('#cartItems');
  container.innerHTML = "";
  const cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
        <div class="meta">
          <h4>${escapeHtml(item.name)}</h4>
          <p>₱${(item.price).toFixed(2)} × ${item.qty} = ₱${(item.price * item.qty).toFixed(2)}</p>
        </div>
        <div class="actions">
          <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
          <br>
          <button class="remove-btn" data-remove="${item.id}">Remove</button>
        </div>
      `;
      container.appendChild(div);
    });
  }
  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
  qs('#cartTotal').innerText = `₱${total.toFixed(2)}`;
  renderCartCount();
}

/* delegate cart clicks for qty + remove */
document.addEventListener('click', (e) => {
  const dec = e.target.closest('[data-action="dec"]');
  const inc = e.target.closest('[data-action="inc"]');
  const rem = e.target.closest('[data-remove]');
  if (dec) changeQty(Number(dec.dataset.id), -1);
  if (inc) changeQty(Number(inc.dataset.id), 1);
  if (rem) removeFromCart(Number(rem.dataset.remove));
});

/* ---------- MINI-CART PREVIEW ---------- */
let miniTimer = null;
function showMiniCart(product) {
  const mini = qs('#miniCart');
  mini.innerHTML = `
    <div class="mini-row">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      <div class="mini-info">
        <h4>${escapeHtml(product.name)}</h4>
        <p>Added to cart • ₱${product.price.toFixed(2)}</p>
      </div>
    </div>
  `;
  mini.classList.remove('hidden');
  mini.classList.add('visible');
  mini.setAttribute('aria-hidden', 'false');
  if (miniTimer) clearTimeout(miniTimer);
  miniTimer = setTimeout(() => {
    mini.classList.remove('visible');
    mini.classList.add('hidden');
    mini.setAttribute('aria-hidden', 'true');
  }, 2200);
}

/* ---------- CART DRAWER UI ---------- */
const openCartBtn = qs('#openCartBtn');
const closeCartBtn = qs('#closeCartBtn');
const cartDrawer = qs('#cartDrawer');
const cartOverlay = qs('#cartOverlay');

openCartBtn.addEventListener('click', () => {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  renderCartItems();
});

closeCartBtn.addEventListener('click', () => {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
});
cartOverlay.addEventListener('click', () => {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
});

/* ---------- PRODUCT DETAIL MODAL ---------- */
const modal = qs('#productModal');
const closeModal = qs('#closeModal');
function openProductModal(product) {
  qs('#modalImage').src = `${escapeHtml(product.image)}`;
  qs('#modalImage').alt = product.name;
  qs('#modalName').innerText = product.name;
  qs('#modalCategory').innerText = product.category;
  qs('#modalDesc').innerText = product.description;
  qs('#modalPrice').innerText = `₱${product.price.toFixed(2)}`;
  qs('#modalAddToCart').onclick = () => {
    addToCart(product);
    closeProductModal();
  };
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}
function closeProductModal() {
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}
closeModal.addEventListener('click', closeProductModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeProductModal();
});

/* ---------- LOAD PRODUCTS FROM JSON ---------- */
async function loadProducts() {
  try {
    const res = await fetch(PRODUCTS_JSON, {
      cache: 'no-cache'
    });
    if (!res.ok) throw new Error('Failed to load products');
    products = await res.json(); // Store loaded products globally
    renderProductGrid(products);
  } catch (err) {
    console.error(err);
    qs('#productGrid').innerHTML = "<p>Unable to load products. Check your 'products.json' file and file path.</p>";
  }
}
function renderProductGrid(products) {
  const grid = qs('#productGrid');
  grid.innerHTML = "";
  products.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'product scroll-animate';
    // Set delay on the product card itself
    card.style.transitionDelay = `${index * 0.12}s`;
    card.innerHTML = `
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
      <h3>${escapeHtml(item.name)}</h3>
      <p class="muted">${escapeHtml(item.category)}</p>
      <div class="meta-row">
        <p class="price">₱${item.price.toFixed(2)}</p>
        <div class="actions">
          <button class="viewBtn">View</button>
          <button class="addCart addCartBtn">Add</button>
        </div>
      </div>
    `;
    card.querySelector('.viewBtn').addEventListener('click', () => openProductModal(item));
    card.querySelector('.addCartBtn').addEventListener('click', () => addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image // <-- Use 'image' key here
    }));
    grid.appendChild(card);
  });
  checkScroll(); // Trigger checkScroll after grid render
  renderCartCount();
}
loadProducts(); // Execute the load function on startup

/* ---------- CONTACT FORM & DASHBOARD STORAGE ---------- */
let contactMessages = JSON.parse(localStorage.getItem('bloomhaven_contacts_v1')) || []; // load saved messages

const contactForm = qs('#contactForm');
const statusEl = qs('#status');
const contactListDash = qs('#contactListDash'); // dashboard display

// Initialize dashboard on page load
updateContactDashboard();

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = qs('#name').value.trim();
  const email = qs('#email').value.trim();
  const message = qs('#message').value.trim();

  if (!name || !email || !message) {
    showToast('Please complete all fields.', true);
    return;
  }

  // Add message to array
  const newMsg = {
    id: contactMessages.length > 0 ? contactMessages[contactMessages.length - 1].id + 1 : 1,
    name,
    email,
    message,
    date: new Date().toLocaleString()
  };
  contactMessages.push(newMsg);

  // Save to localStorage
  localStorage.setItem('bloomhaven_contacts_v1', JSON.stringify(contactMessages));

  // Update contact dashboard
  updateContactDashboard();

  contactForm.reset();
  showToast('Message sent! 🌸');
});

function updateContactDashboard() {
  if (!contactListDash) return;
  contactListDash.innerHTML = '';
  if (contactMessages.length === 0) {
    contactListDash.innerHTML = '<li>No messages yet.</li>';
  } else {
    contactMessages.forEach(msg => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${escapeHtml(msg.name)}</strong> (${escapeHtml(msg.email)})<br>
        ${escapeHtml(msg.message)} 
        <em style="font-size:0.8rem;color:#666;">${msg.date}</em>
        <button class="delete-msg" data-id="${msg.id}" 
          style="margin-left:10px;padding:2px 6px;font-size:0.75rem;background:#f44336;color:#fff;border:none;border-radius:4px;cursor:pointer;">Delete</button>
      `;
      contactListDash.appendChild(li);
    });

    // Add delete functionality
    qsa('.delete-msg').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        contactMessages = contactMessages.filter(m => m.id !== id);
        localStorage.setItem('bloomhaven_contacts_v1', JSON.stringify(contactMessages));
        updateContactDashboard();
        showToast('Message deleted', true);
      });
    });
  }
}


/* ---------- GENERIC TOAST FUNCTION ---------- */
function showToast(text, isError = false) {
  const t = document.createElement('div');
  t.classList.add('toast');
  if (isError) t.classList.add('error');

  // Using inline styles for quick implementation, but classes are preferred for production
  t.style.background = isError ? '#f44336' : 'var(--accent, #ff8fb8)';
  t.style.color = '#fff';

  t.innerText = text;
  document.body.appendChild(t);

  // Use class for animation trigger (defined in CSS)
  requestAnimationFrame(() => {
    t.classList.add('visible');
  });

  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.remove(), 300);
  }, 1800);
}

/* ---------- CHECKOUT (simulated, no server) ---------- */
const checkoutBtn = qs('#checkoutBtn');
const checkoutForm = qs('#checkoutForm');
const cancelCheckout = qs('#cancelCheckout');
const checkoutStatus = qs('#checkoutStatus');

checkoutBtn.addEventListener('click', () => {
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty!', true);
    return;
  }
  checkoutForm.classList.remove('hidden');
});

cancelCheckout.addEventListener('click', () => {
  checkoutForm.classList.add('hidden');
  checkoutStatus.innerText = '';
});

/* Validate checkout form fields */
function validateCheckout() {
  let ok = true;
  const name = qs('#buyerName').value.trim();
  const email = qs('#buyerEmail').value.trim();
  const phone = qs('#buyerPhone').value.trim();
  qs('#errName').innerText = '';
  qs('#errEmail').innerText = '';
  qs('#errPhone').innerText = '';

  if (name.length < 2) {
    qs('#errName').innerText = 'Enter full name';
    ok = false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    qs('#errEmail').innerText = 'Enter valid email';
    ok = false;
  }
  if (phone && !/^[0-9+\-\s]{6,20}$/.test(phone)) {
    qs('#errPhone').innerText = 'Enter valid phone';
    ok = false;
  }

  return ok;
}

/* Submit checkout */
checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateCheckout()) return;

  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);

  checkoutStatus.innerText = 'Processing order... 🌸';
  setTimeout(() => {
    const orderId = Math.floor(Math.random() * 1000000);
    checkoutStatus.innerText = `Order placed! 🌸 Total: ₱${total.toFixed(2)} | Order ID: ${orderId}`;
    localStorage.removeItem(CART_KEY);
    renderCartItems();
    showToast('Order placed — thank you! 🌸');

    setTimeout(() => {
      checkoutForm.classList.add('hidden');
      checkoutStatus.innerText = '';
      checkoutForm.reset();
    }, 1800);
  }, 1200);
});

// *** WELCOME MODAL LOGIC ***
function showWelcomeModal() {
  const modal = qs('#welcomeModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.remove('closing');
}

// Welcome Modal Close Handler
const startShoppingBtn = qs('#closeWelcomeModal');
const welcomeModal = qs('#welcomeModal');
if (startShoppingBtn && welcomeModal) {
  startShoppingBtn.addEventListener('click', () => {
    welcomeModal.classList.add('closing'); // Trigger CSS exit animation
    // Hide the element completely after animation
    setTimeout(() => {
      welcomeModal.classList.add('hidden');
    }, 400); 
  });
}


// ====== Falling Petals Script ======
const petalsContainer = document.getElementById('petalsContainer');
const numPetals = 40; // number of petals

if (petalsContainer) { // Ensure the container exists before running the loop
    for (let i = 0; i < numPetals; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';

        // Random horizontal start
        petal.style.left = `${Math.random() * 100}vw`;

        // Random size
        const size = 15 + Math.random() * 20;
        petal.style.width = `${size}px`;
        petal.style.height = `${size}px`;

        // Random animation duration and delay
        petal.style.animationDuration = `${5 + Math.random() * 5}s`;
        petal.style.animationDelay = `${Math.random() * 5}s`;

        petalsContainer.appendChild(petal);
    }
}


// *** FINAL INITIALIZATION ***
(function init() {
  renderCartCount();
  // We only show the modal if the 'loadProducts' promise has started fetching data, 
  // but for simplicity, we keep it here to ensure it runs immediately.
  showWelcomeModal(); 
})();
