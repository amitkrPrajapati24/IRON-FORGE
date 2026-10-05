/**
 * IronForge Trainer Booking System
 * Handles dynamic trainer loading, interactive calendar, slot selection, and Firestore integration
 */

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- Trainer Data ---
    const trainers = {
        marcus_blackwood: {
            name: "Marcus Blackwood",
            role: "Elite Performance Coach",
            image: "images/trainers/marcus_blackwood.png",
            rate: 120,
            specialty: "High Intensity"
        },
        elena_vance: {
            name: "Elena Vance",
            role: "Mobility & Flow Specialist",
            image: "images/trainers/elena.png",
            rate: 135,
            specialty: "Mobility & Flow"
        },
        jaxson_reed: {
            name: "Jaxson Reed",
            role: "Body Recomposition Expert",
            image: "images/trainers/jaxson.png",
            rate: 110,
            specialty: "Nutrition & Hypertrophy"
        },
        sofia_ricci: {
            name: "Sofia Ricci",
            role: "Combat & HIIT Lead",
            image: "images/trainers/sofia.png",
            rate: 145,
            specialty: "Boxing & HIIT"
        }
    };

    // --- State Management ---
    let currentUser = null;
    let currentDate = new Date(); // Month currently viewed in calendar
    let selectedDate = null;      // Actual selected booking date
    let selectedTime = null;
    let currentTrainer = trainers.marcus_blackwood; // Default

    const taxes = 5.50; // Service fee

    // --- DOM Elements ---
    const monthDisplay = document.getElementById('current-month-display');
    const calendarGrid = document.getElementById('calendar-grid');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const timeGrid = document.getElementById('time-grid');
    const summaryDateTime = document.getElementById('summary-date-time');
    const confirmBtn = document.getElementById('confirm-pay-btn');

    // Trainer UI Elements
    const trainerImg = document.getElementById('trainer-img');
    const trainerNameDisplay = document.getElementById('trainer-name-display');
    const trainerRoleDisplay = document.getElementById('trainer-role-display');
    const summarySessionType = document.getElementById('summary-session-type');
    const summaryUnitPrice = document.getElementById('summary-unit-price');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const summaryTotal = document.getElementById('summary-total-price');

    // --- Auth State ---
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        if (!user) {
            console.log("No user signed in. Booking will be disabled.");
        } else {
            console.log("User signed in:", user.email);
        }
    });

    // --- Initialization ---
    function init() {
        const params = new URLSearchParams(window.location.search);
        const trainerId = params.get('trainer');
        
        if (trainerId && trainers[trainerId]) {
            currentTrainer = trainers[trainerId];
            updateTrainerUI();
        }

        renderCalendar();
        updateSummary();
    }

    function updateTrainerUI() {
        if (trainerImg) trainerImg.src = currentTrainer.image;
        if (trainerNameDisplay) trainerNameDisplay.textContent = currentTrainer.name;
        if (trainerRoleDisplay) trainerRoleDisplay.textContent = currentTrainer.role;
        if (summarySessionType) summarySessionType.textContent = `${currentTrainer.specialty} 1-on-1`;
        if (summaryUnitPrice) summaryUnitPrice.textContent = `$${currentTrainer.rate.toFixed(2)}`;
        
        calculateTotals();
    }

    function calculateTotals() {
        const subtotal = currentTrainer.rate;
        const total = subtotal + taxes;
        
        if (summarySubtotal) summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (summaryTotal) summaryTotal.textContent = `$${total.toFixed(2)}`;
    }

    // --- Calendar Implementation ---
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        monthDisplay.textContent = `${monthNames[month]} ${year}`;

        calendarGrid.innerHTML = '';

        // Header for weekdays
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        dayNames.forEach(day => {
            const dayNameEl = document.createElement('div');
            dayNameEl.className = 'calendar-day-name';
            dayNameEl.textContent = day;
            calendarGrid.appendChild(dayNameEl);
        });

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Adjust starting day (0=Sun, so Mon=1, etc.)
        let startingDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        // Previous month padding
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = startingDayOffset; i > 0; i--) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day muted';
            dayEl.textContent = prevMonthDays - i + 1;
            calendarGrid.appendChild(dayEl);
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dayDate = new Date(year, month, d);
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = d;

            // Past date check
            if (dayDate < today) {
                dayEl.classList.add('disabled');
            } else {
                dayEl.addEventListener('click', () => selectDate(d));
            }

            // Highlighting
            if (dayDate.toDateString() === today.toDateString()) {
                dayEl.classList.add('today');
            }

            if (selectedDate && dayDate.toDateString() === selectedDate.toDateString()) {
                dayEl.classList.add('active');
            }

            calendarGrid.appendChild(dayEl);
        }

        // Future padding to fill 6 rows if needed
        const totalSlots = startingDayOffset + daysInMonth;
        const remaining = 42 - totalSlots;
        for (let i = 1; i <= remaining; i++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day muted';
            dayEl.textContent = i;
            calendarGrid.appendChild(dayEl);
        }
    }

    function selectDate(day) {
        selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        renderCalendar();
        updateSummary();
    }

    // --- Time Slot Selection ---
    timeGrid.addEventListener('click', (e) => {
        const slot = e.target.closest('.time-slot');
        if (!slot) return;

        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
        slot.classList.add('active');
        selectedTime = slot.getAttribute('data-time');
        
        updateSummary();
    });

    function updateSummary() {
        if (!selectedDate) {
            summaryDateTime.textContent = "Select a date";
            return;
        }
        
        const options = { month: 'short', day: 'numeric' };
        const dateStr = selectedDate.toLocaleDateString('en-US', options);
        
        if (!selectedTime) {
            summaryDateTime.textContent = `${dateStr} • Select Time`;
        } else {
            summaryDateTime.textContent = `${dateStr} • ${selectedTime}`;
        }
    }

    // --- Event Listeners ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    confirmBtn.addEventListener('click', async () => {
        // Validation
        if (!currentUser) {
            alert("Please sign in to book a session.");
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) loginBtn.click();
            return;
        }

        if (!selectedDate || !selectedTime) {
            alert("Please select both a date and a time slot.");
            return;
        }

        // Animation state
        confirmBtn.innerHTML = 'Securing Slot... <i class="fa-solid fa-spinner fa-spin"></i>';
        confirmBtn.disabled = true;

        try {
            // Save to Firestore
            const bookingData = {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                trainerName: currentTrainer.name,
                trainerRole: currentTrainer.role,
                date: selectedDate.toISOString(),
                time: selectedTime,
                totalPrice: currentTrainer.rate + taxes,
                status: 'confirmed',
                timestamp: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "bookings"), bookingData);
            console.log("Booking successful, ID:", docRef.id);

            // Success UI
            confirmBtn.innerHTML = 'Session Booked! <i class="fa-solid fa-check"></i>';
            confirmBtn.style.background = 'linear-gradient(135deg, #4CAF50, #2E7D32)';
            
            setTimeout(() => {
                alert(`Success! Your session with ${currentTrainer.name} is confirmed for ${summaryDateTime.textContent}. Your booking ID is ${docRef.id}.`);
                window.location.href = 'tracker.html'; // Redirect to tracker to see sessions?
            }, 500);

        } catch (error) {
            console.error("Booking Error:", error);
            alert("Failed to save booking. Please try again.");
            confirmBtn.innerHTML = 'Confirm & Pay <i class="fa-solid fa-bolt"></i>';
            confirmBtn.disabled = false;
        }
    });

    // --- Run init ---
    init();
});
