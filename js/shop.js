const supabaseUrl = 'https://tjscjrcqgfmoknpwbpqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc2NqcmNxZ2Ztb2tucHdicHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzQ3ODQsImV4cCI6MjA5MDExMDc4NH0.a7Jz1ja0LxkSn33stddWcL30AD4Q3inFTbA7lukZBx8';
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

window.Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

let allProducts = [];
window.cart = JSON.parse(localStorage.getItem('pinky_cart')) || [];
window.currentUser = null;
window.userWishlist = [];

// ==========================================
// 🚀 بداية التشغيل
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    try { window.updateCartUI(); } catch(e){}
    try { await checkUser(); } catch(e){}
    
    // سحب المنتجات بالدالة الصحيحة
    await fetchShopProducts();

    // تشغيل الفلاتر من الرابط
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const searchWord = urlParams.get('search');
        if (searchWord) {
            const searchInput = document.getElementById('shop-page-search') || document.getElementById('live-search-input');
            if (searchInput) searchInput.value = searchWord;
        }
    } catch(e){}
});

async function checkUser() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
        window.currentUser = session.user;
        const { data: wishlistData } = await window.supabaseClient.from('wishlist').select('product_id').eq('user_id', window.currentUser.id);
        if (wishlistData) window.userWishlist = wishlistData.map(w => w.product_id);
    }
}

// ==========================================
// 🚀 سحب المنتجات ورسمها
// ==========================================
async function fetchShopProducts() {
    const grid = document.getElementById('shop-grid-container') || document.querySelector('.shop-grid');
    if (grid) grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px; color: #888;"><span data-i18n="loading">Loading...</span> <i class="fas fa-spinner fa-spin"></i></div>';

    try {
        const { data: products, error } = await window.supabaseClient.from('products').select('*');
        
        if (error || !products || products.length === 0) {
            if (grid) grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px; color: #888;" data-i18n="noProducts">No products available currently.</div>';
            return;
        }

        allProducts = products;
        generateFilters(products);
        window.applyFilters();
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

function generateFilters(products) {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const brandSelect = document.getElementById('brand-filter');
    if(!brandSelect) return;

    let optionsHTML = '<option value="all" data-i18n="allBrands">All Brands</option>';
    brands.forEach(brand => { optionsHTML += `<option value="${brand}">${brand}</option>`; });
    brandSelect.innerHTML = optionsHTML;
}

window.applyFilters = function() {
    let filteredProducts = [...allProducts];

    const searchInput = document.getElementById('shop-page-search') || document.getElementById('live-search-input');
    if (searchInput && searchInput.value) {
        const term = searchInput.value.toLowerCase().trim();
        filteredProducts = filteredProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(term)) || 
            (p.brand && p.brand.toLowerCase().includes(term))
        );
    }

    const brandSelect = document.getElementById('brand-filter');
    if (brandSelect && brandSelect.value !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.brand === brandSelect.value);
    }

    const sortSelect = document.getElementById('price-sort');
    if (sortSelect) {
        if (sortSelect.value === 'low') filteredProducts.sort((a, b) => a.price - b.price);
        if (sortSelect.value === 'high') filteredProducts.sort((a, b) => b.price - a.price);
    }

    renderProducts(filteredProducts);
}

function renderProducts(products) {
    const grid = document.getElementById('shop-grid-container') || document.getElementById('shop-grid') || document.querySelector('.product-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    const countSpan = document.getElementById('results-count');
    if(countSpan) countSpan.innerText = `Showing ${products.length} products`;

    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 50px; font-size: 16px; color: #888;" data-i18n="noProducts">No products match your criteria 🥺</div>';
        return;
    }

    products.forEach(p => {
        let priceHTML = `<p class="price" style="margin: 0; font-size: 16px; font-weight: bold; color: #111;">${p.price} EGP</p>`;
        if (p.original_price && p.original_price > p.price) {
            priceHTML = `<p class="price" style="margin: 0; font-size: 16px; font-weight: bold; color: #f15a97;"><span style="text-decoration: line-through; color: #aaa; font-size: 13px; margin-right: 8px;">${p.original_price} EGP</span>${p.price} EGP</p>`;
        }
        
        const isWished = window.userWishlist.includes(p.id) ? 'active' : '';

        // شيلنا كلاس الإخفاء وضفنا opacity: 1 عشان تظهر غصب عنها
        grid.innerHTML += `
            <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer; border: 1px solid #eee; border-radius: 12px; padding: 15px; text-align: center; position: relative; background: #fff; transition: 0.3s; opacity: 1; visibility: visible;">
                <button class="wishlist-btn ${isWished}" onclick="toggleWishlist(event, '${p.id}', this)" style="position: absolute; top: 15px; right: 15px; border: none; background: #fff; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.1); font-size: 18px; cursor: pointer; color: ${isWished ? '#f15a97' : '#ccc'}; z-index: 10;"><i class="fas fa-heart"></i></button>
                <img src="${p.image_url}" alt="${p.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
                <span style="font-size: 12px; color: var(--primary-color); font-weight: bold; text-transform: uppercase;">${p.brand || 'Pinky Promise'}</span>
                <h3 style="font-size: 16px; margin: 5px 0 10px 0; color: #222;">${p.name}</h3>
                ${priceHTML}
                <button onclick="event.stopPropagation(); addToCart('${p.id}')" style="width: 100%; padding: 12px; margin-top: 15px; background: #111; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#f15a97'" onmouseout="this.style.background='#111'">Add to Cart <i class="fas fa-shopping-bag"></i></button>
            </div>
        `;
    });
}

// ==========================================
// 🚀 المفضلة والسلة
// ==========================================
window.toggleWishlist = async function(event, productId, btnElement) {
    event.stopPropagation(); 
    if (!window.currentUser) return window.Toast.fire({ icon: 'info', title: 'Please login first' });
    const isWished = btnElement.classList.contains('active');
    if (isWished) {
        btnElement.classList.remove('active');
        btnElement.style.color = '#ccc';
        window.userWishlist = window.userWishlist.filter(id => id !== productId);
        await window.supabaseClient.from('wishlist').delete().match({ user_id: window.currentUser.id, product_id: productId });
    } else {
        btnElement.classList.add('active');
        btnElement.style.color = '#f15a97';
        window.userWishlist.push(productId);
        await window.supabaseClient.from('wishlist').insert([{ user_id: window.currentUser.id, product_id: productId }]);
    }
}

window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const existing = window.cart.find(item => item.id === productId);
    if (existing) existing.qty += 1; else window.cart.push({ ...product, qty: 1 });
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    if (typeof window.updateCartUI === 'function') window.updateCartUI();
    window.openCart(); 
}

window.changeCartItemQty = function(productId, change) {
    const item = window.cart.find(p => p.id === productId);
    if (!item) return;
    let newQty = item.qty + change;
    if (newQty > item.stock_quantity) return window.Toast.fire({ icon: 'warning', title: 'Exceeds stock!' });
    if (newQty < 1) newQty = 1;
    item.qty = newQty;
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    if (typeof window.updateCartUI === 'function') window.updateCartUI();
}

window.removeFromCart = function(productId) {
    window.cart = window.cart.filter(item => item.id !== productId);
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    if (typeof window.updateCartUI === 'function') window.updateCartUI();
}

window.openCart = function() { 
    document.getElementById('cart-drawer')?.classList.add('open'); 
    document.getElementById('cart-overlay')?.classList.add('show'); 
}
window.closeCart = function() { 
    document.getElementById('cart-drawer')?.classList.remove('open'); 
    document.getElementById('cart-overlay')?.classList.remove('show'); 
}
window.goToCheckout = function() { 
    if (window.cart.length === 0) return window.Toast.fire({ icon: 'warning', title: 'Cart is empty!' }); 
    window.location.href = 'checkout.html'; 
}

window.updateCartUI = function() {
    try {
        const container = document.getElementById('cart-items-container');
        if(!container) return;
        
        container.innerHTML = ''; 
        let total = 0; 
        let itemCount = 0;

        // قراءة لغة الموقع الحالية
        const lang = localStorage.getItem('pinky_lang') || 'en';

        // تجهيز الكلمات باللغتين للسلة
        const textEmpty = lang === 'ar' ? 'سلة المشتريات فارغة 🥺' : 'Your cart is empty 🥺';
        const textAdd = lang === 'ar' ? 'أضف' : 'Add';
        const textForFree = lang === 'ar' ? 'للحصول على شحن مجاني!' : 'for Free Shipping!';
        const textUnlocked = lang === 'ar' ? 'مبروك! لقد حصلت على شحن مجاني 🚚' : 'Free shipping unlocked! 🚚';
        const textRemove = lang === 'ar' ? 'إزالة' : 'Remove';

        if (window.cart.length === 0) {
            container.innerHTML = `<div style="padding: 30px; text-align: center; color: #888; font-weight: bold; font-size: 16px;">${textEmpty}</div>`;
        } else {
            window.cart.forEach(item => {
                total += (item.price * item.qty); 
                itemCount += item.qty;
                container.innerHTML += `
                <div style="display: flex; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                    <img src="${item.image_url}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #111;">${item.name}</div>
                        <div style="color: var(--primary-color); font-size: 14px; font-weight: 900; margin-bottom: 10px;">${item.price} EGP</div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 6px; padding: 2px 8px;">
                                <button onclick="changeCartItemQty('${item.id}', -1)" style="border:none; background:transparent; cursor:pointer; font-size:18px; font-weight:bold; color:#555;">-</button>
                                <span style="font-size: 14px; font-weight:bold; min-width:20px; text-align:center;">${item.qty}</span>
                                <button onclick="changeCartItemQty('${item.id}', 1)" style="border:none; background:transparent; cursor:pointer; font-size:16px; font-weight:bold; color:#555;">+</button>
                            </div>
                            <span onclick="removeFromCart('${item.id}')" style="color: #d32f2f; cursor: pointer; font-size: 13px; font-weight: bold; padding: 5px;" title="Remove"><i class="fas fa-trash-alt"></i> ${textRemove}</span>
                        </div>
                    </div>
                </div>`;
            });
        }

        // تعريف المتغيرات هنا عشان ميضربش الـ Error اللي في الصورة
        const countSpan = document.getElementById('cart-count');
        const floatCountSpan = document.getElementById('float-cart-count');
        const totalSpan = document.getElementById('cart-total-price');
        const progressFill = document.getElementById('shipping-fill');
        const amountLeftSpan = document.getElementById('amount-left');

        // تحديث الأرقام
        if(countSpan) countSpan.innerText = itemCount; 
        if(floatCountSpan) floatCountSpan.innerText = itemCount; 
        if(totalSpan) totalSpan.innerText = total.toLocaleString() + ' EGP';
        
        // شريط الشحن
        if (total >= 2000) {
            if(amountLeftSpan) amountLeftSpan.parentElement.innerHTML = `<span style="color: #2EA043; font-weight: bold;">${textUnlocked}</span>`;
            if(progressFill) { progressFill.style.width = '100%'; progressFill.style.background = '#2EA043'; }
        } else {
            const left = 2000 - total;
            if(amountLeftSpan) {
                amountLeftSpan.parentElement.innerHTML = `${textAdd} <span style="color: red; font-weight: bold; margin: 0 5px;">${left.toLocaleString()} EGP</span> ${textForFree}`;
            }
            if(progressFill) { progressFill.style.width = (total / 2000) * 100 + '%'; progressFill.style.background = '#111'; }
        }
        
        // إعادة تفعيل الترجمة للكلمات الثابتة في السلة (زي Checkout و Total)
        if(typeof applyLanguage === 'function') applyLanguage(lang);

    } catch (err) {
        console.error("Cart UI Error:", err);
    }
}

window.handleUserIconClick = async function() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    window.location.href = session ? 'profile.html' : 'account.html';
}