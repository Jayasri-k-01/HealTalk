import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import heroDoctorImg from "../assets/hero_doctor_realistic.jpg";
import interpreterImg from "../assets/interpreter_portrait.jpg";
import aboutImg from "../assets/about_healthcare_realistic.jpg";
import {
  ShieldCheck,
  Globe,
  Stethoscope,
  Headphones,
  UserCheck,
  CalendarCheck,
  Video,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HeartPulse,
  Languages,
  Users,
  ArrowDown,
} from "lucide-react";

function Home() {
  const { isAuthenticated } = useAuth();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="home-wrapper">
      <Navbar />

      {/* ==========================================================================
          1. HERO SECTION
          ========================================================================== */}
      <section className="hero-section" id="home">
        {/* Background decorative curved accent */}
        <div className="hero-bg-accent" aria-hidden="true"></div>

        <div className="hero-container">
          {/* LEFT COLUMN: HERO CONTENT */}
          <div className="hero-content-col">
            <div className="hero-badge animate-fade-in-down">
              <span className="badge-pulse-dot"></span>
              <span>A Healthier Tomorrow, Together</span>
            </div>

            <h1 className="hero-title animate-fade-in">
              Healthcare <br />
              Without <br />
              <span className="hero-highlight-text">Language Barriers</span>
            </h1>

            <p className="hero-description animate-fade-in-delayed">
              HealTalk connects patients, doctors, and interpreters through a secure,
              multilingual telemedicine platform — because everyone deserves to be heard.
            </p>

            <div className="hero-cta-group animate-fade-in-delayed-2">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="btn-primary-hero"
                id="hero-get-started-btn"
              >
                <span>{isAuthenticated ? "Go to Dashboard" : "Get Started"}</span>
                <ArrowRight size={18} />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection("about")}
                className="btn-secondary-hero"
                id="hero-learn-more-btn"
              >
                Learn More
              </button>
            </div>

            {/* Trust Mini Badges */}
            <div className="hero-mini-badges animate-fade-in-delayed-2">
              <div className="mini-badge">
                <ShieldCheck size={16} className="text-teal" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="mini-badge">
                <Globe size={16} className="text-teal" />
                <span>50+ Languages</span>
              </div>
              <div className="mini-badge">
                <Users size={16} className="text-teal" />
                <span>Certified Interpreters</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REALISTIC HEALTHCARE VISUAL + GLASSMORPHIC TRANSLATION OVERLAYS */}
          <div className="hero-visual-col animate-fade-in-scale">
            <div className="hero-visual-backdrop"></div>

            <div className="hero-image-wrapper">
              <img
                src={heroDoctorImg}
                alt="Realistic HealTalk Telemedicine Consultation with Doctor and Patient"
                className="hero-main-img"
              />

              {/* OVERLAY 1: Live Interpreter Online Badge (Top-Right) */}
              <div className="glass-overlay interpreter-card animate-float">
                <div className="interpreter-avatar-wrap">
                  <img
                    src={interpreterImg}
                    alt="Interpreter"
                    className="interpreter-avatar"
                  />
                  <span className="status-dot-green"></span>
                </div>
                <div className="interpreter-info">
                  <div className="interpreter-status-label">
                    <span className="live-pulse"></span>
                    Interpreter Online
                  </div>
                  <div className="interpreter-language-pair">
                    <span>English</span>
                    <span className="pair-arrow">⇄</span>
                    <span className="lang-target">Tamil</span>
                  </div>
                </div>
              </div>

              {/* OVERLAY 2: Real-time Translation Conversation (Middle-Right) */}
              <div className="glass-overlay translation-chat-card animate-float-delayed">
                <div className="chat-bubble-row">
                  <div className="chat-bubble-source">
                    <span className="chat-speaker-label">Patient</span>
                    <p className="chat-text">"I have a headache."</p>
                  </div>
                  <span className="lang-tag en-tag">EN</span>
                </div>

                <div className="chat-arrow-divider">
                  <div className="divider-line"></div>
                  <div className="divider-arrow-circle">
                    <ArrowDown size={13} />
                  </div>
                  <div className="divider-line"></div>
                </div>

                <div className="chat-bubble-row">
                  <div className="chat-bubble-target">
                    <span className="chat-speaker-label">Translation</span>
                    <p className="chat-text tamil-text">"எனக்கு தலைவலி உள்ளது."</p>
                  </div>
                  <span className="lang-tag ta-tag">TA</span>
                </div>
              </div>

              {/* OVERLAY 3: Handwritten Tagline (Bottom-Right) */}
              <div className="hero-script-tagline">
                People. Languages.<br />
                <em>Better Healthcare.</em>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          2. 4 FEATURE HIGHLIGHTS
          ========================================================================== */}
      <section className="feature-highlights-section" id="highlights">
        <div className="highlights-container">
          <div className="highlights-row">
            {/* Highlight 1: Secure Healthcare */}
            <div className="highlight-item">
              <div className="highlight-icon-wrap icon-teal">
                <ShieldCheck size={24} />
              </div>
              <div className="highlight-details">
                <h3 className="highlight-name">Secure Healthcare</h3>
                <p className="highlight-desc">HIPAA-compliant encrypted consultations & safe EHR records</p>
              </div>
            </div>

            {/* Highlight 2: Multilingual Support */}
            <div className="highlight-item">
              <div className="highlight-icon-wrap icon-blue">
                <Globe size={24} />
              </div>
              <div className="highlight-details">
                <h3 className="highlight-name">Multilingual Support</h3>
                <p className="highlight-desc">Break language barriers across 50+ languages seamlessly</p>
              </div>
            </div>

            {/* Highlight 3: Doctor Consultation */}
            <div className="highlight-item">
              <div className="highlight-icon-wrap icon-purple">
                <Stethoscope size={24} />
              </div>
              <div className="highlight-details">
                <h3 className="highlight-name">Doctor Consultation</h3>
                <p className="highlight-desc">Direct high-definition video visits with verified specialists</p>
              </div>
            </div>

            {/* Highlight 4: Interpreter Assistance */}
            <div className="highlight-item">
              <div className="highlight-icon-wrap icon-amber">
                <Headphones size={24} />
              </div>
              <div className="highlight-details">
                <h3 className="highlight-name">Interpreter Assistance</h3>
                <p className="highlight-desc">Live certified interpreters ensure zero miscommunication</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          3. ABOUT HEALTALK SECTION
          ========================================================================== */}
      <section className="about-section" id="about">
        <div className="section-inner">
          <div className="about-grid">
            {/* LEFT: Realistic Clinical Photography */}
            <div className="about-image-col">
              <div className="about-img-container">
                <img
                  src={aboutImg}
                  alt="Doctor consulting patient with digital health records in modern clinic"
                  className="about-main-img"
                />
                <div className="about-badge-overlay">
                  <div className="overlay-stat">
                    <span className="stat-number">50+</span>
                    <span className="stat-label">Languages Supported</span>
                  </div>
                  <div className="overlay-divider"></div>
                  <div className="overlay-stat">
                    <span className="stat-number">100%</span>
                    <span className="stat-label">HIPAA Compliant</span>
                  </div>
                  <div className="overlay-divider"></div>
                  <div className="overlay-stat">
                    <span className="stat-number">3-Way</span>
                    <span className="stat-label">Live Video Visits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Text Content */}
            <div className="about-content-col">
              <div className="section-sub-badge">
                <span className="badge-pulse-dot"></span>
                About HealTalk
              </div>
              <h2 className="section-title">
                Healthcare Without <span className="hero-highlight-text">Language Barriers</span>
              </h2>
              <p className="about-lead">
                HealTalk was built on a simple conviction: language should never stand in the
                way of quality medical care.
              </p>
              <p className="about-body">
                We bring patients, doctors, and professional medical interpreters together onto
                one intuitive telemedicine platform. Whether you are consulting for routine care,
                managing a chronic condition, or seeking specialist medical advice, HealTalk ensures
                clear, compassionate, and accurate communication every step of the way.
              </p>

              <div className="about-features-list">
                <div className="about-feature-item">
                  <div className="feature-check-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong>3-Way Seamless Consultations:</strong>
                    <span> Patient, physician, and interpreter collaborate in real-time high-definition video.</span>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="feature-check-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong>Certified Medical Interpreters:</strong>
                    <span> Verified professionals trained in clinical terminology for accurate diagnoses.</span>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="feature-check-icon">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong>Bilingual Clinical Records:</strong>
                    <span> Access prescription details, doctor notes, and care plans translated to your native language.</span>
                  </div>
                </div>
              </div>

              <div className="about-cta-wrapper">
                <Link
                  to={isAuthenticated ? "/dashboard" : "/register"}
                  className="btn-primary-about"
                >
                  <span>Explore HealTalk</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          4. SERVICES SECTION
          ========================================================================== */}
      <section className="services-section" id="services">
        <div className="section-inner">
          <div className="section-header-center">
            <div className="section-sub-badge">
              <span className="badge-pulse-dot"></span>
              Our Telemedicine Services
            </div>
            <h2 className="section-title">Everything You Need for Better Care</h2>
            <p className="section-subtitle">
              Comprehensive clinical tools, multilingual support, and seamless coordination
              for every participant in the healthcare journey.
            </p>
          </div>

          <div className="services-grid">
            {/* Service 1: Patient */}
            <div className="service-card-modern">
              <div className="service-card-header">
                <div className="service-icon-wrapper bg-teal-subtle">
                  <UserCheck size={26} className="text-primary" />
                </div>
                <span className="service-tag">For Patients</span>
              </div>
              <h3 className="service-card-title">Patient Consultation</h3>
              <p className="service-card-desc">
                Book appointments easily, speak in your native language, view clinical history,
                and receive digital prescriptions from verified doctors.
              </p>
              <ul className="service-card-bullets">
                <li><CheckCircle2 size={15} /> Instant & scheduled visits</li>
                <li><CheckCircle2 size={15} /> Preferred language selection</li>
                <li><CheckCircle2 size={15} /> Digital prescription storage</li>
              </ul>
            </div>

            {/* Service 2: Physician */}
            <div className="service-card-modern">
              <div className="service-card-header">
                <div className="service-icon-wrapper bg-blue-subtle">
                  <Stethoscope size={26} className="text-blue" />
                </div>
                <span className="service-tag">For Physicians</span>
              </div>
              <h3 className="service-card-title">Doctor Consultation</h3>
              <p className="service-card-desc">
                Dedicated doctor workspace to manage appointment queues, consult patients
                with multi-party calls, and issue electronic medical orders.
              </p>
              <ul className="service-card-bullets">
                <li><CheckCircle2 size={15} /> Integrated video & chat</li>
                <li><CheckCircle2 size={15} /> Patient EHR review</li>
                <li><CheckCircle2 size={15} /> 1-click interpreter invite</li>
              </ul>
            </div>

            {/* Service 3: Interpreter */}
            <div className="service-card-modern">
              <div className="service-card-header">
                <div className="service-icon-wrapper bg-purple-subtle">
                  <Headphones size={26} className="text-purple" />
                </div>
                <span className="service-tag">For Interpreters</span>
              </div>
              <h3 className="service-card-title">Interpreter Support</h3>
              <p className="service-card-desc">
                Specialized dashboard for medical interpreters to accept session requests,
                support live consultations, and ensure accurate clinical communication.
              </p>
              <ul className="service-card-bullets">
                <li><CheckCircle2 size={15} /> Live request queue</li>
                <li><CheckCircle2 size={15} /> Dual-stream audio channels</li>
                <li><CheckCircle2 size={15} /> Medical vocabulary assistance</li>
              </ul>
            </div>

            {/* Service 4: Multilingual */}
            <div className="service-card-modern">
              <div className="service-card-header">
                <div className="service-icon-wrapper bg-green-subtle">
                  <Globe size={26} className="text-green" />
                </div>
                <span className="service-tag">Cross-Platform</span>
              </div>
              <h3 className="service-card-title">Multilingual Communication</h3>
              <p className="service-card-desc">
                Real-time translation, multi-language appointment reminders, and automated
                bilingual transcripts to keep everyone aligned.
              </p>
              <ul className="service-card-bullets">
                <li><CheckCircle2 size={15} /> 50+ language capabilities</li>
                <li><CheckCircle2 size={15} /> Real-time text translation</li>
                <li><CheckCircle2 size={15} /> Translated clinical summaries</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          5. HOW IT WORKS SECTION
          ========================================================================== */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-inner">
          <div className="section-header-center">
            <div className="section-sub-badge">
              <span className="badge-pulse-dot"></span>
              Simple 4-Step Process
            </div>
            <h2 className="section-title">How HealTalk Works</h2>
            <p className="section-subtitle">
              Get quality medical care in your preferred language in just four simple steps.
            </p>
          </div>

          <div className="steps-container">
            {/* Step 01 */}
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon-box">
                <UserCheck size={24} />
              </div>
              <h4 className="step-title">Create Your Account</h4>
              <p className="step-desc">
                Register as a patient, doctor, or interpreter and select your primary language.
              </p>
            </div>

            <div className="step-connector"></div>

            {/* Step 02 */}
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon-box">
                <CalendarCheck size={24} />
              </div>
              <h4 className="step-title">Choose Your Role</h4>
              <p className="step-desc">
                Access tailored dashboards designed specifically for clinical consultations.
              </p>
            </div>

            <div className="step-connector"></div>

            {/* Step 03 */}
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon-box">
                <Video size={24} />
              </div>
              <h4 className="step-title">Connect With the Right Person</h4>
              <p className="step-desc">
                Match with licensed physicians and certified medical interpreters instantly.
              </p>
            </div>

            <div className="step-connector"></div>

            {/* Step 04 */}
            <div className="step-card">
              <div className="step-number">04</div>
              <div className="step-icon-box">
                <FileText size={24} />
              </div>
              <h4 className="step-title">Start Your Consultation</h4>
              <p className="step-desc">
                Join a 3-way secure teleconsultation with live audio, video, and translated notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          6. CTA BANNER SECTION
          ========================================================================== */}
      <section className="cta-banner-section">
        <div className="cta-banner-card">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">
              Ready to Experience Healthcare Without Language Barriers?
            </h2>
            <p className="cta-banner-subtitle">
              Join patients, physicians, and certified interpreters connecting on
              HealTalk today.
            </p>
            <div className="cta-banner-buttons">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="btn-banner-primary"
              >
                <span>{isAuthenticated ? "Open Your Dashboard" : "Get Started Now"}</span>
                <ArrowRight size={18} />
              </Link>
              {!isAuthenticated && (
                <Link to="/login" className="btn-banner-secondary">
                  Sign In to Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          7. FOOTER SECTION
          ========================================================================== */}
      <footer className="footer-section">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="logo">
                <div className="logo-badge">
                  <HeartPulse className="logo-icon" size={22} />
                </div>
                <div className="logo-text-group">
                  <span className="logo-text">
                    Heal<span className="logo-highlight">Talk</span>
                  </span>
                  <span className="logo-tagline">Connect. Communicate. Care.</span>
                </div>
              </div>
              <p className="footer-brand-desc">
                Connecting patients, doctors, and medical interpreters worldwide to provide
                safe, compassionate, and barrier-free healthcare.
              </p>
              <div className="footer-compliance-tag">
                <ShieldCheck size={16} />
                <span>HIPAA Compliant & Secure Telehealth</span>
              </div>
            </div>

            <div className="footer-links-col">
              <h5 className="footer-heading">Navigation</h5>
              <ul>
                <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }}>Home</a></li>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection("about"); }}>About HealTalk</a></li>
                <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection("services"); }}>Services</a></li>
                <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection("how-it-works"); }}>How It Works</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h5 className="footer-heading">Portals</h5>
              <ul>
                <li><Link to="/login">Patient Portal</Link></li>
                <li><Link to="/login">Doctor Portal</Link></li>
                <li><Link to="/login">Interpreter Portal</Link></li>
                <li><Link to="/register">Create New Account</Link></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h5 className="footer-heading">Platform Features</h5>
              <ul>
                <li><span>Real-time Interpretation</span></li>
                <li><span>HD Video Consultations</span></li>
                <li><span>Multilingual EHR</span></li>
                <li><span>Encrypted Messaging</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-disclaimer-box">
            <p>
              <strong>Medical Disclaimer:</strong> HealTalk is a telemedicine and medical
              interpretation platform. If you are experiencing a medical emergency, please
              call your local emergency number (e.g. 112 / 911) or visit the nearest emergency facility immediately.
            </p>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} HealTalk Telemedicine Platform. All rights reserved.</p>
            <div className="footer-legal-links">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>HIPAA Compliance</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;