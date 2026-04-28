export type Lang = 'id' | 'en';

const translations = {
  // ─── Navbar ─────────────────────────────────────────────────────────────────
  nav_dashboard: { id: 'Dasbor', en: 'Dashboard' },
  nav_practice_tests: { id: 'Tes Latihan', en: 'Practice Tests' },
  nav_pricing: { id: 'Harga', en: 'Pricing' },
  nav_admin_panel: { id: 'Panel Admin', en: 'Admin Panel' },
  nav_settings: { id: 'Pengaturan', en: 'Settings' },
  nav_sign_out: { id: 'Keluar', en: 'Sign Out' },
  nav_sign_in: { id: 'Masuk', en: 'Sign In' },
  nav_get_started: { id: 'Mulai Gratis', en: 'Get Started Free' },

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
    id: 'Langsung terima skor scaled Listening, Structure, dan Reading Anda (310–677).',
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
  feat_timed_title: { id: 'Kondisi Bertime', en: 'Timed Conditions' },
  feat_timed_body: {
    id: 'Berlatih dengan waktu ujian yang otentik. Audio hanya diputar sekali, seperti ujian nyata.',
    en: 'Practice under authentic exam timing. Audio plays only once, just like the real test.',
  },
  feat_lines_title: { id: 'Teks Bernomor Baris', en: 'Line-Numbered Passages' },
  feat_lines_body: {
    id: 'Bagian Reading menampilkan nomor baris untuk referensi mudah, sesuai format resmi kertas.',
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
    id: 'Dasbor latihan TOEFL ITP Anda. Terus lakukan — setiap tes membawa Anda lebih dekat ke skor target.',
    en: 'Your TOEFL ITP practice dashboard. Keep going — every test brings you closer to your target score.',
  },
  dash_start_practice: { id: 'Mulai Latihan', en: 'Start Practice' },
  dash_upgrade_plan: { id: 'Upgrade Paket', en: 'Upgrade Plan' },
  dash_tests_completed: { id: 'Tes Diselesaikan', en: 'Tests Completed' },
  dash_tests_sub: { id: 'tes TOEFL ITP penuh', en: 'full TOEFL ITP tests' },
  dash_avg_score: { id: 'Skor Rata-rata', en: 'Average Score' },
  dash_avg_sub: { id: 'skor scaled (310–677)', en: 'scaled score (310–677)' },
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
  tests_remaining: { id: 'tes tersisa bulan ini', en: 'tests remaining this month' },
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
} as const;

export type TranslationKey = keyof typeof translations;

export function getTranslation(key: TranslationKey, lang: Lang): string {
  return translations[key][lang] ?? translations[key]['en'];
}

export default translations;
