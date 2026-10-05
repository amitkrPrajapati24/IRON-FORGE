// --- Training Dashboard Logic ---

document.addEventListener('DOMContentLoaded', () => {
    const trainerGrid = document.getElementById('trainer-grid');
    const trainerCards = Array.from(document.querySelectorAll('.trainer-card'));
    const specialtyPills = document.querySelectorAll('.pill');
    const rateSlider = document.getElementById('rate-slider');
    const rateValDisplay = document.getElementById('rate-val');
    const trainerSearch = document.getElementById('trainer-search');
    const timeBtns = document.querySelectorAll('.time-btn');

    let currentFilters = {
        specialty: 'all',
        maxRate: 500,
        searchQuery: '',
        availability: []
    };

    // Filter Functionality
    const filterTrainers = () => {
        trainerCards.forEach(card => {
            const cardSpecialty = card.getAttribute('data-specialty');
            const cardRate = parseInt(card.getAttribute('data-rate'));
            const cardName = card.querySelector('.trainer-name').textContent.toLowerCase();
            const cardRole = card.querySelector('.trainer-role').textContent.toLowerCase();

            const matchesSpecialty = currentFilters.specialty === 'all' || cardSpecialty === currentFilters.specialty;
            const matchesRate = cardRate <= currentFilters.maxRate;
            const matchesSearch = cardName.includes(currentFilters.searchQuery) || cardRole.includes(currentFilters.searchQuery);

            if (matchesSpecialty && matchesRate && matchesSearch) {
                card.style.display = 'block';
                card.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                card.style.display = 'none';
            }
        });
    };

    // Specialty Pills
    specialtyPills.forEach(pill => {
        pill.addEventListener('click', () => {
            specialtyPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilters.specialty = pill.getAttribute('data-filter');
            filterTrainers();
        });
    });

    // Rate Slider
    rateSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        rateValDisplay.textContent = `$${val}+`;
        currentFilters.maxRate = parseInt(val);
        filterTrainers();
    });

    // Search
    trainerSearch.addEventListener('input', (e) => {
        currentFilters.searchQuery = e.target.value.toLowerCase();
        filterTrainers();
    });

    // Availability Toggle (Visual only for now)
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
        });
    });

    // Initial Filter
    filterTrainers();
});

// Add fade-in animation to style
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
