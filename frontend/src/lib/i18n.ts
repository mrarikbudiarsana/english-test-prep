export type Lang = 'id' | 'en';

const translations = {
  // ─── Navbar ─────────────────────────────────────────────────────────────────
  nav_dashboard: { id: 'Beranda', en: 'Dashboard' },
  nav_practice_tests: { id: 'Latihan Soal', en: 'Practice Tests' },
  nav_pricing: { id: 'Harga Berlangganan', en: 'Pricing' },
  nav_admin_panel: { id: 'Panel Admin', en: 'Admin Panel' },
  nav_settings: { id: 'Pengaturan', en: 'Settings' },
  nav_sign_out: { id: 'Keluar', en: 'Sign Out' },
  nav_sign_in: { id: 'Masuk', en: 'Sign In' },
  nav_get_started: { id: 'Daftar Sekarang', en: 'Get Started Free' },

  // ─── Footer ─────────────────────────────────────────────────────────────────
  footer_tagline: {
    id: 'Tes latihan TOEFL ITP otentik dengan sistem penilaian resmi. Gerbang menuju kesuksesan global.',
    en: 'Authentic TOEFL ITP practice tests with official-style scoring. Your gateway to global success.',
  },
  footer_quick_links: { id: 'Tautan Cepat', en: 'Quick Links' },
  footer_support: { id: 'Dukungan', en: 'Support' },
  footer_copyright: {
    id: '© {year} English with Arik · ITP Ready. Hak cipta dilindungi.',
    en: '© {year} English with Arik · ITP Ready. All rights reserved.',
  },
  footer_trademark: {
    id: 'TOEFL ITP® adalah merek dagang terdaftar dari ETS. Platform ini tidak berafiliasi dengan ETS.',
    en: 'TOEFL ITP® is a registered trademark of ETS. This platform is not affiliated with ETS.',
  },
  footer_link_tests: { id: 'Tes Latihan', en: 'Practice Tests' },
  footer_link_pricing: { id: 'Harga & Paket', en: 'Pricing & Plans' },
  footer_link_dashboard: { id: 'Dasbor', en: 'Dashboard' },
  footer_link_settings: { id: 'Pengaturan', en: 'Settings' },

  // ─── Landing page ────────────────────────────────────────────────────────────
  hero_badge: { id: 'Simulasi TOEFL ITP', en: 'TOEFL ITP Simulations' },
  hero_title_1: { id: 'Persiapkan', en: 'Prepare for' },
  hero_title_3: { id: 'dengan Percaya Diri', en: 'with Confidence' },
  hero_subtitle: {
    id: 'Tes latihan penuh yang mencerminkan ujian TOEFL ITP sesungguhnya — mencakup Listening, Structure & Written Expression, dan Reading Comprehension dengan sistem penilaian otentik.',
    en: 'Full-length practice tests that mirror the real TOEFL ITP exam — sectioned into Listening, Structure & Written Expression, and Reading Comprehension with authentic scoring.',
  },
  hero_cta_dashboard: { id: 'Ke Dasbor', en: 'Go to Dashboard' },
  hero_cta_start: { id: 'Mulai Latihan Gratis', en: 'Start Free Practice' },
  hero_cta_plans: { id: 'Lihat Paket', en: 'View Plans' },
  hero_trust_1: { id: 'Tes gratis tersedia', en: 'Free tests included' },
  hero_trust_2: { id: 'Tanpa kartu kredit', en: 'No credit card needed' },
  hero_trust_3: { id: 'Hasil skor instan', en: 'Instant score results' },

  disclaimer_text: {
    id: 'Platform latihan saja — tidak ada sertifikat yang diterbitkan.',
    en: 'Practice platform only — no certificate is issued.',
  },
  disclaimer_sub: {
    id: 'Hasil tidak dapat digunakan untuk pendaftaran universitas, lamaran kerja, atau tujuan resmi apa pun.',
    en: 'Results cannot be used for university admissions, job applications, or any official purpose.',
  },

  how_label: { id: 'Cara kerjanya', en: 'How it works' },
  how_title: { id: 'Empat langkah menuju skor Anda', en: 'Four steps to your score' },

  step1_title: { id: 'Buat akun Anda', en: 'Create your account' },
  step1_body: {
    id: 'Daftar gratis dalam hitungan menit. Tidak perlu kartu kredit untuk memulai.',
    en: 'Sign up free in under a minute. No credit card required to start.',
  },
  step2_title: { id: 'Pilih tes', en: 'Choose a test' },
  step2_body: {
    id: 'Pilih dari pustaka tes latihan TOEFL ITP penuh kami.',
    en: 'Pick from our library of full-length TOEFL ITP practice tests.',
  },
  step3_title: { id: 'Ikuti tesnya', en: 'Take the test' },
  step3_body: {
    id: 'Kondisi ujian realistis — timer, kontrol audio, tidak bisa kembali di bagian Listening.',
    en: 'Realistic exam conditions — timer, audio controls, no going back in Listening.',
  },
  step4_title: { id: 'Lihat skor Anda', en: 'See your score' },
  step4_body: {
    id: 'Terima hasil konversi skor Listening, Structure, dan Reading secara instan (310–677).',
    en: 'Instantly receive your Listening, Structure, and Reading scaled scores (310–677).',
  },

  sections_label: { id: 'Apa yang dicakup', en: "What's covered" },
  sections_title: { id: 'Tiga bagian TOEFL ITP', en: 'All three TOEFL ITP sections' },
  sections_subtitle: {
    id: '140 pertanyaan dalam tiga bagian, total 115 menit — persis sesuai format TOEFL ITP Level 1.',
    en: '140 questions across three sections, 115 minutes total — exactly matching the TOEFL ITP Level 1 format.',
  },
  sections_score_range_label: { id: 'Rentang Skor Scaled Total', en: 'Total Scaled Score Range' },
  sections_score_level: { id: 'TOEFL ITP Level 1', en: 'TOEFL ITP Level 1' },
  sections_score_range_item: { id: 'Rentang skor scaled: ', en: 'Scaled score range: ' },

  feat_score_title: { id: 'Skala Skor Resmi', en: 'Real Score Scale' },
  feat_score_body: {
    id: 'Dapatkan total skor scaled pada skala TOEFL ITP resmi 310–677, plus rincian per bagian.',
    en: 'Get your total scaled score on the official 310–677 TOEFL ITP scale, plus section breakdowns.',
  },
  feat_timed_title: { id: 'Simulasi dengan Batas Waktu', en: 'Timed Conditions' },
  feat_timed_body: {
    id: 'Berlatih dengan simulasi waktu ujian yang otentik. Audio hanya diputar sekali, seperti ujian nyata.',
    en: 'Practice under authentic exam timing. Audio plays only once, just like the real test.',
  },
  feat_lines_title: { id: 'Teks dengan Nomor Baris', en: 'Line-Numbered Passages' },
  feat_lines_body: {
    id: 'Bagian Reading menampilkan nomor baris untuk referensi cepat, sesuai format resmi.',
    en: 'Reading sections display line numbers for easy reference, matching the official paper format.',
  },

  cta_title_1: { id: 'Ingin menguasai', en: 'Want to master' },
  cta_title_2: { id: 'TOEFL ITP bersama guru?', en: 'TOEFL ITP with a teacher?' },
  cta_body: {
    id: 'Bergabunglah dengan kursus TOEFL ITP oleh English with Arik — pelajaran terstruktur, bimbingan ahli, dan tes latihan penuh untuk mencapai skor target Anda.',
    en: 'Join the TOEFL ITP course by English with Arik — structured lessons, expert guidance, and full practice tests to get you to your target score.',
  },
  cta_button: { id: 'Ikuti Kursus TOEFL ITP', en: 'Join the TOEFL ITP Course' },

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  dash_welcome_back: { id: 'Selamat datang kembali', en: 'Welcome back' },
  dash_subtitle: {
    id: 'Beranda latihan TOEFL ITP Anda. Teruslah berlatih! Setiap langkah membawa Anda makin dekat ke skor impian.',
    en: 'Your TOEFL ITP practice home. Keep practicing! Every step brings you closer to your dream score.',
  },
  dash_start_practice: { id: 'Mulai Latihan', en: 'Start Practice' },
  dash_upgrade_plan: { id: 'Upgrade Paket', en: 'Upgrade Plan' },
  dash_tests_completed: { id: 'Tes Diselesaikan', en: 'Tests Completed' },
  dash_tests_sub: { id: 'tes TOEFL ITP penuh', en: 'full TOEFL ITP tests' },
  dash_avg_score: { id: 'Skor Rata-rata', en: 'Average Score' },
  dash_avg_sub: { id: 'skor konversi (310–677)', en: 'scaled score (310–677)' },
  dash_best_score: { id: 'Skor Terbaik', en: 'Best Score' },
  dash_best_sub: { id: 'rekor pribadi Anda', en: 'your personal best' },
  dash_recent_tests: { id: 'Tes Terbaru', en: 'Recent Tests' },
  dash_view_all: { id: 'Lihat semua →', en: 'View all →' },
  dash_in_progress: { id: 'Sedang berlangsung', en: 'In progress' },
  dash_no_tests_title: { id: 'Belum ada tes', en: 'No tests yet' },
  dash_no_tests_body: {
    id: 'Ikuti tes latihan TOEFL ITP pertama Anda dan mulai lacak kemajuan Anda.',
    en: 'Take your first full TOEFL ITP practice test and start tracking your progress.',
  },
  dash_browse_tests: { id: 'Jelajahi Tes', en: 'Browse Tests' },
  dash_tip_listening_title: { id: 'Strategi Listening', en: 'Listening Strategy' },
  dash_tip_listening_body: {
    id: 'Audio hanya diputar sekali di ujian nyata. Berlatih tanpa mengulang — ini membangun fokus.',
    en: "Audio plays only once in the real test. Practice not rewinding — it builds focus.",
  },
  dash_tip_structure_title: { id: 'Tips Structure', en: 'Structure Tip' },
  dash_tip_structure_body: {
    id: 'Untuk Written Expression, singkirkan pilihan yang jelas salah sebelum memilih jawaban Anda.',
    en: "For Written Expression, eliminate obviously wrong choices first before selecting your answer.",
  },
  dash_tip_reading_title: { id: 'Kecepatan Reading', en: 'Reading Speed' },
  dash_tip_reading_body: {
    id: 'Baca sekilas teks terlebih dahulu, lalu baca pertanyaan dengan cermat. Anda tidak perlu membaca setiap kata.',
    en: "Skim the passage first, then read questions carefully. You don't need to read every word.",
  },

  // ─── Tests listing ───────────────────────────────────────────────────────────
  tests_library_label: { id: 'Pustaka Latihan', en: 'Practice Library' },
  tests_choose_title: { id: 'Pilih Tes Anda', en: 'Choose Your Test' },
  tests_choose_body: {
    id: 'Pilih dari tes latihan {exam} kami yang dirancang untuk membantu Anda meningkatkan skor estimasi Anda.',
    en: 'Select from our {exam} practice tests designed to help you improve your estimated score.',
  },
  tests_free_access: { id: 'Akses Gratis', en: 'Free Access' },
  tests_remaining: { id: 'Akses ke paket tes gratis', en: 'Access to free practice tests' },
  tests_upgrade: { id: 'Upgrade Paket', en: 'Upgrade Plan' },
  tests_search_placeholder: { id: 'Cari tes {exam}...', en: 'Search {exam} tests...' },
  tests_no_found_title: { id: 'Tes tidak ditemukan', en: 'No tests found' },
  tests_no_found_body: { id: 'Coba sesuaikan kata pencarian Anda.', en: 'Try adjusting your search query.' },
  tests_clear_search: { id: 'Hapus Pencarian', en: 'Clear Search' },
  tests_free_section: { id: 'Tes Gratis', en: 'Free Tests' },
  tests_premium_section: { id: 'Tes Premium', en: 'Premium Tests' },
  tests_min_label: { id: 'menit', en: 'min' },

  // ─── Pricing ─────────────────────────────────────────────────────────────────
  pricing_title: { id: 'Harga Sederhana dan Transparan', en: 'Simple, Transparent Pricing' },
  pricing_subtitle: {
    id: 'Pilih paket yang sesuai persiapan TOEFL ITP Anda. Upgrade atau downgrade kapan saja.',
    en: 'Choose the plan that fits your TOEFL ITP preparation. Upgrade or downgrade at any time.',
  },
  pricing_monthly: { id: 'Bulanan', en: 'Monthly' },
  pricing_yearly: { id: 'Tahunan', en: 'Yearly' },
  pricing_save: { id: '(Hemat 20%)', en: '(Save 20%)' },
  pricing_most_popular: { id: 'Paling Populer', en: 'Most Popular' },
  pricing_per_month: { id: 'bulan', en: 'month' },
  pricing_per_year: { id: 'tahun', en: 'year' },
  pricing_get_started_free: { id: 'Mulai Gratis', en: 'Get Started for Free' },
  pricing_subscribe: { id: 'Berlangganan Sekarang', en: 'Subscribe Now' },
  pricing_processing: { id: 'Memproses...', en: 'Processing...' },
  pricing_loading: { id: 'Memuat paket...', en: 'Loading plans...' },

  // ─── Plan descriptions & perks (id) ─────────────────────────────────────────
  plan_free_desc: { id: 'Mulai dengan TOEFL ITP', en: 'Get started with TOEFL ITP' },
  plan_starter_desc: { id: 'Analisis performa Anda', en: 'Analyze your performance' },
  plan_pro_desc: { id: 'Kuasai semua bagian ITP', en: 'Master all ITP sections' },

  plan_free_perk1: { id: '2 tes TOEFL ITP penuh/bulan gratis', en: '2 free full TOEFL ITP tests/month' },
  plan_free_perk2: { id: 'Umpan balik skor dasar (310–677)', en: 'Basic score feedback (310–677)' },
  plan_free_perk3: { id: 'Daftar benar/salah', en: 'Correct/Incorrect list' },
  plan_free_perk4: { id: 'Akses komunitas', en: 'Community access' },

  plan_starter_perk1: { id: '10 tes TOEFL ITP penuh/bulan', en: '10 full TOEFL ITP tests/month' },
  plan_starter_perk2: { id: 'Rincian structure dan reading terperinci', en: 'Detailed structure and reading breakdown' },
  plan_starter_perk3: { id: 'Grafik perkembangan skor', en: 'Score progression charts' },
  plan_starter_perk4: { id: 'Kunci jawaban yang benar', en: 'Correct answer key' },
  plan_starter_perk5: { id: 'Grup Teman di WhatsApp', en: 'WhatsApp Peer Group' },

  plan_pro_perk1: { id: 'Tes TOEFL ITP penuh tak terbatas', en: 'Unlimited full TOEFL ITP tests' },
  plan_pro_perk2: { id: 'Penjelasan jawaban bertenaga AI', en: 'AI-powered answer explanations' },
  plan_pro_perk3: { id: 'Pendalaman tata bahasa dan kosa kata', en: 'Grammar and vocabulary deep dive' },
  plan_pro_perk4: { id: 'Grafik radar kelemahan keterampilan', en: 'Skill weakness radar charts' },
  plan_pro_perk5: { id: 'Dukungan prioritas WhatsApp dan email', en: 'Priority WhatsApp and email support' },

  // ─── Settings ────────────────────────────────────────────────────────────────
  settings_title: { id: 'Pengaturan Akun', en: 'Account Settings' },
  settings_profile_tab: { id: 'Profil', en: 'Profile' },
  settings_security_tab: { id: 'Keamanan', en: 'Security' },
  settings_profile_info: { id: 'Informasi Profil', en: 'Profile Information' },
  settings_profile_pic: { id: 'Foto Profil', en: 'Profile Picture' },
  settings_display_name: { id: 'Nama Tampilan', en: 'Display Name' },
  settings_enter_name: { id: 'Masukkan nama Anda', en: 'Enter your name' },
  settings_email: { id: 'Alamat Email', en: 'Email Address' },
  settings_save: { id: 'Simpan Perubahan', en: 'Save Changes' },
  settings_change_pw: { id: 'Ubah Kata Sandi', en: 'Change Password' },
  settings_new_pw: { id: 'Kata Sandi Baru', en: 'New Password' },
  settings_enter_pw: { id: 'Masukkan kata sandi baru', en: 'Enter new password' },
  settings_confirm_pw: { id: 'Konfirmasi Kata Sandi Baru', en: 'Confirm New Password' },
  settings_confirm_pw_placeholder: { id: 'Konfirmasi kata sandi baru', en: 'Confirm new password' },
  settings_update_pw: { id: 'Perbarui Kata Sandi', en: 'Update Password' },

  // ─── Login ───────────────────────────────────────────────────────────────────
  login_brand_headline: {
    id: 'Latihan TOEFL ITP Anda dimulai di sini.',
    en: 'Your TOEFL ITP practice starts here.',
  },
  login_brand_sub: {
    id: 'Simulasi penuh, penilaian otentik skala 310–677, dan umpan balik instan.',
    en: 'Full-length simulations, authentic scoring on the 310–677 scale, and instant feedback.',
  },
  login_stat_scale: { id: 'Skala Skor', en: 'Score Scale' },
  login_stat_questions: { id: 'Pertanyaan', en: 'Questions' },
  login_stat_duration: { id: 'Durasi', en: 'Duration' },
  login_welcome: { id: 'Selamat datang kembali', en: 'Welcome back' },
  login_subtitle: { id: 'Masuk ke akun Anda untuk melanjutkan.', en: 'Sign in to your account to continue.' },
  login_google: { id: 'Lanjutkan dengan Google', en: 'Continue with Google' },
  login_or_email: { id: 'atau masuk dengan email', en: 'or sign in with email' },
  login_email_label: { id: 'Alamat email', en: 'Email address' },
  login_password_label: { id: 'Kata sandi', en: 'Password' },
  login_forgot: { id: 'Lupa kata sandi?', en: 'Forgot password?' },
  login_button: { id: 'Masuk', en: 'Sign In' },
  login_signing_in: { id: 'Sedang masuk…', en: 'Signing in…' },
  login_no_account: { id: 'Belum punya akun?', en: "Don't have an account?" },
  login_create_free: { id: 'Buat gratis', en: 'Create one free' },

  // ─── Register ────────────────────────────────────────────────────────────────
  register_brand_headline: {
    id: 'Mulai perjalanan TOEFL ITP Anda hari ini.',
    en: 'Start your TOEFL ITP journey today.',
  },
  register_feat1: { id: 'Tes penuh Listening, Structure & Reading', en: 'Full-length Listening, Structure & Reading tests' },
  register_feat2: { id: 'Penilaian scaled 310–677 otentik', en: 'Authentic 310–677 scaled scoring' },
  register_feat3: { id: 'Audio diputar sekali — seperti ujian nyata', en: 'Audio plays once — just like the real exam' },
  register_feat4: { id: 'Rincian skor instan setelah setiap tes', en: 'Instant score breakdown after each test' },
  register_stat_scale: { id: 'Skala Skor', en: 'Score Scale' },
  register_stat_per_test: { id: 'Per Tes Penuh', en: 'Per Full Test' },
  register_stat_duration: { id: 'Total Durasi', en: 'Total Duration' },
  register_title: { id: 'Buat akun Anda', en: 'Create your account' },
  register_subtitle: { id: 'Gratis untuk memulai. Latihan TOEFL ITP hari ini.', en: 'Free to start. Practice TOEFL ITP today.' },
  register_sign_in_instead: { id: 'Masuk saja', en: 'Sign in instead' },
  register_full_name: { id: 'Nama Lengkap', en: 'Full Name' },
  register_name_placeholder: { id: 'Nama Anda', en: 'Your name' },
  register_email: { id: 'Alamat email', en: 'Email address' },
  register_password: { id: 'Kata sandi', en: 'Password' },
  register_pw_placeholder: { id: 'Minimal 6 karakter', en: 'At least 6 characters' },
  register_confirm_pw: { id: 'Konfirmasi Kata Sandi', en: 'Confirm Password' },
  register_confirm_placeholder: { id: 'Ulangi kata sandi Anda', en: 'Repeat your password' },
  register_creating: { id: 'Membuat akun…', en: 'Creating account…' },
  register_create_btn: { id: 'Buat Akun Gratis', en: 'Create Free Account' },
  register_or: { id: 'atau', en: 'or' },
  register_google: { id: 'Daftar dengan Google', en: 'Sign up with Google' },
  register_terms: {
    id: 'Dengan membuat akun, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.',
    en: 'By creating an account, you agree to our Terms of Service and Privacy Policy.',
  },
  // error messages
  register_err_mismatch: { id: 'Kata sandi tidak cocok', en: 'Passwords do not match' },
  register_err_short: { id: 'Kata sandi minimal 6 karakter', en: 'Password must be at least 6 characters' },
  register_err_fallback: { id: 'Gagal membuat akun', en: 'Failed to create account' },

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  forgot_title: { id: 'Reset kata sandi Anda', en: 'Reset your password' },
  forgot_subtitle: {
    id: 'Masukkan email Anda dan kami akan mengirimkan tautan reset.',
    en: "Enter your email and we'll send you a reset link.",
  },
  forgot_email_label: { id: 'Alamat email', en: 'Email address' },
  forgot_sending: { id: 'Mengirim...', en: 'Sending...' },
  forgot_send_btn: { id: 'Kirim Tautan Reset', en: 'Send Reset Link' },
  forgot_back: { id: 'Kembali ke Masuk', en: 'Back to Sign In' },
  forgot_success: {
    id: 'Email reset kata sandi terkirim! Periksa kotak masuk Anda.',
    en: 'Password reset email sent! Check your inbox.',
  },

  // ─── Language switcher ───────────────────────────────────────────────────────
  lang_switch_to_en: { id: 'EN', en: 'EN' },
  lang_switch_to_id: { id: 'ID', en: 'ID' },

  // ─── YEC Promo ─────────────────────────────────────────────────────────────
  yec_promo_title: { id: 'Siap Ambil Tes Resmi?', en: 'Ready for the Official Exam?' },
  yec_promo_subtitle: {
    id: 'Dapatkan sertifikat resmi TOEFL iTP® Anda secara online melalui YEC (mitra resmi IIEF & ETS). Gunakan kode diskon khusus kami untuk mendapatkan potongan harga Rp 20.000!',
    en: 'Get your official TOEFL iTP® certificate online through YEC (official IIEF & ETS partner). Use our exclusive promo code below to enjoy a Rp 20,000 discount!',
  },
  yec_promo_feat1: { id: 'Daftar & ujian online dari rumah', en: 'Register & test online from home' },
  yec_promo_feat2: { id: 'Sertifikat fisik dikirim ke rumah Anda', en: 'Physical certificate shipped to your home' },
  yec_promo_feat3: { id: 'Ujian digital resmi & diakui secara nasional', en: 'Official digital exam & nationally recognized' },
  yec_promo_normal_price: { id: 'Harga Normal', en: 'Regular Price' },
  yec_promo_discount_price: { id: 'Harga Diskon', en: 'Discounted Price' },
  yec_promo_code_label: { id: 'Kode Diskon Khusus', en: 'Special Promo Code' },
  yec_promo_copy: { id: 'Salin', en: 'Copy' },
  yec_promo_copied: { id: 'Tersalin!', en: 'Copied!' },
  yec_promo_cta: { id: 'Daftar di YEC Sekarang', en: 'Register at YEC Now' },

  // ─── Results Page Course CTA ───────────────────────────────────────────────
  results_course_cta_title: { id: 'Ingin Meningkatkan Skor Ini?', en: 'Want to Improve This Score?' },
  results_course_cta_body: {
    id: 'Belajar langsung bersama English with Arik dalam kursus persiapan TOEFL ITP intensif. Dapatkan pelajaran terstruktur, bimbingan ahli, dan rahasia taktik ujian untuk mengamankan skor target Anda!',
    en: 'Study directly with English with Arik in an intensive TOEFL ITP prep course. Get structured lessons, expert guidance, and exam tactics to secure your target score!',
  },
  results_course_cta_btn: { id: 'Belajar Bersama Arik Sekarang', en: 'Study with Arik Now' },

  // ─── Test Catalog Tabs & Grouping ──────────────────────────────────────────
  tests_tab_full: { id: 'Ujian Penuh', en: 'Full-Length Tests' },
  tests_tab_sections: { id: 'Latihan per Bagian', en: 'Section Practice' },
  tests_group_listening: { id: 'Bagian 1: Listening Comprehension', en: 'Section 1: Listening Comprehension' },
  tests_group_structure: { id: 'Bagian 2: Structure & Written Expression', en: 'Section 2: Structure & Written Expression' },
  tests_group_reading: { id: 'Bagian 3: Reading Comprehension', en: 'Section 3: Reading Comprehension' },

  // ─── Test Overview Page (/tests/[testId]) ──────────────────────────────────
  test_overview_back: { id: 'Kembali ke Daftar Tes', en: 'Back to Tests' },
  test_overview_full_desc: {
    id: 'Ambil ujian TOEFL ITP lengkap dengan ke-3 bagian secara berurutan. Timer berjalan untuk masing-masing bagian untuk mensimulasikan kondisi ujian nyata.',
    en: 'Take the complete TOEFL ITP test with all 3 sections in order. Timer runs for each section to simulate real exam conditions.',
  },
  test_overview_start_full: { id: 'Mulai Ujian Penuh', en: 'Start Full Test' },
  test_overview_practice_desc: {
    id: 'Fokus pada keterampilan tertentu dengan berlatih per bagian secara terarah. Sangat cocok untuk peningkatan yang terfokus.',
    en: 'Focus on specific skills by practicing individual sections. Perfect for targeted improvement.',
  },
  test_overview_listening_note: { id: 'Audio hanya diputar satu kali', en: 'Audio plays once only' },
  test_overview_structure_note: { id: 'Sentence completion dan error recognition', en: 'Sentence completion and error recognition' },
  test_overview_reading_note: { id: 'Bacaan akademis dengan nomor baris', en: 'Line-numbered academic passages' },
  test_overview_practice_btn: { id: 'Latihan', en: 'Practice' },
  test_overview_not_available: { id: 'Tidak Tersedia', en: 'Not Available' },
  test_overview_upgrade_practice: { id: 'Upgrade untuk Latihan', en: 'Upgrade to Practice' },
  test_overview_before_begin: { id: 'Sebelum Anda Memulai', en: 'Before You Begin' },
  test_overview_tip_internet: { id: 'Pastikan Anda memiliki koneksi internet yang stabil sebelum memulai', en: 'Ensure you have a stable internet connection before starting' },
  test_overview_tip_listening: { id: 'Audio listening tidak dapat diputar ulang — gunakan headphone dan hindari kebisingan', en: 'Listening audio is not replayable — use headphones and avoid background noise' },
  test_overview_tip_quiet: { id: 'Cari lingkungan yang tenang untuk meminimalkan gangguan', en: 'Find a quiet environment to minimize distractions' },
  test_overview_tip_simulate: { id: 'Untuk hasil terbaik, simulasikan kondisi ujian nyata', en: 'For best results, simulate real exam conditions' },

  // ─── Congratulations YEC Voucher Modal ─────────────────────────────────────
  congrats_celebration_score: { id: 'Anda mendapatkan skor **{score}** pada **{testTitle}**!', en: 'You scored **{score}** on **{testTitle}**!' },
  congrats_yec_banner_title: { id: 'Ambil Official TOEFL iTP Lebih Hemat!', en: 'Take Your Official TOEFL iTP and Save!' },
  congrats_yec_banner_body: { id: 'Dapatkan potongan diskon Rp 20.000 dengan mendaftar di YEC (yec.co.id) menggunakan kode voucher eksklusif ini.', en: 'Get a Rp 20.000 discount by booking on YEC (yec.co.id) using this exclusive voucher code.' },
  congrats_yec_copy_btn: { id: 'Salin Kode', en: 'Copy Code' },
  congrats_yec_copied: { id: 'Tersalin!', en: 'Copied!' },

  // ─── Early Access / Waitlist Modal ──────────────────────────────────────────
  waitlist_modal_title: { id: 'Dapatkan Akses Awal Pro!', en: 'Get Pro Early Access!' },
  waitlist_modal_pitch: {
    id: 'Kami sedang mempersiapkan fitur Premium yang mencakup Tes Tanpa Batas, Analisis Kelemahan Keterampilan, dan Penjelasan AI yang canggih. Bergabunglah dengan daftar akses awal hari ini untuk mendapatkan diskon peluncuran sebesar 20%!',
    en: 'We are preparing our Premium features including Unlimited Tests, Skill Weakness Radar Charts, and powerful AI-driven explanations. Join the early access waitlist today and secure an exclusive 20% launch discount!',
  },
  waitlist_button_request: { id: 'Ajukan Akses Awal', en: 'Request Early Access' },
  waitlist_placeholder_email: { id: 'Masukkan alamat email Anda', en: 'Enter your email address' },
  waitlist_email_invalid: { id: 'Masukkan email yang valid', en: 'Please enter a valid email' },
  waitlist_success_title: { id: 'Anda Masuk Daftar!', en: "You're on the list!" },
  waitlist_success_pitch: {
    id: 'Terima kasih banyak atas minat Anda! Kami telah mendaftarkan email Anda ke daftar tunggu awal kami. Kami akan mengirimkan email saat fitur Pro diluncurkan bersama kode diskon 20% Anda!',
    en: "Thank you for your interest! We have registered your email to our early access waitlist. We'll drop you an email when Pro launches along with your 20% discount code!",
  },
  waitlist_already_joined: { id: 'Anda sudah bergabung dalam daftar tunggu paket ini.', en: 'You have already joined the waitlist for this plan.' },

  // ─── Test Taking ────────────────────────────────────────────────────────────
  test_finish: { id: 'Selesai Tes', en: 'Finish Test' },
  test_next_section: { id: 'Bagian Selanjutnya', en: 'Next Section' },
  test_prev: { id: 'Sebelumnya', en: 'Previous' },
  test_next: { id: 'Selanjutnya', en: 'Next' },
  test_mark_review: { id: 'Tandai untuk Review', en: 'Mark for Review' },
  test_marked: { id: 'Ditandai', en: 'Marked' },
  test_continue_questions: { id: 'Lanjut ke Pertanyaan', en: 'Continue to Questions' },
  test_begin_reading: { id: 'Mulai Bagian Reading', en: 'Begin Reading Section' },
  test_preparing: { id: 'Menyiapkan tes Anda...', en: 'Preparing your test environment...' },
  test_preparing_practice: { id: 'Menyiapkan tes latihan Anda...', en: 'Preparing your practice test...' },
  test_preparing_wait: { id: 'Mohon tunggu sebentar. Jangan tutup halaman ini.', en: 'Please wait while we set up your attempt. Do not close this page.' },
  test_volume: { id: 'Volume', en: 'Volume' },
  test_participant: { id: 'Peserta:', en: 'Participant:' },
  test_question_progress: { id: 'Progress Pertanyaan', en: 'Question Progress' },
  test_hide_progress: { id: 'Sembunyikan Progress', en: 'Hide Progress' },
  test_show_progress: { id: 'Tampilkan Progress', en: 'Show Progress' },
  test_answered: { id: 'terjawab', en: 'answered' },
  test_submit_error: { id: 'Pengiriman gagal. Silakan coba lagi.', en: 'Submission failed. Please try again.' },
  test_thinking_time: { id: 'Waktu Berpikir', en: 'Thinking Time' },
  test_skip: { id: 'Lewati', en: 'Skip' },

  // ─── Test Overview Page (/tests/[testId]) additional ───────────────────────
  test_overview_full_test: { id: 'Ujian Penuh', en: 'Full Test' },
  test_overview_premium_test: { id: 'Tes Premium', en: 'Premium Test' },
  test_overview_premium_body: { id: 'Berlangganan untuk mengakses tes ini.', en: 'Subscribe to access this test.' },
  test_overview_view_plans: { id: 'Lihat Paket', en: 'View Plans' },
  test_overview_free: { id: 'Gratis', en: 'Free' },
  test_overview_starting: { id: 'Sedang Memulai…', en: 'Starting…' },
  test_overview_practice_by_section: { id: 'Latihan per Bagian', en: 'Practice by Section' },
  test_overview_test_not_found: { id: 'Tes tidak ditemukan', en: 'Test not found' },

  // ─── Pricing Page additional ───────────────────────────────────────────────
  pricing_cancel: { id: 'Batal', en: 'Cancel' },
  pricing_done: { id: 'Selesai', en: 'Done' },
  pricing_account_email: { id: 'Email Akun', en: 'Account Email' },
  pricing_logged_in: { id: 'Masuk', en: 'Logged In' },
} as const;

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, lang: Lang): string {
  return translations[key][lang] ?? translations[key]['en'];
}

export default translations;
