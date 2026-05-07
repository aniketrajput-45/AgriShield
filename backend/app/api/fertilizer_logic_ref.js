const express = require('express');
const router = express.Router();

/**
 * NPK Calculation Algorithm with Overlap Handling
 * Logic:
 * 1. Prioritize fertilizers that provide the most specific nutrients first (usually P or K).
 * 2. As each fertilizer amount is calculated, subtract any "incidental" nutrients it provides 
 *    from the remaining targets.
 * 3. Finally, fulfill the remaining Nitrogen (N) since N is often provided by single-nutrient sources (Urea).
 */
const calculateFertilizer = (req, res) => {
    const { targetN, targetP, targetK, availableFertilizers } = req.body;

    // Initialize remaining targets
    let remainingN = parseFloat(targetN) || 0;
    let remainingP = parseFloat(targetP) || 0;
    let remainingK = parseFloat(targetK) || 0;

    let schedule = [];

    // Sort fertilizers to handle P and K before N (common overlap strategy)
    const sortedFertilizers = [...availableFertilizers].sort((a, b) => (b.p + b.k) - (a.p + a.k));

    sortedFertilizers.forEach(fert => {
        let amount = 0;

        // Fulfill Phosphorus (P) first if fertilizer contains it
        if (remainingP > 0 && fert.p > 0) {
            amount = (remainingP / fert.p) * 100;
        } 
        // Or fulfill Potassium (K) if fertilizer contains it but no P
        else if (remainingK > 0 && fert.k > 0) {
            amount = (remainingK / fert.k) * 100;
        }
        // Or fulfill Nitrogen (N) if that's all that's left and it's an N-heavy fert
        else if (remainingN > 2 && fert.n > 0 && fert.p === 0 && fert.k === 0) {
            amount = (remainingN / fert.n) * 100;
        }

        if (amount > 0) {
            // Cap at a reasonable limit or remaining targets
            schedule.push({
                fertilizerName: fert.name,
                amountToApply: parseFloat(amount.toFixed(2)),
                unit: 'kg/ha'
            });

            // OVERLAP LOGIC: Subtract incidental nutrients provided by this dose from targets
            remainingN -= (amount * (fert.n / 100));
            remainingP -= (amount * (fert.p / 100));
            remainingK -= (amount * (fert.k / 100));
        }
    });

    // Ensure we don't return negative gaps
    const gap = {
        n: Math.max(0, remainingN).toFixed(2),
        p: Math.max(0, remainingP).toFixed(2),
        k: Math.max(0, remainingK).toFixed(2)
    };

    res.json({
        success: true,
        schedule,
        nutrientGap: gap,
        explanation: "Overlap logic: Nutrients provided by compound fertilizers (like DAP) were automatically subtracted from the remaining Nitrogen requirements."
    });
};

router.post('/calculate-npk', calculateFertilizer);

module.exports = router;
