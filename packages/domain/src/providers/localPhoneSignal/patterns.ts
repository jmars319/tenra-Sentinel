export const isSequential = (digits: string): boolean => {
  if (digits.length < 6) return false;

  return "0123456789".includes(digits) || "9876543210".includes(digits);
};
