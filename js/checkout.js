const supabaseUrl = 'https://tjscjrcqgfmoknpwbpqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc2NqcmNxZ2Ztb2tucHdicHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzQ3ODQsImV4cCI6MjA5MDExMDc4NH0.a7Jz1ja0LxkSn33stddWcL30AD4Q3inFTbA7lukZBx8';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const TELEGRAM_BOT_TOKEN = '8253875902:AAEtzwIMnENEDANTHNxIFS8fRNWCcyYXG5A';
const TELEGRAM_CHAT_ID   = '8144239449';
const FREE_SHIPPING_THRESHOLD = 2000;
const SHIPPING_FEE = 60; // رسوم الشحن الافتراضية

let cart = JSON.parse(localStorage.getItem('pinky_cart')) || [];
let subtotal    = 0;
let finalTotal  = 0;
let shippingFee = 0;
let appliedDiscount = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (cart.length === 0) { window.location.href = 'index.html'; return; }
    renderCheckoutItems();

    // FIX: phone validation — يمنع الحروف ويقبل أرقام بس
    const phoneInput = document.getElementById('c-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', () => {
            phoneInput.value = phoneInput.value.replace(/[^0-9+]/g, '');
        });
    }
});

function renderCheckoutItems() {
    const container = document.getElementById('checkout-items');
    container.innerHTML = '';
    subtotal = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        container.innerHTML += `
        <div style="display:flex; gap:12px; margin-bottom:12px; align-items:center;">
            <img src="${item.image_url}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:1px solid #eee;">
            <div style="flex:1;">
                <div style="font-size:13px; font-weight:bold; color:#333;">${item.name}</div>
                <div style="font-size:12px; color:#888;">${item.price} EGP × ${item.qty}</div>
            </div>
            <div style="font-weight:bold; color:#222;">${itemTotal} EGP</div>
        </div>`;
    });
    calculateTotal();
}

window.toggleCardDetails = function() {
    const val = document.querySelector('input[name="payment"]:checked').value;
    document.getElementById('card-details').style.display = val === 'Card' ? 'block' : 'none';
}

async function applyCoupon() {
    const codeInput = document.getElementById('coupon-code').value.trim().toUpperCase();
    if (!codeInput) return;
    Swal.fire({ title: 'جاري التحقق...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const { data: coupon } = await supabaseClient.from('coupons').select('*').eq('code', codeInput).eq('is_active', true).maybeSingle();

    if (coupon) {
        appliedDiscount = coupon.discount_percent;
        document.getElementById('discount-row').style.display = 'flex';
        document.getElementById('discount-percent').innerText = appliedDiscount;
        Swal.fire({ icon: 'success', title: 'مبروك!', text: `تم تطبيق خصم ${appliedDiscount}%`, timer: 2000, showConfirmButton: false });
    } else {
        appliedDiscount = 0;
        document.getElementById('discount-row').style.display = 'none';
        Swal.fire({ icon: 'error', title: 'عذراً', text: 'الكود غير صحيح أو منتهي الصلاحية.' });
    }
    calculateTotal();
}

// FIX: حساب الشحن تلقائياً
function calculateTotal() {
    document.getElementById('subtotal').innerText = subtotal.toLocaleString() + ' EGP';

    let discountValue = 0;
    if (appliedDiscount > 0) {
        discountValue = (subtotal * appliedDiscount) / 100;
        document.getElementById('discount-amount').innerText = `- ${discountValue.toLocaleString()} EGP`;
    }

    const afterDiscount = subtotal - discountValue;

    // الشحن مجاني فوق 2000
    if (afterDiscount >= FREE_SHIPPING_THRESHOLD) {
        shippingFee = 0;
        document.getElementById('shipping-fee').innerHTML = `<span style="color:#2EA043; font-weight:bold;"><i class="fas fa-truck"></i> شحن مجاني!</span>`;
    } else {
        shippingFee = SHIPPING_FEE;
        document.getElementById('shipping-fee').innerText = `${SHIPPING_FEE} EGP`;
    }

    finalTotal = afterDiscount + shippingFee;
    document.getElementById('final-total').innerText = finalTotal.toLocaleString() + ' EGP';
}

window.placeOrder = async function() {
    const name    = document.getElementById('c-name').value.trim();
    const phone   = document.getElementById('c-phone').value.trim();
    const address = document.getElementById('c-address').value.trim();
    const notes   = document.getElementById('c-notes').value.trim();

    // FIX: validation محسّن
    if (!name || name.length < 3) {
        Swal.fire('بيانات ناقصة', 'يرجى إدخال الاسم بالكامل (3 أحرف على الأقل).', 'warning'); return;
    }
    if (!phone || !/^(\+20|0)?1[0125][0-9]{8}$/.test(phone)) {
        Swal.fire('رقم هاتف غير صحيح', 'يرجى إدخال رقم موبايل مصري صحيح (مثال: 01xxxxxxxxx).', 'warning'); return;
    }
    if (!address || address.length < 10) {
        Swal.fire('العنوان ناقص', 'يرجى كتابة العنوان بالتفصيل (المحافظة، المنطقة، الشارع).', 'warning'); return;
    }

    const paymentValue = document.querySelector('input[name="payment"]:checked').value;
    const paymentLabels = { Cash: 'الدفع عند الاستلام', Wallet: 'محفظة إلكترونية', Card: 'بطاقة ائتمانية' };
    const paymentText = paymentLabels[paymentValue] || paymentValue;

    Swal.fire({ title: 'جاري تأكيد طلبك...', text: 'لحظات ونجهزلك الشحنة 📦', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    try {
        const finalNotes = `طريقة الدفع: ${paymentText}${notes ? ' | ' + notes : ''}`;

        const { data: newOrder, error: orderError } = await supabaseClient.from('orders').insert([{
            customer_name:    name,
            customer_phone:   phone,
            customer_address: address,
            total_amount:     finalTotal,
            status:           'Pending',
            order_source:     'Web',
            notes:            finalNotes,
            order_items:      cart
        }]).select().single();

        if (orderError) throw orderError;

        await sendTelegramNotification(newOrder.id, name, phone, address, finalTotal, shippingFee, paymentText, cart);

        localStorage.removeItem('pinky_cart');
        window.location.href = `order-confirmation.html?order_id=${newOrder.id}`;

    } catch (error) {
        Swal.fire('حدث خطأ', 'يرجى المحاولة مرة أخرى.', 'error');
        console.error('Checkout Error:', error);
    }
}

// FIX: الإشعار يتضمن تفاصيل الأصناف
async function sendTelegramNotification(orderId, name, phone, address, total, shipping, paymentMethod, items) {
    if (!TELEGRAM_BOT_TOKEN) return;
    const shortId = `GLW-${orderId.toString().substring(0, 6).toUpperCase()}`;

    const itemsText = items.map(i => `  • ${i.name} × ${i.qty} — ${i.price * i.qty} EGP`).join('\n');

    const message = `
🛍️ *أوردر جديد من الموقع!*
━━━━━━━━━━━━━━━━━━
👤 *الاسم:* ${name}
📞 *الموبايل:* ${phone}
📍 *العنوان:* ${address}
━━━━━━━━━━━━━━━━━━
📦 *الأصناف:*
${itemsText}
━━━━━━━━━━━━━━━━━━
🚚 *الشحن:* ${shipping === 0 ? 'مجاني ✅' : shipping + ' EGP'}
💰 *الإجمالي:* ${total} EGP
💳 *الدفع:* ${paymentMethod}
🏷️ *رقم الطلب:* #${shortId}
━━━━━━━━━━━━━━━━━━
🚀 ادخل الداشبورد لتأكيد الطلب!
    `;

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' })
        });
    } catch (err) {
        console.log('Telegram Error:', err);
    }
}
