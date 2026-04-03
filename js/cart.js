// ==========================================
// cart.js - محرك سلة المشتريات والطلبات
// ==========================================

window.cart = JSON.parse(localStorage.getItem('pinky_cart')) || [];
window.currentDiscount = 0; 
window.appliedCouponCode = '';

// فتح وقفل السلة
window.openCart = function() { 
    document.getElementById('cart-drawer').classList.add('open'); 
    document.getElementById('cart-overlay').classList.add('show'); 
}
window.closeCart = function() { 
    document.getElementById('cart-drawer').classList.remove('open'); 
    document.getElementById('cart-overlay').classList.remove('show'); 
}

// دالة الإضافة للسلة
window.addToCart = function(productId) {
    // بنجيب بيانات المنتج من allProducts اللي موجودة في store.js
    const product = window.allProducts.find(p => p.id == productId); 
    if (!product) {
        console.error("المنتج مش موجود!");
        return;
    }
    
    if (product.stock_quantity <= 0) { 
        window.Toast.fire({ icon: 'error', title: 'عذراً، نفذت الكمية!' }); 
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
    window.openCart(); // نفتح السلة فوراً
    
    // رسالة النجاح (لو الـ SweetAlert موجود)
    if (typeof Swal !== 'undefined') {
        window.Toast.fire({ icon: 'success', title: 'تمت الإضافة للسلة! 🛍️' });
    }
}

// دالة مسح منتج
window.removeFromCart = function(productId) {
    window.cart = window.cart.filter(item => item.id != productId);
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    window.updateCartUI();
}

// دالة تغيير الكمية
window.changeCartItemQty = function(productId, change) {
    const item = window.cart.find(p => p.id == productId);
    if (!item) return;
    let newQty = item.qty + change;
    if (newQty > (item.stock_quantity || 100)) { 
        window.Toast.fire({ icon: 'warning', title: 'الكمية المطلوبة أكبر من المخزون!' }); 
        return; 
    }
    if (newQty < 1) newQty = 1;
    item.qty = newQty;
    localStorage.setItem('pinky_cart', JSON.stringify(window.cart));
    window.updateCartUI();
}

// تفعيل الكوبون
window.applyCoupon = async function() {
    const codeInput = document.getElementById('coupon-input').value.trim().toUpperCase();
    if(!codeInput) return window.Toast.fire({ icon: 'warning', title: 'اكتب الكود أولاً!' });

    const { data, error } = await window.supabaseClient.from('coupons')
        .select('*').eq('code', codeInput).eq('is_active', true).maybeSingle();

    if (error || !data) {
        return window.Toast.fire({ icon: 'error', title: 'كوبون غير صالح أو منتهي!' });
    }

    window.currentDiscount = data.discount_percent;
    window.appliedCouponCode = data.code;
    window.Toast.fire({ icon: 'success', title: `تم تفعيل خصم ${data.discount_percent}% 🎉` });
    window.updateCartUI(); 
}

// تحديث شكل السلة في الموقع
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

        // إضافة خانة الكوبون
        const discountAmount = (total * window.currentDiscount) / 100;
        container.innerHTML += `
            <div style="display:flex; gap:10px; margin-top:15px; padding-top:15px; border-top:2px solid #eee;">
                <input type="text" id="coupon-input" placeholder="Enter Promo Code" value="${window.appliedCouponCode}" style="flex:1; padding:8px; border:1px solid #ddd; border-radius:6px; text-transform:uppercase;">
                <button onclick="window.applyCoupon()" style="background:var(--primary-glow, #AF8FE9); color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">Apply</button>
            </div>
            ${window.currentDiscount > 0 ? `<div style="color:red; margin-top:10px; font-size:14px; font-weight:bold;"><i class="fas fa-tag"></i> Discount applied: -${window.currentDiscount}% (-${discountAmount} EGP)</div>` : ''}
        `;
    }

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

// دالة الدفع وإرسال الطلب
window.submitOrder = async function(customerName, customerPhone, customerAddress) {
    if (window.cart.length === 0) return alert('سلة المشتريات فارغة!');
    const totalAmount = window.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const finalAmount = totalAmount - ((totalAmount * window.currentDiscount) / 100);

    try {
        const { data: orderData, error: orderError } = await window.supabaseClient.from('orders')
            .insert([{ customer_name: customerName, customer_phone: customerPhone, customer_address: customerAddress, total_amount: finalAmount, status: 'Pending' }])
            .select().single();
        if (orderError) throw orderError;

        const orderItemsToInsert = window.cart.map(item => ({
            order_id: orderData.id, product_id: item.product_id || item.id, product_name: item.name, quantity: item.qty, price_at_time: item.price
        }));

        const { error: itemsError } = await window.supabaseClient.from('order_items').insert(orderItemsToInsert);
        if (itemsError) throw itemsError;

        Swal.fire({ icon: 'success', title: 'تم تأكيد طلبك بنجاح!', text: 'رقم طلبك هو: #' + orderData.id, confirmButtonColor: '#AF8FE9' });
        window.cart = []; window.currentDiscount = 0; window.appliedCouponCode = ''; localStorage.removeItem('pinky_cart'); window.updateCartUI();
    } catch (err) {
        console.error("Order Error:", err);
        Swal.fire('خطأ', 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.', 'error');
    }
}

// زرار Checkout
window.goToCheckout = function() { 
    if (window.cart.length === 0) { window.Toast.fire({ icon: 'warning', title: 'Cart is empty!' }); return; } 
    window.location.href = 'checkout.html'; 
}

// التحديث وقت تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.updateCartUI === 'function') window.updateCartUI();
});