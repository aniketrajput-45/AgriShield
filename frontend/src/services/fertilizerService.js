/**
 * Fertilizer Dosage Calculator Service
 * This service calculates the NPK (Nitrogen, Phosphorus, Potassium) requirements
 * based on plot size, crop type, and detected deficiency.
 */

const CROP_REQUIREMENTS = {
  Tomato: { N: 120, P: 60, K: 60 }, // kg per hectare
  Rice: { N: 100, P: 40, K: 40 },
  Wheat: { N: 150, P: 50, K: 50 },
  Maize: { N: 120, P: 50, K: 50 },
};

/**
 * Calculates required fertilizer in kilograms
 * @param {string} crop - The crop type
 * @param {number} plotSize - Size in Acres
 * @param {string} deficiency - Detected deficiency (optional)
 * @returns {object} - Required N, P, K in kg
 */
export const calculateNPK = (crop, plotSize, deficiency = null) => {
  // 1 Acre = 0.4047 Hectares
  const sizeInHectares = plotSize * 0.4047;
  
  const baseReq = CROP_REQUIREMENTS[crop] || CROP_REQUIREMENTS.Tomato;
  
  let results = {
    N: (baseReq.N * sizeInHectares).toFixed(2),
    P: (baseReq.P * sizeInHectares).toFixed(2),
    K: (baseReq.K * sizeInHectares).toFixed(2),
  };

  // Adjust logic based on deficiency (Simplified DSA)
  if (deficiency === 'Nitrogen') {
    results.N = (results.N * 1.5).toFixed(2); // Increase N by 50%
  } else if (deficiency === 'Phosphorus') {
    results.P = (results.P * 1.5).toFixed(2);
  } else if (deficiency === 'Potassium') {
    results.K = (results.K * 1.5).toFixed(2);
  }

  return results;
};
