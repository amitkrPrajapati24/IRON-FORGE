/* Main JS for IronForge Website */

document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Menu Toggle ---
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
            const icon = navToggle.querySelector('i');
            if (navMenu.classList.contains('show')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('show');
            const icon = navToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    });

    // --- BMI Calculator (Biometric Dashboard) ---
    const bmiForm = document.getElementById('bmi-form');
    const bmiValueLarge = document.getElementById('bmi-value');
    const bmiStatusBadge = document.getElementById('bmi-status-badge');
    const gaugeFill = document.getElementById('gauge-fill');
    const compItems = {
        'Underweight': document.getElementById('comp-underweight'),
        'Healthy Weight': document.getElementById('comp-healthy'),
        'Overweight': document.getElementById('comp-overweight'),
        'Obese': document.getElementById('comp-obese')
    };

    if (bmiForm) {
        bmiForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const height = parseFloat(document.getElementById('height').value);
            const weight = parseFloat(document.getElementById('weight').value);

            if (height && weight) {
                // BMI Formula: weight (kg) / [height (m)]^2
                const heightInMeters = height / 100;
                const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

                // Update Large Value
                bmiValueLarge.textContent = bmi;

                // Update Gauge
                // dasharray is 628 (2 * PI * 100). We map BMI 10-40 to 0-100%
                let percentage = ((bmi - 10) / (40 - 10)) * 100;
                percentage = Math.min(Math.max(percentage, 0), 100);
                const offset = 628 - (628 * percentage) / 100;
                gaugeFill.style.strokeDashoffset = offset;

                let status = '';
                let color = '';
                let compKey = '';

                if (bmi < 18.5) {
                    status = 'Underweight';
                    color = '#ffc107';
                    compKey = 'Underweight';
                } else if (bmi >= 18.5 && bmi <= 24.9) {
                    status = 'Healthy Weight';
                    color = '#4caf50';
                    compKey = 'Healthy Weight';
                } else if (bmi >= 25 && bmi <= 29.9) {
                    status = 'Overweight';
                    color = '#ff9800';
                    compKey = 'Overweight';
                } else {
                    status = 'Obese';
                    color = '#f44336';
                    compKey = 'Obese';
                }

                // Update Badge
                bmiStatusBadge.textContent = status;
                bmiStatusBadge.style.background = `${color}20`;
                bmiStatusBadge.style.color = color;
                bmiStatusBadge.style.borderColor = `${color}40`;

                // Update Composition Analysis active state
                Object.values(compItems).forEach(item => item.classList.remove('active'));
                if (compItems[compKey]) {
                    compItems[compKey].classList.add('active');
                }

                // Update Diet Recommendation (existing logic)
                updateDietPlan(status, bmi);
            }
        });
    }

    function updateDietPlan(status, bmi) {
        const dietSection = document.getElementById('diet-recommendation');
        if (!dietSection) return;

        const dietPlans = {
            'Underweight': {
                name: 'Mass Gainer & Nutritious Bulk',
                breakfast: 'Oatmeal with whole milk, peanut butter, chia seeds, and a banana.',
                lunch: 'Grilled salmon or tofu with quinoa, avocado, and olive oil dressing.',
                dinner: 'Lean beef or chickpea curry with brown rice and mixed vegetables.',
                snack: 'Greek yogurt with honey, walnuts, and a handful of dried fruits.',
                macros: { protein: 30, carbs: 50, fats: 20 }
            },
            'Healthy Weight': {
                name: 'Balanced Maintenance & Vitality',
                breakfast: 'Scrambled eggs with spinach, tomatoes, and whole-grain toast.',
                lunch: 'Chicken breast or lentil salad with mixed greens, chickpeas, and lemon-tahini dressing.',
                dinner: 'Baked fish or tempeh with sweet potato and roasted broccoli.',
                snack: 'Apple slices with almond butter or a small handful of almonds.',
                macros: { protein: 25, carbs: 45, fats: 30 }
            },
            'Overweight': {
                name: 'Lean Shred & Metabolism Boost',
                breakfast: 'Protein smoothie with unsweetened almond milk, berries, and spinach.',
                lunch: 'Tuna or white bean salad with cucumber, bell peppers, and balsamic vinegar.',
                dinner: 'Grilled turkey or soy chunks with a large portion of steamed asparagus and zucchini.',
                snack: 'Cottage cheese or a hard-boiled egg with a side of celery.',
                macros: { protein: 40, carbs: 30, fats: 30 }
            },
            'Obese': {
                name: 'Metabolic Reset & Satiety Focus',
                breakfast: 'Vegetable omelet (mostly egg whites) with mushrooms and bell peppers.',
                lunch: 'Large green salad with grilled shrimp or grilled tofu and no-oil vinaigrette.',
                dinner: 'Roasted chicken (no skin) or steamed fish with cauliflower rice and sautéed spinach.',
                snack: 'Cucumber slices with hummus or a small cup of berry mix.',
                macros: { protein: 45, carbs: 25, fats: 30 }
            }
        };

        // Normalize status for lookup
        let key = status;
        if (status === 'Healthy Weight') key = 'Healthy Weight'; // Match existing logic

        const plan = dietPlans[key] || dietPlans['Healthy Weight'];

        document.getElementById('diet-plan-name').innerHTML = `Based on your <span style="color:var(--primary-color)">${status}</span> status, we recommend the <strong>${plan.name}</strong>.`;
        document.getElementById('meal-breakfast').textContent = plan.breakfast;
        document.getElementById('meal-lunch').textContent = plan.lunch;
        document.getElementById('meal-dinner').textContent = plan.dinner;
        document.getElementById('meal-snack').textContent = plan.snack;

        // Update Macros
        document.getElementById('protein-pct').textContent = `${plan.macros.protein}%`;
        document.getElementById('carbs-pct').textContent = `${plan.macros.carbs}%`;
        document.getElementById('fats-pct').textContent = `${plan.macros.fats}%`;

        document.getElementById('protein-bar').style.width = `${plan.macros.protein}%`;
        document.getElementById('carbs-bar').style.width = `${plan.macros.carbs}%`;
        document.getElementById('fats-bar').style.width = `${plan.macros.fats}%`;

        dietSection.classList.remove('hidden');
        dietSection.scrollIntoView({ behavior: 'smooth' });
    }

});
