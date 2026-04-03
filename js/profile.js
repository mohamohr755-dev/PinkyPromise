const supabaseUrl = 'https://tjscjrcqgfmoknpwbpqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc2NqcmNxZ2Ztb2tucHdicHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzQ3ODQsImV4cCI6MjA5MDExMDc4NH0.a7Jz1ja0LxkSn33stddWcL30AD4Q3inFTbA7lukZBx8';
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

window.Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });

let currentUser = null;
let customerData = null;
let currentSkinType = null;
window.cart = JSON.parse(localStorage.getItem('pinky_cart')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    updateCartUI();
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'account.html'; return; }
    currentUser = session.user;
    document.getElementById('user-display-email').innerText = currentUser.email;
    document.getElementById('info-email').innerText = currentUser.email;
    await fetchCustomerData();
    fetchWishlist();
    fetchOrders();
});

window.switchTab = function(tabId, btnElement) {
    document.querySelectorAll('.tab-section').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelectorAll('.profile-nav button').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
}

async function fetchCustomerData() {
    const { data } = await window.supabaseClient.from('customers').select('*').eq('id', currentUser.id).single();
    if (data) {
        customerData = data;
        const name = data.full_name || 'Client';
        document.getElementById('user-display-name').innerText = name;
        document.getElementById('user-initial').innerText = name.charAt(0).toUpperCase();
        document.getElementById('info-name').innerText = name;
        document.getElementById('info-phone').innerText = data.phone_number || 'Not provided';
        if (data.skin_type && data.skin_type !== 'Not Specified') {
            currentSkinType = data.skin_type;
            document.querySelectorAll('.skin-card').forEach(card => {
                if (card.getAttribute('data-type') === currentSkinType) card.classList.add('selected');
            });
        }
    }
}

window.selectSkinType = function(cardElement) {
    document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
    currentSkinType = cardElement.getAttribute('data-type');
}

window.saveSkinProfile = async function() {
    if (!currentSkinType) return window.Toast.fire({ icon: 'warning', title: 'Select a skin type first.' });
    Swal.fire({ title: 'Saving...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    const { error } = await window.supabaseClient.from('customers').update({ skin_type: currentSkinType }).eq('id', currentUser.id);
    if (error) Swal.fire('Error', 'Could not save details.', 'error');
    else Swal.fire({ icon: 'success', title: 'Saved!', timer: 2000, showConfirmButton: false });
}

async function fetchWishlist() {
    const grid = document.getElementById('wishlist-grid');
    grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#888;">Loading...</div>';
    const { data: wishlistItems } = await window.supabaseClient.from('wishlist').select('*, products(*)').eq('user_id', currentUser.id);
    if (!wishlistItems || wishlistItems.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px; color:#888;">Your wishlist is empty.</div>';
        return;
    }
    grid.innerHTML = '';
    wishlistItems.forEach(item => {
        const p = item.products;
        if (!p) return;
        grid.innerHTML += `
            <div class="product-card" onclick="window.location.href='product.html?id=${p.id}'" style="border:1px solid #eee; border-radius:10px; padding:15px; text-align:center; cursor:pointer; position:relative;">
                <button onclick="removeFromWishlist(event, '${p.id}', this)" style="position:absolute; top:10px; right:10px; background:white; border:none; color:#f15a97; font-size:18px; cursor:pointer;"><i class="fas fa-heart"></i></button>
                <img src="${p.image_url}" alt="${p.name}" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
                <h4 style="margin:0 0 5px 0; font-size:14px; color:#333;">${p.name}</h4>
                <p style="margin:0; color:var(--primary-color); font-weight:bold;">${p.price} EGP</p>
            </div>`;
    });
}

window.removeFromWishlist = async function(event, productId, btnElement) {
    event.stopPropagation();
    await window.supabaseClient.from('wishlist').delete().match({ user_id: currentUser.id, product_id: productId });
    btnElement.closest('.product-card').remove();
    window.Toast.fire({ icon: 'success', title: 'Removed from wishlist' });
    if (document.getElementById('wishlist-grid').children.length === 0) fetchWishlist();
}

// FIX: عرض تفاصيل الأصناف جوا كل أوردر
async function fetchOrders() {
    const list = document.getElementById('orders-list');
    if (!customerData) return;

    const { data: orders } = await window.supabaseClient
        .from('orders').select('*')
        .eq('customer_phone', customerData.phone_number)
        .order('created_at', { ascending: false });

    if (!orders || orders.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:30px; color:#888;"><i class="fas fa-box-open" style="font-size:40px; margin-bottom:15px; display:block;"></i>No orders yet. <a href="shop.html" style="color:var(--primary-color); font-weight:bold;">Start shopping!</a></div>';
        return;
    }

    const statusConfig = {
        'New':       { bg: '#fff3cd', color: '#856404', icon: 'fa-clock',          label: 'قيد المراجعة' },
        'Confirmed': { bg: '#cce5ff', color: '#004085', icon: 'fa-check-circle',   label: 'تم التأكيد' },
        'Shipped':   { bg: '#d4edda', color: '#155724', icon: 'fa-shipping-fast',  label: 'في الطريق 🚚' },
        'Delivered': { bg: '#d1e7dd', color: '#0f5132', icon: 'fa-box',            label: 'تم التسليم ✅' },
        'Returned':  { bg: '#f8d7da', color: '#842029', icon: 'fa-undo',           label: 'مرتجع' },
        'Received':  { bg: '#d1e7dd', color: '#0f5132', icon: 'fa-check-double',   label: 'تم الاستلام ✅' },
    };

    list.innerHTML = '';
    orders.forEach(order => {
        const date   = new Date(order.created_at).toLocaleDateString('ar-EG');
        const shortId = `GLW-${order.id.toString().substring(0, 6).toUpperCase()}`;
        const s = statusConfig[order.status] || { bg: '#eee', color: '#555', icon: 'fa-circle', label: order.status };

        // تفاصيل الأصناف من order_items
        let itemsHTML = '';
        if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
            itemsHTML = `
            <div style="margin-top:12px; padding-top:12px; border-top:1px dashed #eee;">
                <div style="font-size:12px; color:#888; margin-bottom:8px; font-weight:bold;">تفاصيل الطلب:</div>
                ${order.order_items.map(item => `
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                        <img src="${item.image_url}" style="width:40px; height:40px; object-fit:cover; border-radius:6px; border:1px solid #eee;">
                        <div style="flex:1;">
                            <div style="font-size:13px; font-weight:bold; color:#333;">${item.name}</div>
                            <div style="font-size:12px; color:#888;">${item.price} EGP × ${item.qty}</div>
                        </div>
                        <div style="font-size:13px; font-weight:bold; color:var(--primary-color);">${item.price * item.qty} EGP</div>
                    </div>`).join('')}
            </div>`;
        }

        list.innerHTML += `
            <div style="border:1px solid #eee; border-radius:12px; padding:18px; margin-bottom:15px; background:#fafafa;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:900; font-size:16px; color:#222;">#${shortId}</div>
                        <div style="color:#888; font-size:13px; margin-top:3px;">${date}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:900; font-size:17px; color:#222; margin-bottom:6px;">${Number(order.total_amount).toLocaleString()} EGP</div>
                        <span style="background:${s.bg}; color:${s.color}; padding:4px 12px; border-radius:12px; font-size:12px; font-weight:bold;">
                            <i class="fas ${s.icon}"></i> ${s.label}
                        </span>
                    </div>
                </div>
                ${itemsHTML}
            </div>`;
    });
}

window.logoutUser = async function() {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// السلة — نسخة واحدة نظيفة
window.openCart  = function() { document.getElementById('cart-drawer').classList.add('open');    document.getElementById('cart-overlay').classList.add('show'); }
window.closeCart = function() { document.getElementById('cart-drawer').classList.remove('open'); document.getElementById('cart-overlay').classList.remove('show'); }
window.goToCheckout = function() { if (window.cart.length === 0) return window.Toast.fire({ icon: 'warning', title: 'Cart is empty!' }); window.location.href = 'checkout.html'; }

window.removeFromCart = function(productId) {
    window.cart = window.cart.filter(item => item.id !== productId);
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    window.updateCartUI();
}

window.changeCartItemQty = function(productId, change) {
    const item = window.cart.find(p => p.id === productId);
    if (!item) return;
    let newQty = item.qty + change;
    if (newQty > item.stock_quantity) { window.Toast.fire({ icon: 'warning', title: 'Exceeds available stock!' }); return; }
    if (newQty < 1) newQty = 1;
    item.qty = newQty;
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    window.updateCartUI();
}

window.updateCartUI = function() {
    const container  = document.getElementById('cart-items-container');
    const countSpan  = document.getElementById('cart-count');
    const floatCount = document.getElementById('float-cart-count');
    const totalSpan  = document.getElementById('cart-total-price');
    const progressFill   = document.getElementById('shipping-fill');
    const amountLeftSpan = document.getElementById('amount-left');
    if (!container) return;

    container.innerHTML = '';
    let total = 0, itemCount = 0;

    if (window.cart.length === 0) {
        container.innerHTML = `<div class="empty-cart-msg" style="padding:20px; text-align:center;">Your cart is empty 🥺</div>`;
    } else {
        window.cart.forEach(item => {
            total += item.price * item.qty;
            itemCount += item.qty;
            container.innerHTML += `
            <div style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;">
                <img src="${item.image_url}" style="width:70px; height:70px; object-fit:cover; border-radius:5px;">
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:14px; margin-bottom:5px; color:#333;">${item.name}</div>
                    <div style="color:var(--primary-color); font-size:13px; font-weight:bold; margin-bottom:10px;">${item.price} EGP</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px; background:#f9f9f9; border:1px solid #ddd; border-radius:6px; padding:2px 8px;">
                            <button onclick="changeCartItemQty('${item.id}', -1)" style="border:none; background:transparent; cursor:pointer; font-size:16px; color:#555; padding:0 4px;">-</button>
                            <span style="font-size:14px; font-weight:bold; min-width:15px; text-align:center;">${item.qty}</span>
                            <button onclick="changeCartItemQty('${item.id}', 1)"  style="border:none; background:transparent; cursor:pointer; font-size:16px; color:#555; padding:0 4px;">+</button>
                        </div>
                        <span onclick="removeFromCart('${item.id}')" style="color:red; cursor:pointer; font-size:12px; font-weight:bold;"><i class="fas fa-trash"></i> Remove</span>
                    </div>
                </div>
            </div>`;
        });
    }

    if (countSpan)  countSpan.innerText  = itemCount;
    if (floatCount) floatCount.innerText = itemCount;
    if (totalSpan)  totalSpan.innerText  = total.toLocaleString() + ' EGP';

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
// دالة تحديد نوع البشرة من صفحة البروفايل
window.selectSkinType = function(cardElement) {
    document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
}

// دالة حفظ نوع البشرة
window.saveSkinProfile = function() {
    const selected = document.querySelector('.skin-card.selected');
    if (!selected) {
        Swal.fire('تنبيه', 'رجاءً اختاري نوع بشرتك أولاً', 'warning');
        return;
    }
    const skinType = selected.getAttribute('data-type');
    
    // حفظ في ذاكرة المتصفح عشان الموقع يقرأها
    localStorage.setItem('pinky_user_skin_profile', skinType);
    
    Swal.fire({
        icon: 'success',
        title: 'تم الحفظ!',
        text: `تم تجهيز التوصيات لبشرتك الـ ${skinType} 💖`,
        confirmButtonColor: '#d1498b'
    });
}

// دالة التنقل بين التابات في البروفايل (عشان تشتغل معاك)
window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.profile-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}
