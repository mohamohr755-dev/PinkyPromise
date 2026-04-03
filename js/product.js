// ==========================================
// product.js - صفحة عرض المنتج والتقييمات
// ==========================================

// استخراج ID المنتج من رابط الصفحة (مثال: product.html?id=123)
const urlParams = new URLSearchParams(window.location.search);
const currentProductId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    if (!currentProductId) {
        document.getElementById('single-product-container').innerHTML = `<h2 style="text-align:center; margin-top:50px;">المنتج غير موجود</h2>`;
        return;
    }
    
    await loadSingleProduct();
    await loadProductReviews();
});

// 1. تحميل بيانات المنتج وعرضها
async function loadSingleProduct() {
    try {
        const { data: product, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .eq('id', currentProductId)
            .single();

        if (error || !product) throw error;

        // حساب الخصم لو فيه سعر قديم
        let priceHTML = `<div class="p-price">${product.price} EGP</div>`;
        if (product.old_price && product.old_price > product.price) {
            priceHTML = `<div class="p-price"><span class="old-price">${product.old_price} EGP</span> ${product.price} EGP <span style="color:red; font-size:16px;">(Sale!)</span></div>`;
        }

        const isWished = window.userWishlist && window.userWishlist.includes(product.id) ? 'active' : '';

        // رسم المنتج في الصفحة
        document.getElementById('single-product-container').innerHTML = `
            <div class="product-page-container">
                <div class="product-image">
                    <img src="${product.image_url}" alt="${product.name_en || product.name}" style="width:100%; border-radius:12px; object-fit:cover;">
                </div>
                <div class="product-details">
                    <span class="p-brand">${product.brand || 'Pinky Promise'}</span>
                    <h1 class="p-title" data-ar="${product.name_ar || product.name}">${product.name_en || product.name}</h1>
                    ${priceHTML}
                    
                    <div class="action-row">
                        <div class="qty-box">
                            <button class="qty-btn" onclick="changePty(-1)">-</button>
                            <input type="number" id="p-qty-input" class="qty-input" value="1" min="1" max="${product.stock_quantity || 10}" readonly>
                            <button class="qty-btn" onclick="changePty(1)">+</button>
                        </div>
                        <button class="add-btn" onclick="addCurrentProductToCart('${product.id}')">Add to Cart 🛒</button>
                        <button class="wishlist-large-btn ${isWished}" onclick="toggleWishlist(event, '${product.id}', this)"><i class="fas fa-heart"></i></button>
                    </div>
                    
                    <div class="p-description">${product.description || 'لا يوجد وصف متاح لهذا المنتج حالياً.'}</div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Error loading product:", err);
    }
}

// دالة تغيير كمية المنتج قبل إضافته للسلة
window.changePty = function(amount) {
    const input = document.getElementById('p-qty-input');
    let val = parseInt(input.value) + amount;
    if (val < 1) val = 1;
    if (val > parseInt(input.max)) val = parseInt(input.max);
    input.value = val;
}

// إضافة المنتج الحالي بالكمية المختارة للسلة
window.addCurrentProductToCart = function(id) {
    const qty = parseInt(document.getElementById('p-qty-input').value);
    // هنستخدم دالة الإضافة اللي عملناها في cart.js بس هنعدل الكمية
    for(let i=0; i<qty; i++){
        window.addToCart(id);
    }
}

// ==========================================
// 2. نظام التقييمات (Reviews System)
// ==========================================

// تحميل التقييمات (الموافق عليها بس)
async function loadProductReviews() {
    const container = document.getElementById('reviews-container');
    
    try {
        const { data: reviews, error } = await window.supabaseClient
            .from('reviews')
            .select('*')
            .eq('product_id', currentProductId)
            .eq('is_approved', true) // السر هنا: مش هيجيب غير اللي إنت وافقت عليه
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!reviews || reviews.length === 0) {
            container.innerHTML = `<p style="color:#888; text-align:center; padding:20px;">لا توجد تقييمات لهذا المنتج حتى الآن. كن أول من يكتب رأيه!</p>`;
            return;
        }

        container.innerHTML = reviews.map(r => {
            let stars = '';
            for(let i=1; i<=5; i++) stars += `<i class="fas fa-star" style="color:${i <= r.rating ? '#f39c12' : '#eee'};"></i>`;
            const date = new Date(r.created_at).toLocaleDateString();
            
            return `
                <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong style="font-size:16px;">${r.customer_name}</strong>
                        <span style="color:#888; font-size:13px;">${date}</span>
                    </div>
                    <div style="margin-bottom:10px;">${stars}</div>
                    <p style="color:#555; line-height:1.5;">${r.comment || ''}</p>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Error loading reviews:", err);
    }
}

// إرسال تقييم جديد للداتابيز
window.submitReview = async function() {
    // لو مفيش يوزر مسجل دخول، اطلب منه يسجل
    if (!window.currentUser) {
        Swal.fire({ title: 'تسجيل الدخول مطلوب', text: 'يجب أن تسجل دخولك أولاً لتتمكن من كتابة تقييم.', icon: 'warning', confirmButtonText: 'حسناً' });
        return;
    }

    const rating = document.getElementById('review-stars').value;
    const comment = document.getElementById('review-text').value.trim();

    if (!comment) {
        window.Toast.fire({ icon: 'warning', title: 'رجاءً اكتب رأيك في التعليق' });
        return;
    }

    try {
        const { error } = await window.supabaseClient.from('reviews').insert([{
            product_id: currentProductId,
            customer_name: window.currentUser.user_metadata?.full_name || 'عميل Pinky Promise',
            rating: parseInt(rating),
            comment: comment,
            is_approved: false // بينزل مرفوض لحد ما الإدارة توافق عليه
        }]);

        if (error) throw error;

        // تفريغ الخانة ورسالة شكر
        document.getElementById('review-text').value = '';
        Swal.fire({
            title: 'شكراً لتقييمك! 💖',
            text: 'تم إرسال تقييمك للإدارة بنجاح، وسيتم نشره قريباً.',
            icon: 'success',
            confirmButtonColor: 'var(--primary-color)'
        });

    } catch (err) {
        console.error("Review Submit Error:", err);
        window.Toast.fire({ icon: 'error', title: 'حدث خطأ، حاول مرة أخرى' });
    }
}