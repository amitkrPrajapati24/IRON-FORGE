import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    let currentUser = null;
    let selectedPlan = { name: "Pro", price: 49 };
    let paymentMethod = "card";

    // DOM Elements
    const paymentModal = document.getElementById("payment-modal");
    const closePaymentModalBtn = document.getElementById("close-payment-modal");
    const paymentForm = document.getElementById("payment-form");
    const paySubmitBtn = document.getElementById("pay-submit-btn");
    const modalPlanName = document.getElementById("modal-plan-name");
    const modalPlanPrice = document.getElementById("modal-plan-price");
    
    const tabCard = document.getElementById("tab-card");
    const tabUpi = document.getElementById("tab-upi");
    const cardFields = document.getElementById("card-payment-fields");
    const upiFields = document.getElementById("upi-payment-fields");
    
    const checkoutView = document.getElementById("checkout-view");
    const successView = document.getElementById("success-view");
    const successDoneBtn = document.getElementById("success-done-btn");

    // Listen for Auth State
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            await checkExistingMembership(user.uid);
        } else {
            resetPlanBadges();
        }
    });

    // Check if user already has an active membership
    async function checkExistingMembership(uid) {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                if (data.membership && data.membership.status === "active") {
                    highlightActivePlan(data.membership.planName);
                }
            }
        } catch (err) {
            console.error("Error loading membership:", err);
        }
    }

    function highlightActivePlan(planName) {
        resetPlanBadges();
        const cards = document.querySelectorAll(".plan-card");
        cards.forEach(card => {
            const btn = card.querySelector(".choose-plan-btn");
            const name = btn ? btn.getAttribute("data-plan") : "";
            if (name.toLowerCase() === planName.toLowerCase()) {
                card.classList.add("current-active");
                
                // Add badge if not exists
                if (!card.querySelector(".current-plan-badge")) {
                    const badge = document.createElement("div");
                    badge.className = "current-plan-badge";
                    badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Active Plan';
                    card.insertBefore(badge, card.firstChild);
                }

                if (btn) {
                    btn.textContent = "Current Plan";
                    btn.classList.remove("btn-primary");
                    btn.classList.add("btn-outline");
                }
            }
        });
    }

    function resetPlanBadges() {
        document.querySelectorAll(".plan-card").forEach(card => {
            card.classList.remove("current-active");
            const badge = card.querySelector(".current-plan-badge");
            if (badge) badge.remove();
            const btn = card.querySelector(".choose-plan-btn");
            if (btn) {
                btn.textContent = "Choose Plan";
                if (card.classList.contains("popular")) {
                    btn.className = "btn btn-primary choose-plan-btn";
                } else {
                    btn.className = "btn btn-outline choose-plan-btn";
                }
            }
        });
    }

    // Attach click events to all "Choose Plan" buttons
    const planButtons = document.querySelectorAll(".choose-plan-btn");
    planButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();

            // 1. Check if user is logged in
            if (!currentUser) {
                const authModal = document.getElementById("auth-modal");
                if (authModal) {
                    authModal.classList.remove("hidden");
                    const authTitle = document.getElementById("auth-title");
                    if (authTitle) authTitle.textContent = "Sign in to Choose Plan";
                } else {
                    window.location.href = "login.html";
                }
                return;
            }

            // 2. Open Payment Modal
            const planName = btn.getAttribute("data-plan") || "Pro";
            const planPrice = parseInt(btn.getAttribute("data-price"), 10) || 49;
            selectedPlan = { name: planName, price: planPrice };

            openPaymentModal(selectedPlan);
        });
    });

    function openPaymentModal(plan) {
        if (!paymentModal) return;
        
        // Populate modal text
        if (modalPlanName) modalPlanName.textContent = `${plan.name} Membership`;
        if (modalPlanPrice) modalPlanPrice.innerHTML = `$${plan.price}<span>/mo</span>`;
        if (paySubmitBtn) {
            paySubmitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay $${plan.price}.00 Now`;
            paySubmitBtn.disabled = false;
        }

        // Show checkout form, hide success
        if (checkoutView) checkoutView.classList.remove("hidden");
        if (successView) successView.classList.add("hidden");

        // Pre-fill card name if available
        const cardNameInput = document.getElementById("card-name");
        if (cardNameInput && currentUser && currentUser.displayName) {
            cardNameInput.value = currentUser.displayName;
        }

        paymentModal.classList.remove("hidden");
    }

    function closePaymentModal() {
        if (paymentModal) paymentModal.classList.add("hidden");
    }

    if (closePaymentModalBtn) {
        closePaymentModalBtn.addEventListener("click", closePaymentModal);
    }

    // Close on background click
    window.addEventListener("click", (e) => {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    // Payment Tab Switching (Card vs UPI)
    if (tabCard && tabUpi) {
        tabCard.addEventListener("click", () => {
            paymentMethod = "card";
            tabCard.classList.add("active");
            tabUpi.classList.remove("active");
            if (cardFields) cardFields.classList.remove("hidden");
            if (upiFields) upiFields.classList.add("hidden");
        });

        tabUpi.addEventListener("click", () => {
            paymentMethod = "upi";
            tabUpi.classList.add("active");
            tabCard.classList.remove("active");
            if (upiFields) upiFields.classList.remove("hidden");
            if (cardFields) cardFields.classList.add("hidden");
        });
    }

    // Quick UPI Chips
    const upiChips = document.querySelectorAll(".upi-chip");
    upiChips.forEach(chip => {
        chip.addEventListener("click", () => {
            upiChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            const app = chip.getAttribute("data-app");
            const upiInput = document.getElementById("upi-id");
            if (upiInput && currentUser && currentUser.email) {
                const username = currentUser.email.split("@")[0];
                upiInput.value = `${username}@${app}`;
            }
        });
    });

    // Auto-format card number with spaces (#### #### #### ####)
    const cardNumInput = document.getElementById("card-number");
    if (cardNumInput) {
        cardNumInput.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "").substring(0, 16);
            let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
            e.target.value = formatted;
        });
    }

    // Auto-format expiry date (MM/YY)
    const cardExpInput = document.getElementById("card-exp");
    if (cardExpInput) {
        cardExpInput.addEventListener("input", (e) => {
            let val = e.target.value.replace(/\D/g, "").substring(0, 4);
            if (val.length >= 3) {
                e.target.value = `${val.substring(0, 2)}/${val.substring(2, 4)}`;
            } else {
                e.target.value = val;
            }
        });
    }

    // Handle Payment Submission
    if (paymentForm) {
        paymentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!currentUser) {
                alert("Session expired. Please sign in again.");
                return;
            }

            // Simple validation
            if (paymentMethod === "card") {
                const cardNum = document.getElementById("card-number").value.replace(/\s/g, "");
                const cardExp = document.getElementById("card-exp").value;
                const cardCvv = document.getElementById("card-cvv").value;
                if (cardNum.length < 15) {
                    alert("Please enter a valid 16-digit card number.");
                    return;
                }
                if (!cardExp.includes("/") || cardExp.length < 5) {
                    alert("Please enter a valid expiry date (MM/YY).");
                    return;
                }
                if (cardCvv.length < 3) {
                    alert("Please enter a valid 3-digit CVV.");
                    return;
                }
            } else {
                const upiId = document.getElementById("upi-id").value;
                if (!upiId || !upiId.includes("@")) {
                    alert("Please enter a valid UPI ID (e.g., yourname@okhdfcbank).");
                    return;
                }
            }

            // Show Processing Spinner
            paySubmitBtn.disabled = true;
            paySubmitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Processing Payment...`;

            try {
                // Simulate gateway verification delay (1.2 seconds)
                await new Promise(res => setTimeout(res, 1200));

                const txnId = "IF-" + Math.random().toString(36).substr(2, 8).toUpperCase();
                const now = new Date();
                const expiryDate = new Date();
                expiryDate.setDate(now.getDate() + 30); // 30-day valid

                const membershipData = {
                    planName: selectedPlan.name,
                    price: selectedPlan.price,
                    currency: "USD",
                    status: "active",
                    activatedAt: now.toISOString(),
                    expiresAt: expiryDate.toISOString(),
                    paymentMethod: paymentMethod,
                    lastTransactionId: txnId
                };

                // 1. Update user membership in Firestore
                await setDoc(doc(db, "users", currentUser.uid), {
                    membership: membershipData
                }, { merge: true });

                // 2. Add record to payments collection
                await addDoc(collection(db, "payments"), {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    planName: selectedPlan.name,
                    amount: selectedPlan.price,
                    currency: "USD",
                    paymentMethod: paymentMethod,
                    transactionId: txnId,
                    createdAt: serverTimestamp(),
                    status: "completed"
                });

                // Update UI on success
                highlightActivePlan(selectedPlan.name);

                // Populate Receipt in Success View
                document.getElementById("receipt-plan").textContent = `${selectedPlan.name} Plan (Monthly)`;
                document.getElementById("receipt-txn").textContent = txnId;
                document.getElementById("receipt-date").textContent = now.toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric"
                });
                document.getElementById("receipt-amount").textContent = `$${selectedPlan.price}.00`;

                // Switch to Success View
                if (checkoutView) checkoutView.classList.add("hidden");
                if (successView) successView.classList.remove("hidden");

            } catch (err) {
                console.error("Payment Error:", err);
                alert("Payment processing failed: " + err.message);
                paySubmitBtn.disabled = false;
                paySubmitBtn.innerHTML = `<i class="fa-solid fa-lock"></i> Pay $${selectedPlan.price}.00 Now`;
            }
        });
    }

    if (successDoneBtn) {
        successDoneBtn.addEventListener("click", () => {
            closePaymentModal();
        });
    }
});
