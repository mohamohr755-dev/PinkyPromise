const supabaseUrl = 'https://tjscjrcqgfmoknpwbpqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc2NqcmNxZ2Ztb2tucHdicHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzQ3ODQsImV4cCI6MjA5MDExMDc4NH0.a7Jz1ja0LxkSn33stddWcL30AD4Q3inFTbA7lukZBx8';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// FIX: supabaseClient الآن معرّف قبل أي استخدام له
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'profile.html';
    }
});

// 1. تبديل الواجهة بين تسجيل الدخول وإنشاء الحساب
window.toggleAuth = function(type) {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    if (type === 'register') {
        loginBox.style.display = 'none';
        registerBox.style.display = 'block';
    } else {
        registerBox.style.display = 'none';
        loginBox.style.display = 'block';
    }
}

// 2. إنشاء حساب جديد (Sign Up)
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    Swal.fire({ title: 'جاري إنشاء حسابك...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-phone').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: { data: { full_name: name, phone: phone } }
        });

        if (error) throw error;

        if (data.user) {
            const { error: dbError } = await supabaseClient.from('customers').insert([
                { id: data.user.id, full_name: name, phone_number: phone, email: email }
            ]);
            if (dbError) console.error("Error saving to CRM:", dbError);
        }

        Swal.fire({
            icon: 'success',
            title: 'أهلاً بك في Pinky Promise! 🎉',
            text: 'تم إنشاء حسابك بنجاح.',
            confirmButtonColor: '#000'
        }).then(() => { window.location.href = 'index.html'; });

    } catch (error) {
        let errorMsg = 'حدث خطأ أثناء التسجيل، تأكد من البيانات.';
        if (error.message.includes('already registered')) errorMsg = 'هذا البريد مسجل بالفعل.';
        if (error.message.includes('Password should be')) errorMsg = 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل).';
        Swal.fire('خطأ', errorMsg, 'error');
    }
});

// 3. تسجيل الدخول (Sign In)
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    Swal.fire({ title: 'جاري تسجيل الدخول...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        Swal.fire({ icon: 'success', title: 'مرحباً بعودتك! ✨', showConfirmButton: false, timer: 1500 })
            .then(() => { window.location.href = 'index.html'; });

    } catch (error) {
        if (error.message.includes('Email not confirmed')) {
            Swal.fire('تأكيد الحساب', 'يرجى مراجعة بريدك الإلكتروني لتأكيد الحساب أولاً.', 'warning');
        } else if (error.message.includes('Invalid login')) {
            Swal.fire('بيانات غير صحيحة', 'تأكد من البريد الإلكتروني وكلمة المرور.', 'error');
        } else {
            Swal.fire('خطأ', error.message, 'error');
        }
    }
});
