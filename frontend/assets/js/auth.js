/**
 * SMART POULTRY HEALTH & PRECISION FARMING SYSTEM
 * Mobile Number & OTP Authentication Service (auth.js)
 * Connects directly to backend API: /api/auth/* with JWT Token Management
 */

const AUTH_STORAGE_KEY = 'smart_poultry_auth_user';
const JWT_TOKEN_KEY = 'smart_poultry_jwt_token';
const API_BASE_URL = window.location.protocol.startsWith('http') ? window.location.origin : 'http://127.0.0.1:5000';

const MobileAuth = {
  currentOtp: null,
  countdownInterval: null,
  pendingMobile: null,
  pendingRegistrationData: null,

  init() {
    this.checkAuthStatus();
  },

  getToken() {
    return localStorage.getItem(JWT_TOKEN_KEY);
  },

  getLoggedInUser() {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  isLoggedIn() {
    return !!this.getLoggedInUser();
  },

  checkAuthStatus() {
    const user = this.getLoggedInUser();
    const statusPill = document.getElementById('authStatusPill');
    const authBtnText = document.getElementById('authBtnText');
    const syncNameEls = document.querySelectorAll('.sync-user-name');
    const syncPhoneEls = document.querySelectorAll('.sync-user-phone');

    if (user) {
      if (statusPill) {
        statusPill.innerHTML = `<i class="bi bi-person-check-fill text-success me-1"></i><span class="small fw-bold text-dark">${user.phone || user.mobile_number}</span>`;
      }
      if (authBtnText) authBtnText.textContent = 'Account';
      syncNameEls.forEach(el => el.textContent = user.name || user.fullName || 'Poultry Farmer');
      syncPhoneEls.forEach(el => el.textContent = user.phone || user.mobile_number);
    } else {
      if (statusPill) {
        statusPill.innerHTML = `<i class="bi bi-person-circle text-muted me-1"></i><span class="small text-muted">Guest / Farmer</span>`;
      }
      if (authBtnText) authBtnText.textContent = 'Login';
      syncNameEls.forEach(el => el.textContent = 'Poultry Farmer');
      syncPhoneEls.forEach(el => el.textContent = 'Not Logged In');
    }
  },

  // 1. Direct Password Login (No OTP Required)
  async loginWithPassword(identifier, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier, password: password })
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        localStorage.setItem(JWT_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        this.checkAuthStatus();
        return { success: true, user: data.user, token: data.token };
      } else {
        return { success: false, message: data.message || 'Invalid mobile number or password.' };
      }
    } catch (e) {
      console.error('Error in loginWithPassword:', e);
      return { success: false, message: 'Could not connect to backend server. Make sure the Flask server is running.' };
    }
  },

  // 2. Direct Password Registration (No OTP Required)
  async registerWithPassword(regData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regData.fullName,
          phone: regData.phone,
          email: regData.email || null,
          password: regData.password,
          role: regData.role || 'farmer',
          farm_name: regData.farmName,
          location: regData.location
        })
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        if (data.token) {
          localStorage.setItem(JWT_TOKEN_KEY, data.token);
        }
        if (data.user) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        }
        this.checkAuthStatus();
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, message: data.message || 'Registration failed.' };
      }
    } catch (e) {
      console.error('Error in registerWithPassword:', e);
      return { success: false, message: 'Could not connect to backend server. Make sure the Flask server is running.' };
    }
  },

  // 3. Send OTP for Registration via Backend API (Optional / Legacy)
  async sendOtpForRegistration(regData) {
    this.pendingRegistrationData = regData;
    this.pendingMobile = regData.phone;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regData.fullName,
          phone: regData.phone,
          password: regData.password || 'farmerpass123',
          role: regData.role || 'farmer',
          farm_name: regData.farmName,
          location: regData.location
        })
      });

      const result = await response.json();
      if (response.ok && result.status === 'success') {
        this.startCountdown(result.cooldown_seconds || 60);
        return { success: true, message: result.message || 'OTP sent successfully to your mobile phone via SMS' };
      } else {
        return { success: false, message: result.message || 'Failed to dispatch real SMS OTP' };
      }
    } catch (e) {
      console.error('Error connecting to backend API:', e);
      return { success: false, message: 'Cannot connect to backend server. Please verify the Flask server is running.' };
    }
  },

  // 3. Display Simulated SMS Toast Notification for Instant OTP Access
  showSmsBanner(phone, otp) {
    let banner = document.getElementById('simulatedSmsBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'simulatedSmsBanner';
      banner.style.position = 'fixed';
      banner.style.top = '16px';
      banner.style.left = '50%';
      banner.style.transform = 'translateX(-50%)';
      banner.style.zIndex = '10999';
      banner.style.width = '92%';
      banner.style.maxWidth = '460px';
      document.body.appendChild(banner);
    }

    banner.innerHTML = `
      <div class="card shadow-lg border-2 border-warning bg-dark text-white rounded-4 overflow-hidden animate__animated animate__fadeInDown">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="badge bg-success rounded-pill px-2.5 py-1 fw-bold">
              <i class="bi bi-chat-text-fill me-1"></i> SMS Verification Code (OTP)
            </span>
            <button type="button" class="btn-close btn-close-white btn-sm" onclick="document.getElementById('simulatedSmsBanner').innerHTML=''"></button>
          </div>
          <div class="d-flex align-items-center justify-content-between mt-2 pt-1 border-top border-secondary">
            <div>
              <div class="small text-white-50">Sent to: <strong>${phone}</strong></div>
              <div class="fs-3 fw-bold text-warning letter-spacing-2 mt-1" style="letter-spacing: 5px;">${otp}</div>
            </div>
            <button type="button" class="btn btn-warning rounded-pill px-3 py-1.5 fw-bold shadow-sm" onclick="MobileAuth.autoFillOtp('${otp}')">
              <i class="bi bi-clipboard-check me-1"></i> Auto-Fill
            </button>
          </div>
          <div class="text-white-50 mt-1" style="font-size: 0.72rem;">Valid for 5 minutes. Click Auto-Fill to insert code automatically.</div>
        </div>
      </div>
    `;

    // Auto dismiss after 20s
    setTimeout(() => {
      if (banner && banner.innerHTML) {
        banner.innerHTML = '';
      }
    }, 20000);
  },

  autoFillOtp(code) {
    const inputs = [
      document.getElementById('pageOtpInput'),
      document.getElementById('otpInput'),
      document.getElementById('regOtpInput')
    ];
    let filled = false;
    inputs.forEach(input => {
      if (input) {
        input.value = code;
        input.focus();
        filled = true;
      }
    });

    if (filled) {
      if (typeof showToast === 'function') {
        showToast('OTP auto-filled successfully!', 'success');
      }
    }
  },

  // 4. Send OTP for Login via Backend API
  async sendOtpForLogin(mobileNumber, countryCode = '+91') {
    const cleanNum = mobileNumber.replace(/\D/g, '');
    const clean10 = cleanNum.slice(-10);
    const fullMobile = `${countryCode} ${clean10}`;
    this.pendingMobile = fullMobile;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullMobile,
          mobileNumber: clean10,
          country_code: countryCode
        })
      });

      const result = await response.json();
      if (response.ok && result.status === 'success') {
        this.currentOtp = result.dev_otp || null;
        this.startCountdown(result.cooldown_seconds || 60);

        // Always show the on-screen SMS toast banner if dev_otp is provided
        if (result.dev_otp) {
          this.showSmsBanner(result.phone || fullMobile, result.dev_otp);
        }

        return {
          success: true,
          message: result.message || 'OTP sent successfully to your mobile phone',
          dev_otp: result.dev_otp,
          phone: result.phone || fullMobile
        };
      } else {
        return { success: false, message: result.message || 'Failed to dispatch OTP SMS' };
      }
    } catch (e) {
      console.error('Error connecting to backend API:', e);
      return { success: false, message: 'Cannot connect to backend server. Please verify the Flask server is running.' };
    }
  },

  // 5. Countdown Timer for Resend Button (60s)
  startCountdown(seconds = 60) {
    clearInterval(this.countdownInterval);
    const resendBtns = [
      document.getElementById('resendPageOtpBtn'),
      document.getElementById('resendRegOtpBtn'),
      document.getElementById('resendOtpBtn')
    ];
    let timeLeft = seconds;

    resendBtns.forEach(btn => {
      if (btn) {
        btn.disabled = true;
        btn.classList.add('text-muted');
        btn.classList.remove('text-success');
      }
    });

    this.countdownInterval = setInterval(() => {
      timeLeft--;
      resendBtns.forEach(btn => {
        if (btn) {
          btn.textContent = `Resend OTP (${timeLeft}s)`;
        }
      });

      if (timeLeft <= 0) {
        clearInterval(this.countdownInterval);
        resendBtns.forEach(btn => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Resend OTP';
            btn.classList.remove('text-muted');
            btn.classList.add('text-success');
          }
        });
      }
    }, 1000);
  },

  // 6. Verify OTP & Complete Login / Registration
  async verifyOtpAndLogin(enteredOtp) {
    const phone = this.pendingMobile;
    if (!enteredOtp || enteredOtp.length !== 6) {
      return { success: false, message: 'Please enter a valid 6-digit OTP code received on your mobile SMS.' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, otp: enteredOtp })
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        localStorage.setItem(JWT_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));

        clearInterval(this.countdownInterval);
        this.currentOtp = null;
        this.checkAuthStatus();
        return { success: true, user: data.user, token: data.token };
      } else {
        return { success: false, message: data.message || 'Incorrect or expired OTP' };
      }
    } catch (e) {
      console.error('Error verifying OTP with backend:', e);
      return { success: false, message: 'Could not connect to backend server to verify OTP.' };
    }
  },

  // 7. Reset Password via Mobile OTP
  async resetPassword(phone, otp, newPassword) {
    if (!phone) {
      return { success: false, message: 'Mobile number is required.' };
    }
    if (!otp || otp.length !== 6) {
      return { success: false, message: 'Please enter a valid 6-digit OTP code.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone, otp: otp, new_password: newPassword })
      });

      const data = await response.json();
      if (response.ok && data.status === 'success') {
        if (data.token) {
          localStorage.setItem(JWT_TOKEN_KEY, data.token);
        }
        if (data.user) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        }
        this.checkAuthStatus();
        return { success: true, message: data.message, user: data.user };
      } else {
        return { success: false, message: data.message || 'Failed to reset password.' };
      }
    } catch (e) {
      console.error('Error in resetPassword:', e);
      return { success: false, message: 'Could not connect to backend server.' };
    }
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(JWT_TOKEN_KEY);
    this.checkAuthStatus();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  MobileAuth.init();
});
