let slideIndex = 0;
let slides = document.querySelectorAll('.slide');
let dots = document.querySelectorAll('.dot');
let sliderInterval;

// تشغيل السلايدر أول ما الصفحة تحمل
document.addEventListener('DOMContentLoaded', () => {
    if(slides.length > 0) {
        showSlide(slideIndex);
        startAutoSlide();
    }
});

function showSlide(index) {
    // تظبيط الاندكس لو عدى عدد السلايدات
    if (index >= slides.length) slideIndex = 0;
    if (index < 0) slideIndex = slides.length - 1;

    // إخفاء كل السلايدات والنقط
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // إظهار السلايد الحالي والنقطة بتاعته
    slides[slideIndex].classList.add('active');
    dots[slideIndex].classList.add('active');
}

window.moveSlide = function(step) {
    slideIndex += step;
    showSlide(slideIndex);
    resetAutoSlide(); // بنرستر التايمر عشان لو العميل داس بإيده السلايدر ميقلبش فجأة
}

window.currentSlide = function(index) {
    slideIndex = index;
    showSlide(slideIndex);
    resetAutoSlide();
}

function startAutoSlide() {
    sliderInterval = setInterval(() => {
        slideIndex++;
        showSlide(slideIndex);
    }, 5000); // بيقلب لوحده كل 5 ثواني
}

function resetAutoSlide() {
    clearInterval(sliderInterval);
    startAutoSlide();
}