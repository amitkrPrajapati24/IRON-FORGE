import { db } from "./firebase-config.js";
import {
    doc,
    getDoc,
    setDoc,
    collection,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";


// Data Management & Storage

class FitnessTracker {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentTab = 'calories';
        this.calorieGoal = 2000;
        this.data = {}; // Local cache of data
        this.user = null;
        this.unsubscribe = null;
        this.chart = null;

        // UI is initialized, but data waits for user
        this.initializeEventListeners();

        // Render empty state initially
        this.renderCalendar();
        this.renderWaterGrid();
        this.updateAllDisplays();
        this.renderChart();
    }

    setUser(user) {
        this.user = user;
        if (this.user) {
            console.log("Tracker: Loading data for user", user.email);
            this.initData();
        } else {
            console.log("Tracker: User logged out");
            this.data = {};
            this.updateAllDisplays();
            if (this.unsubscribe) this.unsubscribe();
        }
    }

    async initData() {
        if (!this.user) return;

        // 1. Load User Settings (Calorie Goal)
        try {
            const userDocRef = doc(db, "users", this.user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().calorieGoal) {
                this.calorieGoal = userDoc.data().calorieGoal;
            }
        } catch (error) {
            console.error("Error loading user settings:", error);
        }

        // 2. Real-time listener for Days Data
        // Optimization: In a real app, maybe only listen to current month or year
        // For this demo, we listen to all user's days
        const daysCollectionRef = collection(db, "users", this.user.uid, "days");

        this.unsubscribe = onSnapshot(daysCollectionRef, (snapshot) => {
            this.data = {};
            snapshot.forEach((doc) => {
                this.data[doc.id] = doc.data();
            });

            // Render UI after data load
            this.renderCalendar();
            this.renderWaterGrid();
            this.updateAllDisplays();
            this.renderChart();
        }, (error) => {
            console.error("Error listening to data:", error);
        });
    }

    // Replace LocalStorage save with Firestore save
    async saveData() {
        if (!this.user) {
            alert("Please sign in to save your progress!");
            return;
        }

        try {
            // Save Calorie Goal (if changed)
            const userDocRef = doc(db, "users", this.user.uid);
            setDoc(userDocRef, { calorieGoal: this.calorieGoal }, { merge: true });

            // Save Current Day's Data
            const dateKey = this.getDateKey(this.selectedDate);
            const dayData = this.data[dateKey] || { calories: 0, water: 0, workouts: [] };

            const dayDocRef = doc(db, "users", this.user.uid, "days", dateKey);
            await setDoc(dayDocRef, dayData);
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data. Please check your internet connection.");
        }
    }

    getDateKey(date = this.selectedDate) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getDateData(date = this.selectedDate) {
        const key = this.getDateKey(date);
        if (!this.data[key]) {
            // Return default structure but don't save yet to avoid empty writes
            return {
                calories: 0,
                water: 0,
                workouts: []
            };
        }
        return this.data[key];
    }

    // Helper to ensure data exists in cache before modification
    ensureDateData(date = this.selectedDate) {
        const key = this.getDateKey(date);
        if (!this.data[key]) {
            this.data[key] = {
                calories: 0,
                water: 0,
                workouts: []
            };
        }
        return this.data[key];
    }

    // ===========================
    // Event Listeners
    // ===========================

    initializeEventListeners() {
        // Calorie Tracker
        const addCalorieBtn = document.getElementById('addCalorieBtn');
        if (addCalorieBtn) addCalorieBtn.addEventListener('click', () => this.addCalories());

        const calorieInput = document.getElementById('calorieInput');
        if (calorieInput) calorieInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addCalories();
        });

        const editGoalBtn = document.getElementById('editCalorieGoal');
        if (editGoalBtn) editGoalBtn.addEventListener('click', () => this.editCalorieGoal());

        // Water Tracker
        const drinkWaterBtn = document.getElementById('drinkWaterBtn');
        if (drinkWaterBtn) drinkWaterBtn.addEventListener('click', () => this.addWater());

        // Calendar Navigation
        const prevMonthBtn = document.getElementById('prevMonth');
        if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));

        const nextMonthBtn = document.getElementById('nextMonth');
        if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => this.changeMonth(1));

        // Workout Log
        const addExerciseBtn = document.getElementById('addExerciseBtn');
        if (addExerciseBtn) addExerciseBtn.addEventListener('click', () => this.openExerciseModal());

        const closeModalBtn = document.getElementById('closeModal');
        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeExerciseModal());

        const cancelExerciseBtn = document.getElementById('cancelExercise');
        if (cancelExerciseBtn) cancelExerciseBtn.addEventListener('click', () => this.closeExerciseModal());

        const submitExerciseBtn = document.getElementById('submitExercise');
        if (submitExerciseBtn) submitExerciseBtn.addEventListener('click', () => this.submitExercise());

        const closeDayDetailsBtn = document.getElementById('closeDayDetails');
        if (closeDayDetailsBtn) closeDayDetailsBtn.addEventListener('click', () => this.closeDayDetailsModal());

        // Analytics Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Modal backdrop click
        const exerciseModal = document.getElementById('exerciseModal');
        if (exerciseModal) exerciseModal.addEventListener('click', (e) => {
            if (e.target.id === 'exerciseModal') this.closeExerciseModal();
        });

        const dayDetailsModal = document.getElementById('dayDetailsModal');
        if (dayDetailsModal) dayDetailsModal.addEventListener('click', (e) => {
            if (e.target.id === 'dayDetailsModal') this.closeDayDetailsModal();
        });
    }

    // ===========================
    // Calorie Tracker
    // ===========================

    addCalories() {
        const input = document.getElementById('calorieInput');
        const value = parseInt(input.value);

        if (value && value > 0) {
            const dateData = this.ensureDateData();
            dateData.calories += value;
            this.saveData(); // Triggers sync

            // Optimistic Update
            this.updateCalorieDisplay();
            this.renderChart();
            input.value = '';

            // Animation feedback
            this.animateValue('.current-calories', dateData.calories - value, dateData.calories, 500);
        }
    }

    editCalorieGoal() {
        const newGoal = prompt('Enter your daily calorie goal:', this.calorieGoal);
        if (newGoal && !isNaN(newGoal) && newGoal > 0) {
            this.calorieGoal = parseInt(newGoal);
            this.saveData();
            this.updateCalorieDisplay();
        }
    }

    updateCalorieDisplay() {
        const dateData = this.getDateData();
        const currentCalories = dateData.calories || 0;
        const percentage = Math.min((currentCalories / this.calorieGoal) * 100, 100);

        const currentCalElem = document.querySelector('.current-calories');
        if (currentCalElem) currentCalElem.textContent = currentCalories;

        const goalElem = document.getElementById('calorieGoal');
        if (goalElem) goalElem.textContent = this.calorieGoal;

        const progressElem = document.getElementById('calorieProgress');
        if (progressElem) progressElem.style.width = `${percentage}%`;
    }

    // ===========================
    // Water Tracker
    // ===========================

    renderWaterGrid() {
        const grid = document.getElementById('waterGrid');
        if (!grid) return;
        grid.innerHTML = '';

        for (let i = 0; i < 8; i++) {
            const glass = document.createElement('div');
            glass.className = 'water-glass';
            glass.dataset.index = i;
            glass.addEventListener('click', () => this.toggleWaterGlass(i));
            grid.appendChild(glass);
        }

        this.updateWaterDisplay();
    }

    toggleWaterGlass(index) {
        const dateData = this.ensureDateData();

        // Toggle logic
        if (index < dateData.water) {
            dateData.water = index;
        } else {
            dateData.water = index + 1;
        }

        this.saveData();
        this.updateWaterDisplay();
        this.renderChart();
    }

    addWater() {
        const dateData = this.ensureDateData();
        if ((dateData.water || 0) < 8) {
            dateData.water = (dateData.water || 0) + 1;
            this.saveData();
            this.updateWaterDisplay();
            this.renderChart();
        }
    }

    updateWaterDisplay() {
        const dateData = this.getDateData();
        const glasses = document.querySelectorAll('.water-glass');

        glasses.forEach((glass, index) => {
            if (index < (dateData.water || 0)) {
                glass.classList.add('filled');
            } else {
                glass.classList.remove('filled');
            }
        });

        const countElem = document.getElementById('waterCount');
        if (countElem) countElem.textContent = dateData.water || 0;
    }

    // ===========================
    // Workout Log
    // ===========================

    openExerciseModal() {
        const modal = document.getElementById('exerciseModal');
        if (modal) {
            modal.classList.add('active');
            const nameInput = document.getElementById('exerciseName');
            if (nameInput) nameInput.focus();
        }
    }

    closeExerciseModal() {
        const modal = document.getElementById('exerciseModal');
        if (modal) modal.classList.remove('active');
        this.clearExerciseForm();
    }

    clearExerciseForm() {
        const ids = ['exerciseName', 'exerciseSets', 'exerciseReps', 'exerciseDuration', 'exerciseCalories'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    submitExercise() {
        const name = document.getElementById('exerciseName').value.trim();
        const sets = parseInt(document.getElementById('exerciseSets').value) || 0;
        const reps = parseInt(document.getElementById('exerciseReps').value) || 0;
        const duration = parseInt(document.getElementById('exerciseDuration').value) || 0;
        const calories = parseInt(document.getElementById('exerciseCalories').value) || 0;

        if (!name) {
            alert('Please enter an exercise name');
            return;
        }

        const dateData = this.ensureDateData();
        const exercise = {
            id: Date.now(),
            name,
            sets,
            reps,
            duration,
            calories,
            timestamp: new Date().toISOString()
        };

        if (!dateData.workouts) dateData.workouts = [];
        dateData.workouts.push(exercise);

        this.saveData();
        this.updateWorkoutDisplay();
        this.renderChart();
        this.closeExerciseModal();
    }

    deleteWorkout(id) {
        if (confirm('Are you sure you want to delete this workout?')) {
            const dateData = this.ensureDateData();
            if (dateData.workouts) {
                dateData.workouts = dateData.workouts.filter(w => w.id !== id);
                this.saveData();
                this.updateWorkoutDisplay();
                this.renderChart();
            }
        }
    }

    updateWorkoutDisplay() {
        const dateData = this.getDateData();
        const workoutList = document.getElementById('workoutList');
        if (!workoutList) return;

        if (!dateData.workouts || dateData.workouts.length === 0) {
            workoutList.innerHTML = '<p class="empty-state">No workouts logged.</p>';
            return;
        }

        workoutList.innerHTML = dateData.workouts.map(workout => `
            <div class="workout-item">
                <div class="workout-header">
                    <span class="workout-name">${workout.name}</span>
                    <button class="delete-btn" onclick="window.tracker.deleteWorkout(${workout.id})">🗑️</button>
                </div>
                <div class="workout-details">
                    ${workout.sets ? `<span class="workout-detail">📊 ${workout.sets} sets</span>` : ''}
                    ${workout.reps ? `<span class="workout-detail">🔢 ${workout.reps} reps</span>` : ''}
                    ${workout.duration ? `<span class="workout-detail">⏱️ ${workout.duration} min</span>` : ''}
                    ${workout.calories ? `<span class="workout-detail">🔥 ${workout.calories} kcal</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    // ===========================
    // Calendar
    // ===========================

    renderCalendar() {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

        calendar.innerHTML = '';

        const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day header';
            header.textContent = day;
            calendar.appendChild(header);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        for (let i = firstDay - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = daysInPrevMonth - i;
            calendar.appendChild(day);
        }

        const today = new Date();
        for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            day.textContent = i;

            const date = new Date(year, month, i);
            const dateKey = this.getDateKey(date);

            if (date.toDateString() === today.toDateString()) {
                day.classList.add('today');
            }

            if (date.toDateString() === this.selectedDate.toDateString()) {
                day.classList.add('selected');
            }

            // Highlight days with data
            if (this.data[dateKey]) {
                const hasData = (this.data[dateKey].calories > 0) ||
                    (this.data[dateKey].water && this.data[dateKey].water > 0) ||
                    (this.data[dateKey].workouts && this.data[dateKey].workouts.length > 0);
                if (hasData) {
                    day.classList.add('has-data');
                }
            }

            day.addEventListener('click', () => this.selectDate(date));
            calendar.appendChild(day);
        }

        const totalCells = calendar.children.length - 7;
        const remainingCells = 42 - totalCells - 7;
        for (let i = 1; i <= remainingCells; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = i;
            calendar.appendChild(day);
        }
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    selectDate(date) {
        this.selectedDate = new Date(date);
        this.renderCalendar();
        this.updateAllDisplays();
        this.renderChart();
    }

    // ===========================
    // Analytics Chart
    // ===========================

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        this.renderChart();
    }

    renderChart() {
        const canvas = document.getElementById('analyticsChart');
        if (!canvas) return;

        const data = this.getChartData();
        const ctx = canvas.getContext('2d');

        // Theme colors
        let mainColor, bgColor;
        switch (this.currentTab) {
            case 'calories':
                mainColor = '#ff5722';
                bgColor = 'rgba(255, 87, 34, 0.1)';
                break;
            case 'water':
                mainColor = '#2196f3';
                bgColor = 'rgba(33, 150, 243, 0.1)';
                break;
            case 'workout':
                mainColor = '#4caf50';
                bgColor = 'rgba(76, 175, 80, 0.1)';
                break;
            default:
                mainColor = '#ff5722';
                bgColor = 'rgba(255, 87, 34, 0.1)';
        }

        if (this.chart) {
            // Update existing chart
            this.chart.data.labels = data.labels;
            this.chart.data.datasets[0].data = data.values;
            this.chart.data.datasets[0].label = this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1);
            this.chart.data.datasets[0].borderColor = mainColor;
            this.chart.data.datasets[0].backgroundColor = bgColor;
            this.chart.update();
        } else {
            // Initialize new Chart.js instance
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1),
                        data: data.values,
                        borderColor: mainColor,
                        backgroundColor: bgColor,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4, // Smooth curves
                        pointBackgroundColor: mainColor,
                        pointBorderColor: '#1a1a1a',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // We use our own tabs
                        },
                        tooltip: {
                            backgroundColor: '#2a2a2a',
                            titleFont: { family: 'Inter', size: 14 },
                            bodyFont: { family: 'Inter', size: 13 },
                            padding: 12,
                            cornerRadius: 8,
                            displayColors: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: '#333333'
                            },
                            ticks: {
                                color: '#707070',
                                font: { family: 'Inter' }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#707070',
                                font: { family: 'Inter' }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        }
    }

    getChartData() {
        const labels = [];
        const values = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(this.selectedDate);
            date.setDate(date.getDate() - i);

            const dateKey = this.getDateKey(date);
            const dateData = this.data[dateKey] || { calories: 0, water: 0, workouts: [] };

            labels.push(dayNames[date.getDay()]);

            switch (this.currentTab) {
                case 'calories':
                    values.push(dateData.calories || 0);
                    break;
                case 'water':
                    values.push(dateData.water || 0);
                    break;
                case 'workout':
                    const totalWorkoutCalories = (dateData.workouts || []).reduce((sum, w) => sum + (w.calories || 0), 0);
                    values.push(totalWorkoutCalories);
                    break;
            }
        }

        return { labels, values };
    }

    // ===========================
    // Utility Functions
    // ===========================

    updateAllDisplays() {
        this.updateCalorieDisplay();
        this.updateWaterDisplay();
        this.updateWorkoutDisplay();
    }

    animateValue(selector, start, end, duration) {
        const element = document.querySelector(selector);
        if (!element) return;
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.round(current);
        }, 16);
    }

    openDayDetailsModal(date) {
        const dateData = this.getDateData(date);
        const modal = document.getElementById('dayDetailsModal');
        const title = document.getElementById('dayDetailsTitle');
        const content = document.getElementById('dayDetailsContent');

        if (title) title.textContent = `Details for ${date.toLocaleDateString()}`;

        if (content) content.innerHTML = `
            <div class="day-details">
                <h4>📊 Summary</h4>
                <p><strong>Calories:</strong> ${dateData.calories || 0} / ${this.calorieGoal} kcal</p>
                <p><strong>Water:</strong> ${dateData.water || 0} / 8 glasses</p>
                <p><strong>Workouts:</strong> ${(dateData.workouts || []).length} exercises</p>
            </div>
        `;

        if (modal) modal.classList.add('active');
    }

    closeDayDetailsModal() {
        const modal = document.getElementById('dayDetailsModal');
        if (modal) modal.classList.remove('active');
    }
}

// ===========================
// Initialize Application
// ===========================

// Expose tracker to window for auth.js and deleteWorkout (onclick)
document.addEventListener('DOMContentLoaded', () => {
    // Protocol Diagnostic Check
    if (window.location.protocol === 'file:') {
        alert("CRITICAL ERROR: You are running this file incorrectly.\n\nYou must use a LOCAL SERVER (like Live Server or npx http-server) for Firebase and Modules to work.\n\nPlease check the console for more info.");
        console.error("CRITICAL ERROR: file:// protocol detected. Firebase modules will FAIL to load. Use a local server.");
    }

    window.tracker = new FitnessTracker();
});