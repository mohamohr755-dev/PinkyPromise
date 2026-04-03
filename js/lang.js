// 1. القاموس (Dictionary) الشامل المدمج
const translations = {
    en: {
        // عام (General)
        home: "Home",
        shop: "Shop",
        account: "Account",
        switchBtn: "عربي",
        shopByBrand: "Shop By Brand",
        searchPlaceholder: "Search for products, brands...",

        // الرئيسية (Homepage Heroes & Promos)
        promo: "Enjoy Free Shipping on all orders over 2,000 EGP 🚚 | 10% off all items!",
        heroSub: "Where Beauty Meets Nature",
        heroTitle: "Pinky Promise<br>Cosmetics",
        heroSub1: "Premium Skincare",
        heroTitle1: "Your Glow,<br>Our Obsession.",
        heroSub2: "New Arrivals",
        heroTitle2: "Discover The<br>Korean Secrets.",
        heroSub3: "Limited Offer",
        heroTitle3: "Get 10% Off<br>Your First Order.",
        shopNow: "Shop Now",

        // المتجر (Shop)
        shopAll: "Shop All",
        shopByConcern: "SHOP BY SKIN CONCERN",
        shopByCategory: "Shop By Category",
        filterBrand: "Brand:",
        allBrands: "All Brands",
        sortBy: "Sort By:",
        defaultSort: "Default",
        priceLow: "Price: Low to High",
        priceHigh: "Price: High to Low",
        offers: "Offers %",
        cleansers: "Cleansers",
        toners: "Toners",
        serums: "Serums & Essences",
        moisturizers: "Moisturizers",
        newArrivals: "New Arrivals",
        addToCart: "Add to Cart",
        quickView: "Quick View",
        saleBadge: "SALE",
        newBadge: "NEW",
        orderConfirmedTitle: "Order Confirmed!",
        orderConfirmedDesc: "Thank you for your purchase. We've received your order and it's currently being processed.",
        orderNumberText: "Order Number:",
        continueShopping: "Continue Shopping",
        viewOrders: "View My Orders",
        // السلة (Cart)
        cartTitle: "Shopping Cart",
        addMore: "Add",
        forFreeShipping: "for Free Shipping!",
        emptyCart: "Your cart is empty 🥺",
        total: "Total:",
        checkoutBtn: "Checkout",
        qtyText: "Qty:",
        removeText: "Remove",
        cartEmptyAlert: "Cart is empty, add products first!",

        // الحساب وتسجيل الدخول (Auth)
        backToStore: "Back to Store",
        loginTitle: "Login",
        emailLabel: "Email Address",
        emailPlaceholder: "example@email.com",
        passwordLabel: "Password",
        passwordPlaceholder: "********",
        loginSubmit: "Login",
        noAccount: "Don't have an account?",
        createAccount: "Create a new account",
        registerTitle: "Create Account",
        fullNameLabel: "Full Name",
        phoneLabel: "Phone Number",
        registerSubmit: "Sign Up",
        haveAccount: "Already have an account?",

        // البروفايل (Profile)
        myInfo: "Account Details",
        skinProfile: "Skin Profile",
        myWishlist: "My Wishlist",
        myOrders: "Order History",
        logout: "Logout",
        loading: "Loading...",

        // الفوتر (Footer)
        footerDesc: "Join our newsletter to get the latest beauty updates, exclusive offers, and a 5% discount on your first order!",
        subscribeBtn: "Subscribe",
        quickLinks: "Quick Links",
        myAccount: "My Account",
        trackOrder: "Track Order",
        customerCare: "Customer Care",
        contactUs: "Contact Us",
        shippingInfo: "Shipping Info",
        refundPolicy: "Refund Policy",

        // رسائل الجافاسكريبت (JS Messages)
        noProducts: "No products available currently.",
        loginReqTitle: "Oops!",
        loginReqText: "Please login to save products to your wishlist.",
        loginBtn: "Login",
        cancelBtn: "Cancel",
        removedWishlist: "Removed from wishlist",
        addedWishlist: "Added to wishlist ❤️",
        outOfStock: "Sorry, out of stock!"
    },
    ar: {
        // عام (General)
        home: "الرئيسية",
        shop: "المتجر",
        account: "حسابي",
        switchBtn: "EN",
        searchPlaceholder: "ابحث عن المنتجات، الماركات...",

        // الرئيسية (Homepage Heroes & Promos)
        promo: "استمتعي بشحن مجاني للطلبات فوق 2000 جنيه 🚚 | خصم 10% على كل المنتجات!",
        heroSub: "حيث يلتقي الجمال بالطبيعة",
        heroTitle: "بينكي بروميس<br>كوزمتكس",
        heroSub1: "عناية فائقة بالبشرة",
        heroTitle1: "إشراقتك،<br>هي شغفنا.",
        heroSub2: "وصل حديثاً",
        heroTitle2: "اكتشفي أسرار<br>الجمال الكوري.",
        heroSub3: "عرض لفترة محدودة",
        heroTitle3: "احصلي على خصم 10%<br>على أول طلب.",
        shopNow: "تسوقي الآن",
        orderConfirmedTitle: "تم تأكيد الطلب!",
        orderConfirmedDesc: "شكراً لتسوقك معنا. استلمنا طلبك وجاري تجهيزه الآن.",
        orderNumberText: "رقم الطلب:",
        continueShopping: "مواصلة التسوق",
        viewOrders: "عرض طلباتي",
        // المتجر (Shop)
        shopAll: "تسوقي الكل",
        shopByConcern: "تسوقي حسب مشكلة البشرة",
        shopByCategory: "تسوقي بالقسم",
        filterBrand: "الماركة:",
        allBrands: "كل الماركات",
        sortBy: "ترتيب حسب:",
        defaultSort: "الافتراضي",
        priceLow: "السعر: من الأقل للأعلى",
        priceHigh: "السعر: من الأعلى للأقل",
        offers: "عروض %",
        cleansers: "غسول",
        toners: "تونر",
        serums: "سيروم وإيسنس",
        moisturizers: "مرطبات",
        newArrivals: "وصل حديثاً",
        addToCart: "إضافة للسلة",
        quickView: "نظرة سريعة",
        saleBadge: "خصم",
        newBadge: "جديد",
        shopByBrand: "تسوقي بالماركة",

        // السلة (Cart)
        cartTitle: "سلة المشتريات",
        addMore: "أضف",
        forFreeShipping: "للحصول على شحن مجاني!",
        emptyCart: "سلة المشتريات فارغة 🥺",
        total: "المجموع:",
        checkoutBtn: "إتمام الطلب",
        qtyText: "الكمية:",
        removeText: "إزالة",
        cartEmptyAlert: "السلة فارغة، أضف منتجات أولاً!",

        // الحساب وتسجيل الدخول (Auth)
        backToStore: "العودة للمتجر",
        loginTitle: "تسجيل الدخول",
        emailLabel: "البريد الإلكتروني",
        emailPlaceholder: "example@email.com",
        passwordLabel: "كلمة المرور",
        passwordPlaceholder: "********",
        loginSubmit: "دخول",
        noAccount: "ليس لديك حساب؟",
        createAccount: "إنشاء حساب جديد",
        registerTitle: "إنشاء حساب جديد",
        fullNameLabel: "الاسم بالكامل",
        phoneLabel: "رقم الهاتف",
        registerSubmit: "تسجيل",
        haveAccount: "لديك حساب بالفعل؟",

        // البروفايل (Profile)
        myInfo: "تفاصيل الحساب",
        skinProfile: "نوع البشرة",
        myWishlist: "مفضلتي",
        myOrders: "سجل الطلبات",
        logout: "تسجيل الخروج",
        loading: "جاري التحميل...",

        // الفوتر (Footer)
        footerDesc: "اشتركي في النشرة البريدية عشان يوصلك أحدث عروض التجميل، وخصم 5% على أول طلب ليكي!",
        subscribeBtn: "اشتراك",
        quickLinks: "روابط سريعة",
        myAccount: "حسابي",
        trackOrder: "تتبع الطلب",
        customerCare: "خدمة العملاء",
        contactUs: "تواصل معنا",
        shippingInfo: "معلومات الشحن",
        refundPolicy: "سياسة الاسترجاع",

        // رسائل الجافاسكريبت (JS Messages)
        noProducts: "لا توجد منتجات متاحة حالياً.",
        loginReqTitle: "عذراً!",
        loginReqText: "يرجى تسجيل الدخول لحفظ المنتجات في المفضلة.",
        loginBtn: "تسجيل الدخول",
        cancelBtn: "إلغاء",
        removedWishlist: "تمت الإزالة من المفضلة",
        addedWishlist: "تمت الإضافة للمفضلة ❤️",
        outOfStock: "عذراً، نفذت الكمية من المخزن!"
    }
};

// 2. قراءة اللغة الحالية (الافتراضي إنجليزي)
let currentLang = localStorage.getItem('pinky_lang') || 'en';

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
});

// 3. زرار تبديل اللغة
// زرار تبديل اللغة (محمي ضد أي أعطال)
window.toggleLang = function() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    localStorage.setItem('pinky_lang', currentLang);
    applyLanguage(currentLang);

    // تحديث المكونات الديناميكية بدون ما توقف باقي الموقع
    try { if (typeof window.updateCartUI === 'function') window.updateCartUI(); } catch(e){}
    try { if (typeof window.applyFilters === 'function') window.applyFilters(); } catch(e){}
    try { if (typeof window.renderStore === 'function' && typeof allProducts !== 'undefined') window.renderStore(allProducts); } catch(e){}
}

// 4. تطبيق اللغة على الشاشة
function applyLanguage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
                el.placeholder = translations[lang][key];
            } else {
                el.innerHTML = translations[lang][key];
            }
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // تحديث زرار اللغة بالأيقونة
    const switchBtn = document.getElementById('lang-switch-btn');
    if (switchBtn) {
        if (lang === 'en') {
            switchBtn.innerHTML = '<i class="fas fa-globe"></i> عربي';
        } else {
            switchBtn.innerHTML = '<i class="fas fa-globe"></i> EN';
        }
    }
    
    // تحديث أيقونات اللغة في النافبار (لو مبنية بطريقة تانية)
    document.querySelectorAll('.fa-globe').forEach(icon => {
        const parent = icon.parentElement;
        if(parent && parent.tagName !== 'BUTTON' && !parent.id.includes('lang-switch')) {
             parent.title = lang === 'en' ? 'عربي' : 'English';
        }
    });
}