// backend/utils/idGenerator.js

/**
 * Generates a numeric string of a given length.
 * It combines the end of the current timestamp with random digits.
 * @param {number} length The desired length of the numeric ID.
 * @returns {string} A numeric string of the specified length.
 */
function generateNumericIdPart(length = 8) {
  const timestampStr = Date.now().toString(); // Milliseconds since epoch

  // Take a portion of the timestamp (e.g., last 5 digits for an 8-digit ID)
  // The more of the timestamp we use from the end, the more rapidly it changes.
  const timestampPartLength = Math.min(length - 3, 5); // Use 3-5 digits from timestamp end
  const timestampPortion = timestampStr.slice(-timestampPartLength);

  // Fill the rest with random numbers
  const randomPartLength = length - timestampPortion.length;
  let randomPortion = "";
  if (randomPartLength > 0) {
    const maxRandom = Math.pow(10, randomPartLength);
    randomPortion = Math.floor(Math.random() * maxRandom)
      .toString()
      .padStart(randomPartLength, "0");
  }

  return (timestampPortion + randomPortion).slice(0, length); // Ensure exact length
}

/**
 * Generates a new Order ID.
 * Format: 'O' + 8 digits (e.g., O12345678)
 * @returns {string}
 */
function generateOrderId() {
  return `O${generateNumericIdPart(8)}`;
}

/**
 * Generates a new Order Item ID.
 * Format: 'OI' + 8 digits (e.g., OI12345678)
 * @returns {string}
 */
function generateOrderItemId() {
  return `OI${generateNumericIdPart(8)}`;
}

/**
 * Generates a new Menu ID.
 * Format: 'M' + 8 digits (e.g., M12345678)
 * (Based on examples like M213560000 where numeric part is 8 digits)
 * @returns {string}
 */
function generateMenuId() {
  return `M${generateNumericIdPart(8)}`;
}

/**
 * Generates a new Ingredient ID.
 * Format: 'I' + 8 digits (e.g., I12345678)
 * (Based on examples like I985630000 where numeric part is 8 digits)
 * @returns {string}
 */
function generateIngredientId() {
  return `I${generateNumericIdPart(8)}`;
}

/**
 * Generates a new Ingredient Category ID.
 * Format: 'IC' + 8 digits (e.g., IC12345678)
 * (Based on examples like IC98563000 where numeric part is 8 digits)
 * @returns {string}
 */
function generateIngredientCategoryId() {
  return `IC${generateNumericIdPart(8)}`;
}

module.exports = {
  generateOrderId,
  generateOrderItemId,
  generateMenuId,
  generateIngredientId,
  generateIngredientCategoryId,
  // You can add more generators here if needed (e.g., for EmployeeID if not manually assigned)
};
