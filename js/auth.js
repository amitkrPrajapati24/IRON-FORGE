import { auth, googleProvider, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const closeModalBtn = document.querySelector('.close-modal');
const authContainer = document.getElementById('auth-container') || document.querySelector('.auth-modal-content');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authForm = document.getElementById('auth-form');
const googleSignInBtn = document.getElementById('google-signin-btn');
const userEmailDisplay = document.getElementById('user-email-display');
const joinNowBtn = document.getElementById('join-now-btn');
const joinBtn = document.getElementById('join-btn');

// Tabs
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');

let isLoginMode = true;

// Toggle Login/Register Mode via Tabs
function setAuthMode(mode) {
    if (!authContainer) return;
    
    if (mode === 'login') {
        isLoginMode = true;
        authContainer.classList.remove('register-mode');
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
        if (authTitle) authTitle.textContent = 'Welcome Back';
        if (authSubtitle) authSubtitle.textContent = 'Elevate your fitness journey with IronForge';
        if (authSubmitBtn) authSubmitBtn.textContent = 'Login';
    } else {
        isLoginMode = false;
        authContainer.classList.add('register-mode');
        if (tabLogin) tabLogin.classList.remove('active');
        if (tabRegister) tabRegister.classList.add('active');
        if (authTitle) authTitle.textContent = 'Create Account';
        if (authSubtitle) authSubtitle.textContent = 'Join the IronForge community today';
        if (authSubmitBtn) authSubmitBtn.textContent = 'Sign Up';
    }
}

if (tabLogin) tabLogin.addEventListener('click', () => setAuthMode('login'));
if (tabRegister) tabRegister.addEventListener('click', () => setAuthMode('register'));

// Modal Control
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        if (authModal) authModal.classList.add('hidden');
    });
}

window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.classList.add('hidden');
    }
});

if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
        const href = loginBtn.getAttribute('href');
        if (!href || href === '#' || href === 'javascript:void(0)' || href === 'login.html') {
            // Check if we are on index.html or another page that has the auth modal
            if (authModal) {
                e.preventDefault();
                setAuthMode('login');
                authModal.classList.remove('hidden');
            }
        }
    });
}

if (joinBtn) {
    joinBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (authModal) {
            setAuthMode('register');
            authModal.classList.remove('hidden');
        } else if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html#register';
        } else {
            // Already on login.html but modal/container not found as authModal
            setAuthMode('register');
        }
    });
}

// Handle Form Submit (Email/Password)
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Trim inputs to prevent common whitespace errors
        const email = authForm.email.value.trim();
        const password = authForm.password.value.trim();
        const fullName = authForm.full_name ? authForm.full_name.value.trim() : '';

        // Diagnostic logging
        console.log("Submit Event Captured");
        console.log("Auth Mode:", isLoginMode ? "LOGIN" : "REGISTER");
        console.log("Target Email:", email);

        if (!email || !password) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            // Add loading state to button
            const originalBtnText = authSubmitBtn.textContent;
            authSubmitBtn.disabled = true;
            authSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            if (isLoginMode) {
                // Login
                console.log("Attempting Login...");
                await signInWithEmailAndPassword(auth, email, password);
                console.log("User logged in successfully");
            } else {
                // Register
                console.log("Attempting Registration...");
                if (!email.includes('@')) {
                    throw new Error("auth/invalid-email");
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Create user document in Firestore with Name
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    displayName: fullName,
                    email: user.email,
                    createdAt: new Date(),
                    lastLogin: new Date()
                });
                console.log("User registered with Name:", fullName);
            }

            if (authModal) authModal.classList.add('hidden');
            authForm.reset();

            // Redirect if on login page
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'tracker.html';
            }
        } catch (error) {
            // Restore button state
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = isLoginMode ? "Login" : "Sign Up";

            console.error("Auth Error Detail:", error);
            
            // Map cryptic Firebase errors to user-friendly messages
            let message = "An error occurred during authentication.";
            
            switch (error.code) {
                case 'auth/invalid-credential':
                    message = "Invalid email or password. If you don't have an account, please switch to the 'Sign Up' tab.";
                    break;
                case 'auth/user-not-found':
                    message = "No account found with this email. Please Sign Up first.";
                    break;
                case 'auth/wrong-password':
                    message = "Incorrect password. Please try again.";
                    break;
                case 'auth/email-already-in-use':
                    message = "This email is already registered. Please Login instead.";
                    break;
                case 'auth/weak-password':
                    message = "Password should be at least 6 characters.";
                    break;
                case 'auth/invalid-email':
                    message = "Please enter a valid email address.";
                    break;
                case 'auth/popup-closed-by-user':
                    message = "Sign-in popup was closed before completion.";
                    break;
                default:
                    message = error.message;
            }
            
            alert(message);
        }
    });
}

// Handle Google Sign In
if (googleSignInBtn) {
    console.log("Google Sign In Button Found");
    googleSignInBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("Google Sign In Clicked");
        console.log("Auth Config:", auth);
        console.log("Google Provider:", googleProvider);

        try {
            console.log("Opening Google Sign-In Popup...");
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Popup Closed, Result:", result);

            const user = result.user;
            // Check if user exists, if not create (or just overwrite with merge: true)
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                lastLogin: new Date()
            }, { merge: true });

            console.log("Google Sign In Success");
            if (authModal) authModal.classList.add('hidden');

            // Redirect if on login page
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'tracker.html';
            }
        } catch (error) {
            console.error("Google Auth Error:", error);
            alert(error.message);
        }
    });
}

// Handle Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            console.log("User logged out");
            // Redirect to home if on protected page
            if (window.location.pathname.includes('tracker.html')) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error("Logout Error:", error);
        }
    });
}

// Helper to toggle visibility of nav-items
function toggleNavItem(element, show) {
    if (!element) return;
    const navItem = element.closest('.nav-item');
    if (navItem) {
        if (show) {
            navItem.classList.remove('hidden');
        } else {
            navItem.classList.add('hidden');
        }
    }
    // Also toggle the element itself to be safe
    if (show) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

// Auth State Monitor
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        toggleNavItem(loginBtn, false);
        toggleNavItem(joinBtn, false);
        toggleNavItem(logoutBtn, true);
        
        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.email;
            toggleNavItem(userEmailDisplay, true);
        }

        // Specific logic for Tracker Page
        if (window.location.pathname.includes('tracker.html')) {
            if (window.tracker) {
                window.tracker.setUser(user);
            }
        }

        // Redirect from login page if already authenticated
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'tracker.html';
        }

    } else {
        // User is signed out
        toggleNavItem(loginBtn, true);
        toggleNavItem(joinBtn, true);
        toggleNavItem(logoutBtn, false);
        toggleNavItem(userEmailDisplay, false);

        // Protect tracker page
        if (window.location.pathname.includes('tracker.html')) {
            window.location.href = 'index.html'; // Redirect to home
        }
    }
});
