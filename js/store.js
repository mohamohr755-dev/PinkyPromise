// ============================================================
// الإعدادات الأساسية
// ============================================================
const WHATSAPP_NUMBER = '201000000000'; // غيّر ده لرقمك
const supabaseUrl = 'https://tjscjrcqgfmoknpwbpqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc2NqcmNxZ2Ztb2tucHdicHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzQ3ODQsImV4cCI6MjA5MDExMDc4NH0.a7Jz1ja0LxkSn33stddWcL30AD4Q3inFTbA7lukZBx8';
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
window.Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

// المتغيرات العامة (عشان منعرفهاش مرتين)
let allProducts = [];
window.currentDiscount = 0; 
window.appliedCouponCode = '';
window.cart = JSON.parse(localStorage.getItem('pinky_cart')) || [];
window.currentUser = null;
window.userWishlist = [];

// ============================================================
// المجمع الأساسي (بيشغل كل حاجة مرة واحدة بس لما الصفحة تحمل)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await checkUser();
    applyMasterSettings(); 
    loadDynamicPromo();
    loadHomeSections();
    await fetchStoreProducts(); // بيحمل كل المنتجات
    loadFeaturedProducts(); // بيحمل المنتجات المميزة في الرئيسية
    
    if (typeof window.updateCartUI === 'function') window.updateCartUI();

    const waBtn = document.querySelector('.whatsapp-float');
    if (waBtn) waBtn.href = `https://wa.me/+2001104302683?text=مرحباً%20Pinky%20Promise!%20أود%20الاستفسار%20عن...`;

    const subscribeBtn = document.querySelector('.newsletter-form button');
    if (subscribeBtn) subscribeBtn.addEventListener('click', subscribeNewsletter);
});

// ============================================================
// دوال الريموت كنترول (الـ CMS)
// ============================================================
async function applyMasterSettings() {
    try {
        const { data: settings, error } = await window.supabaseClient.from('site_settings').select('*');
        if (error) throw error;
        if (!settings) return;

        settings.forEach(setting => {
            document.querySelectorAll(`[data-setting-text="${setting.key}"]`).forEach(el => el.innerText = setting.value);
            document.querySelectorAll(`img[data-setting-src="${setting.key}"]`).forEach(img => img.src = setting.value);
            document.querySelectorAll(`a[data-setting-href="${setting.key}"]`).forEach(a => a.href = setting.value);
        });
    } catch (err) { console.error("Master Settings Error:", err); }
}

async function loadDynamicPromo() {
    try {
        // استخدمنا maybeSingle بدل single عشان لو مفيش إعلان الموقع ميضربش
        const { data, error } = await window.supabaseClient
            .from('site_settings')
            .select('value')
            .eq('key', 'promo_text')
            .maybeSingle(); 

        if (error) throw error;
        
        const promoBar = document.getElementById('promo-banner') || document.getElementById('promo-bar');
        if (promoBar && data && data.value) {
            promoBar.innerText = data.value;
        }
    } catch (err) { 
        console.log("Promo Bar:", err.message); 
    }
}

async function loadHomeSections() {
    const container = document.getElementById('dynamic-sections-container');
    if (!container) return;

    container.innerHTML = '';

    try {
        // سحب الـ sections المفعلة مرتبة
        const { data: sections, error } = await window.supabaseClient
            .from('home_sections')
            .select('*, home_section_items(*)')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        if (!sections || sections.length === 0) return;

        sections.forEach(section => {
            // ترتيب الصور داخل كل section
            const items = (section.home_section_items || [])
                .sort((a, b) => a.sort_order - b.sort_order);

            if (items.length === 0) return;

            // اختيار الشكل حسب نوع الـ section
            if (section.type === 'grid') {
                container.innerHTML += buildGridSection(section, items);
            } else if (section.type === 'banner') {
                container.innerHTML += buildBannerSection(section, items);
            }
        });

    } catch (err) {
        console.error('loadHomeSections error:', err);
    }
}

// شكل الـ Grid (زي SHOP BY SKIN CONCERN) — صور طولية 3/4
function buildGridSection(section, items) {
    const title = document.documentElement.lang === 'ar' ? section.title_ar : section.title_en;
    const cardsHTML = items.map(item => {
        const label = document.documentElement.lang === 'ar' ? (item.label_ar || item.label_en) : (item.label_en || item.label_ar);
        return `
        <div class="concern-card" onclick="window.location.href='${item.link_url || 'shop.html'}'">
            <div class="concern-img-wrapper">
                <img src="${item.image_url}" alt="${label}" loading="lazy">
            </div>
            <div class="concern-title">${label}</div>
        </div>`;
    }).join('');

    return `
    <section class="visual-section" style="max-width:1200px; margin:60px auto; padding:0 5%;">
        <h2 class="section-divider"><span>${title}</span></h2>
        <div id="dynamic-concern-grid" class="concern-grid">
            ${cardsHTML}
        </div>
    </section>`;
}

// شكل البانر — صورة عرضية كاملة قابلة للضغط
function buildBannerSection(section, items) {
    // لو في أكتر من صورة — بنعرضهم تحت بعض
    const bannersHTML = items.map(item => `
        <div style="max-width:1200px; margin:20px auto; padding:0 5%;">
            <img
                src="${item.image_url}"
                alt="${item.label_en || section.title_en}"
                loading="lazy"
                onclick="window.location.href='${item.link_url || 'shop.html'}'"
                style="width:100%; height:280px; object-fit:cover; border-radius:12px; cursor:pointer; transition:0.3s;"
                onmouseover="this.style.opacity='0.9'"
                onmouseout="this.style.opacity='1'"
            >
        </div>`).join('');

    return `<section style="margin:40px 0;">${bannersHTML}</section>`;
}


async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products-grid'); 
    if (!container) return;
    try {
        const { data: products, error } = await window.supabaseClient.from('products').select('*').eq('is_featured', true).order('created_at', { ascending: false });
        if (error) throw error;
        if (products && products.length > 0) {
            container.innerHTML = products.map(p => createProductCardHTML(p)).join('');
        }
    } catch (err) { console.error("Featured Products Error:", err); }
}

// ============================================================
// إدارة المستخدمين والمنتجات
// ============================================================
async function checkUser() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
        window.currentUser = session.user;
        const { data: wishlistData } = await window.supabaseClient.from('wishlist').select('product_id').eq('user_id', window.currentUser.id);
        if (wishlistData) window.userWishlist = wishlistData.map(w => w.product_id);
    }
}

async function fetchStoreProducts() {buildAccountRecommendations();
    const storeFront = document.getElementById('store-front');
    let { data: products, error } = await window.supabaseClient.from('products').select('*');
    if (!error && products) allProducts = products;

    if (!storeFront) return;
    if (error || !products || products.length === 0) {
        storeFront.innerHTML = `<div style="text-align:center; padding:50px;">No products found.</div>`;
        return;
    }
    storeFront.innerHTML = '';
    const sections = [...new Set(products.map(p => p.section || 'New Arrivals'))];
    sections.forEach(sectionName => {
        const sectionProducts = products.filter(p => (p.section || 'New Arrivals') === sectionName);
        let sectionHTML = `<section class="product-section"><h2 class="section-title">${sectionName}</h2><div class="product-grid">`;
        sectionProducts.forEach(p => { sectionHTML += createProductCardHTML(p); });
        sectionHTML += `</div></section>`;
        storeFront.innerHTML += sectionHTML;
    });
}

function createProductCardHTML(p) {
    let priceHTML = `<p class="price">${p.price} EGP</p>`;
    let discountBadge = '';
    
    // ربط السعر القديم بتاع الداتابيز بالـ UI
    const oldPrice = p.old_price || p.original_price; 
    if (oldPrice && oldPrice > p.price) {
        const discount = Math.round(((oldPrice - p.price) / oldPrice) * 100);
        discountBadge = `<span class="sale-badge" style="position:absolute; top:10px; right:10px; background:red; color:white; padding:5px 10px; border-radius:5px; font-weight:bold; z-index:10;">-${discount}%</span>`;
        priceHTML = `<p class="price" style="color:red;"><span style="text-decoration:line-through; color:#aaa; font-size:14px; margin-right:8px;">${oldPrice} EGP</span>${p.price} EGP</p>`;
    }
    const isWished = window.userWishlist.includes(p.id) ? 'active' : '';
    
    return `
        <div class="product-card fade-in-up visible" style="position:relative;" onclick="window.location.href='product.html?id=${p.id}'">
            ${discountBadge}
            <div class="image-holder">
                <button class="quick-view-btn" onclick="event.stopPropagation(); openQuickView('${p.id}')"><i class="fas fa-eye"></i> <span>Quick View</span></button>
                <button class="wishlist-btn ${isWished}" onclick="toggleWishlist(event, '${p.id}', this)"><i class="fas fa-heart"></i></button>
                <img src="${p.image_url}" alt="${p.name_en || p.name}">
            </div>
            <div class="product-info">
                <span class="brand-tag">${p.brand || 'Pinky Promise'}</span>
                <h3 data-ar="${p.name_ar || p.name}">${p.name_en || p.name}</h3>
                ${priceHTML}
                <button class="add-to-cart-block" onclick="event.stopPropagation(); window.addToCart('${p.id}')">Add to Cart</button>
            </div>
        </div>`;
}

// ============================================================
// سلة المشتريات والطلبات (Cart & Checkout)
// ============================================================
window.addToCart = function(productId) {
    const product = allProducts.find(p => p.id == productId); // استخدام == عشان لو الـ ID جاي نصي
    if (!product) return;
    
    if (product.stock_quantity <= 0) { 
        window.Toast.fire({ icon: 'error', title: 'Out of stock!' }); 
        return; 
    }
    
    const existingItem = window.cart.find(item => item.id == productId);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        window.cart.push({ 
            id: product.id, 
            product_id: product.id, 
            name: product.name_en || product.name, 
            price: product.price, 
            image_url: product.image_url,
            stock_quantity: product.stock_quantity,
            qty: 1 
        });
    }
    
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    window.updateCartUI();
    window.openCart();
    window.Toast.fire({ icon: 'success', title: 'Added to cart! 🛍️' });
}

window.removeFromCart = function(productId) {
    window.cart = window.cart.filter(item => item.id != productId);
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    window.updateCartUI();
}

window.changeCartItemQty = function(productId, change) {
    const item = window.cart.find(p => p.id == productId);
    if (!item) return;
    let newQty = item.qty + change;
    if (newQty > (item.stock_quantity || 100)) { window.Toast.fire({ icon: 'warning', title: 'Exceeds available stock!' }); return; }
    if (newQty < 1) newQty = 1;
    item.qty = newQty;
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    window.updateCartUI();
}

// دالة تفعيل الكوبون
window.applyCoupon = async function() {
    const codeInput = document.getElementById('coupon-input').value.trim().toUpperCase();
    if(!codeInput) return window.Toast.fire({ icon: 'warning', title: 'اكتب الكود أولاً!' });

    // بنسأل الداتابيز: هل الكوبون ده موجود وشغال؟
    const { data, error } = await window.supabaseClient.from('coupons')
        .select('*').eq('code', codeInput).eq('is_active', true).maybeSingle();

    if (error || !data) {
        return window.Toast.fire({ icon: 'error', title: 'كوبون غير صالح أو منتهي!' });
    }

    // لو الكوبون صح، بنحفظ الخصم ونحدث السلة
    window.currentDiscount = data.discount_percent;
    window.appliedCouponCode = data.code;
    window.Toast.fire({ icon: 'success', title: `تم تفعيل خصم ${data.discount_percent}% 🎉` });
    window.updateCartUI(); 
}

window.updateCartUI = function() {
    const container = document.getElementById('cart-items-container');
    const countSpan = document.getElementById('cart-count');
    const floatCount = document.getElementById('float-cart-count');
    const totalSpan = document.getElementById('cart-total-price');
    const progressFill = document.getElementById('shipping-fill');
    const amountLeftSpan = document.getElementById('amount-left');
    
    if (!container) return;
    container.innerHTML = '';
    let total = 0, itemCount = 0;

    if (window.cart.length === 0) {
        container.innerHTML = `<div class="empty-cart-msg">Your cart is empty 🥺</div>`;
    } else {
        window.cart.forEach(item => {
            total += item.price * item.qty;
            itemCount += item.qty;
            container.innerHTML += `
            <div style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;">
                <img src="${item.image_url}" style="width:70px; height:70px; object-fit:cover; border-radius:5px;">
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:14px; margin-bottom:5px;">${item.name}</div>
                    <div style="color:#888; font-size:13px; margin-bottom:5px;">${item.price} EGP</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px; background:#f9f9f9; border:1px solid #ddd; border-radius:6px; padding:2px 8px;">
                            <button onclick="changeCartItemQty('${item.id}', -1)" style="border:none; background:transparent; cursor:pointer; font-size:16px; color:#555; padding:0 4px;">-</button>
                            <span style="font-size:14px; font-weight:bold; min-width:15px; text-align:center;">${item.qty}</span>
                            <button onclick="changeCartItemQty('${item.id}', 1)"  style="border:none; background:transparent; cursor:pointer; font-size:16px; color:#555; padding:0 4px;">+</button>
                        </div>
                        <span onclick="removeFromCart('${item.id}')" style="color:red; cursor:pointer; font-size:12px;"><i class="fas fa-trash"></i> Remove</span>
                    </div>
                </div>
            </div>`;
        });

        // إضافة خانة الكوبون أسفل المنتجات
        const discountAmount = (total * window.currentDiscount) / 100;
        const couponHTML = `
            <div style="display:flex; gap:10px; margin-top:15px; padding-top:15px; border-top:2px solid #eee;">
                <input type="text" id="coupon-input" placeholder="Enter Promo Code" value="${window.appliedCouponCode}" style="flex:1; padding:8px; border:1px solid #ddd; border-radius:6px; text-transform:uppercase;">
                <button onclick="window.applyCoupon()" style="background:var(--primary-glow, #AF8FE9); color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">Apply</button>
            </div>
            ${window.currentDiscount > 0 ? `<div style="color:red; margin-top:10px; font-size:14px; font-weight:bold;"><i class="fas fa-tag"></i> Discount applied: -${window.currentDiscount}% (-${discountAmount} EGP)</div>` : ''}
        `;
        container.innerHTML += couponHTML;
    }

    // حساب الإجمالي النهائي بعد الخصم
    const finalTotal = total - ((total * window.currentDiscount) / 100);

    if (countSpan) countSpan.innerText = itemCount;
    if (floatCount) floatCount.innerText = itemCount;
    if (totalSpan) totalSpan.innerText = finalTotal.toLocaleString() + ' EGP';

    const FREE = 2000;
    if (total >= FREE) {
        if (amountLeftSpan) amountLeftSpan.parentElement.innerHTML = `<span style="color:#2EA043; font-weight:bold;"><i class="fas fa-truck"></i> Free shipping unlocked!</span>`;
        if (progressFill) { progressFill.style.width = '100%'; progressFill.style.background = '#2EA043'; }
    } else {
        const left = FREE - total;
        if (amountLeftSpan) amountLeftSpan.parentElement.innerHTML = `Add <span id="amount-left" style="color:red; font-weight:bold;">${left.toLocaleString()} EGP</span> for Free Shipping!`;
        if (progressFill) { progressFill.style.width = (total / FREE * 100) + '%'; progressFill.style.background = '#000'; }
    }
}

window.submitOrder = async function(customerName, customerPhone, customerAddress) {
    if (window.cart.length === 0) return alert('سلة المشتريات فارغة!');
    
    // حساب الإجمالي مع الخصم عشان يتبعت للداتابيز صح
    const totalAmount = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const finalAmount = totalAmount - ((totalAmount * window.currentDiscount) / 100);

    try {
        const { data: orderData, error: orderError } = await window.supabaseClient.from('orders')
            .insert([{ 
                customer_name: customerName, 
                customer_phone: customerPhone, 
                customer_address: customerAddress, 
                total_amount: finalAmount, // السعر بعد الخصم
                status: 'Pending' 
            }])
            .select().single();
        if (orderError) throw orderError;

        const orderItemsToInsert = window.cart.map(item => ({
            order_id: orderData.id,
            product_id: item.product_id || item.id,
            product_name: item.name,
            quantity: item.qty,
            price_at_time: item.price
        }));

        const { error: itemsError } = await window.supabaseClient.from('order_items').insert(orderItemsToInsert);
        if (itemsError) throw itemsError;

        Swal.fire({ icon: 'success', title: 'تم تأكيد طلبك بنجاح!', text: 'رقم طلبك هو: #' + orderData.id, confirmButtonColor: '#AF8FE9' });
        
        // تصفير السلة والكوبونات
        window.cart = [];
        window.currentDiscount = 0;
        window.appliedCouponCode = '';
        localStorage.removeItem('pinky_cart');
        window.updateCartUI();
        
    } catch (err) {
        console.error("Order Error:", err);
        Swal.fire('خطأ', 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.', 'error');
    }
}

// ============================================================
// دوال مساعدة (UI Toggles, Wishlist, Newsletter)
// ============================================================
window.openCart = function() { document.getElementById('cart-drawer').classList.add('open'); document.getElementById('cart-overlay').classList.add('show'); }
window.closeCart = function() { document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('cart-overlay').classList.remove('show'); }
window.toggleMobileMenu = function() { document.getElementById('mobile-nav').classList.toggle('open'); }
window.goToCheckout = function() { if (window.cart.length === 0) { window.Toast.fire({ icon: 'warning', title: 'Cart is empty!' }); return; } window.location.href = 'checkout.html'; }

window.toggleWishlist = async function(event, productId, btnElement) {
    event.stopPropagation();
    if (!window.currentUser) { Swal.fire({ title: 'Login Required', text: 'Please login to save items.', icon: 'info' }); return; }
    const isWished = btnElement.classList.contains('active');
    if (isWished) {
        btnElement.classList.remove('active');
        window.userWishlist = window.userWishlist.filter(id => id !== productId);
        await window.supabaseClient.from('wishlist').delete().match({ user_id: window.currentUser.id, product_id: productId });
        window.Toast.fire({ icon: 'success', title: 'Removed from wishlist' });
    } else {
        btnElement.classList.add('active');
        window.userWishlist.push(productId);
        await window.supabaseClient.from('wishlist').insert([{ user_id: window.currentUser.id, product_id: productId }]);
        window.Toast.fire({ icon: 'success', title: 'Added to wishlist ❤️' });
    }
}

async function subscribeNewsletter(e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput ? emailInput.value.trim() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { window.Toast.fire({ icon: 'warning', title: 'يرجى إدخال بريد إلكتروني صحيح.' }); return; }
    
    const { error } = await window.supabaseClient.from('newsletter_subscribers').insert([{ email: email }]);
    if (error && error.code === '23505') window.Toast.fire({ icon: 'info', title: 'هذا البريد مسجل بالفعل!' });
    else {
        window.Toast.fire({ icon: 'success', title: 'تم الاشتراك بنجاح! 🎉' });
        if (emailInput) emailInput.value = '';
    }
}

window.openQuickView = function(productId) {
    const p = allProducts.find(item => item.id == productId);
    if (!p) return;
    document.getElementById('qv-img').src = p.image_url;
    document.getElementById('qv-brand').innerText = p.brand || 'Pinky Promise';
    document.getElementById('qv-title').innerText = p.name_en || p.name;
    document.getElementById('qv-price').innerHTML = `${p.price} EGP`;
    document.getElementById('qv-desc').innerText = p.description ? p.description.substring(0, 150) + '...' : 'No description available.';
    document.getElementById('qv-add-btn').onclick = function() { window.addToCart(p.id); closeQuickView(); };
    document.getElementById('qv-more-link').href = `product.html?id=${p.id}`;
    document.getElementById('quick-view-modal').classList.add('active');
}
window.closeQuickView = function() { document.getElementById('quick-view-modal').classList.remove('active'); }

window.openSearch = function() { document.getElementById('search-overlay').classList.add('active'); setTimeout(() => { document.getElementById('live-search-input').focus(); }, 100); }
window.closeSearch = function() { document.getElementById('search-overlay').classList.remove('active'); document.getElementById('live-search-input').value = ''; document.getElementById('search-results').innerHTML = ''; }
window.performSearch = function() {
    const query = document.getElementById('live-search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    if (query.length < 2) { resultsContainer.innerHTML = ''; return; }
    const filtered = allProducts.filter(p => ((p.name_en||p.name||'').toLowerCase().includes(query)) || ((p.brand||'').toLowerCase().includes(query)) || ((p.section||'').toLowerCase().includes(query)));
    if (filtered.length === 0) { resultsContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#888;">No results found.</div>`; return; }
    resultsContainer.innerHTML = filtered.map(p => `<a href="product.html?id=${p.id}" class="search-item" style="display:flex; align-items:center; gap:15px; text-decoration:none; color:inherit; margin-bottom:15px;"><img src="${p.image_url}" alt="${p.name_en||p.name}" style="width:50px; height:50px; border-radius:8px;"><div><h4 style="margin:0; font-size:14px;">${p.name_en||p.name}</h4><p style="margin:0; font-size:12px; color:var(--primary-glow);">${p.price} EGP</p></div></a>`).join('');
}
window.handleUserIconClick = function() { window.location.href = window.currentUser ? 'profile.html' : 'account.html'; }

// دالة تغيير اللغة (عربي / إنجليزي)
window.toggleLang = function() {
    const htmlTag = document.documentElement;
    const currentLang = htmlTag.getAttribute('lang');

    if (currentLang === 'ar') {
        htmlTag.setAttribute('lang', 'en');
        htmlTag.setAttribute('dir', 'ltr');
        // تغيير النصوص للإنجليزي لو العنصر عنده data-en
        document.querySelectorAll('[data-en]').forEach(el => {
            if(el.getAttribute('data-en')) el.innerText = el.getAttribute('data-en');
        });
        localStorage.setItem('pinky_lang', 'en');
    } else {
        htmlTag.setAttribute('lang', 'ar');
        htmlTag.setAttribute('dir', 'rtl');
        // تغيير النصوص للعربي لو العنصر عنده data-ar
        document.querySelectorAll('[data-ar]').forEach(el => {
            if(el.getAttribute('data-ar')) el.innerText = el.getAttribute('data-ar');
        });
        localStorage.setItem('pinky_lang', 'ar');
    }
}

// تشغيل اللغة المحفوظة تلقائياً أول ما الموقع يفتح
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('pinky_lang');
    if(savedLang === 'en') {
        document.documentElement.setAttribute('lang', 'en');
        document.documentElement.setAttribute('dir', 'ltr');
    }
});
// دالة بناء التوصيات من حساب العميل
window.buildAccountRecommendations = function() {
    // بنسحب نوع البشرة اللي العميل حفظه في حسابه
    const skinProfile = localStorage.getItem('pinky_user_skin_profile');
    
    // لو مسجلش نوع بشرته لسه، منعملش حاجة
    if (!skinProfile) return; 

    // ندور على أي حاجة لها علاقة بنوع بشرته
    const recommendedProducts = window.allProducts.filter(p => 
        (p.name_en && p.name_en.toLowerCase().includes(skinProfile.toLowerCase())) || 
        (p.description && p.description.toLowerCase().includes(skinProfile.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(skinProfile.toLowerCase())) ||
        (p.section && p.section.toLowerCase().includes(skinProfile.toLowerCase()))
    ).slice(0, 4);

    if (recommendedProducts.length > 0) {
        // لو إحنا في الرئيسية أو صفحة المنتج، هنبني السيكشن
        const targetDiv = document.getElementById('store-front') || document.getElementById('similar-products-grid');
        if (!targetDiv) return;

        let html = `
        <section class="product-section" style="background: rgba(209, 73, 139, 0.05); padding: 20px; border-radius: 15px; margin-bottom: 40px; border: 1px solid var(--primary-glow);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="color: var(--primary-color); font-size:22px; margin:0;"><i class="fas fa-magic"></i> مخصص لبشرتك (${skinProfile})</h2>
                <a href="shop.html?search=${skinProfile}" style="color:var(--text-muted); font-size:14px; text-decoration:none;">عرض الكل ❯</a>
            </div>
            <div class="product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;">
        `;
        recommendedProducts.forEach(p => { html += createProductCardHTML(p); });
        html += `</div></section>`;

        // بنحط السيكشن ده أول حاجة فوق المنتجات
        if(targetDiv.id === 'store-front') {
            targetDiv.insertAdjacentHTML('afterbegin', html);
        } else {
            targetDiv.innerHTML = html; // في صفحة الـ product
        }
    }
}
// دالة بناء التوصيات من حساب العميل (بدون Pop-up)
window.buildAccountRecommendations = function() {
    const skinProfile = localStorage.getItem('pinky_user_skin_profile');
    if (!skinProfile) return; // لو مش محدد بشرته، منعملش حاجة

    // جلب المنتجات اللي تناسب بشرته
    const recommendedProducts = window.allProducts.filter(p => 
        (p.name_en && p.name_en.toLowerCase().includes(skinProfile.toLowerCase())) || 
        (p.description && p.description.toLowerCase().includes(skinProfile.toLowerCase())) ||
        (p.target_concern && p.target_concern.toLowerCase().includes(skinProfile.toLowerCase()))
    ).slice(0, 4);

    if (recommendedProducts.length > 0) {
        const storeFront = document.getElementById('store-front');
        if (!storeFront) return;

        // بناء السيكشن المخصص
        let html = `
        <section class="product-section" style="background: rgba(209, 73, 139, 0.05); padding: 20px; border-radius: 15px; margin-bottom: 40px; border: 1px solid var(--primary-glow);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h2 style="color: var(--primary-color); font-size:22px; margin:0;"><i class="fas fa-magic"></i> مخصص لبشرتك (${skinProfile})</h2>
                <a href="shop.html?search=${skinProfile}" style="color:var(--text-muted); font-size:14px; text-decoration:none;">عرض الكل ❯</a>
            </div>
            <div class="product-grid">
        `;
        recommendedProducts.forEach(p => { html += createProductCardHTML(p); });
        html += `</div></section>`;

        // حقن السيكشن في أول الصفحة
        storeFront.insertAdjacentHTML('afterbegin', html);
    }
}