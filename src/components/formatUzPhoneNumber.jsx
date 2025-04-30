function formatUzPhoneNumber(phone) {
  // Faqat raqamlarni ajratib olamiz
  const digits = phone.replace(/\D/g, "");

  // +998 bilan boshlanmaydigan bo'lsa, chiqarib yuboramiz
  if (!digits.startsWith("998") || digits.length !== 12) {
    return phone; // noto‘g‘ri format
  }

  const country = digits.slice(0, 3); // 998
  const code = digits.slice(3, 5); // 88
  const part1 = digits.slice(5, 8); // 254
  const part2 = digits.slice(8, 10); // 77
  const part3 = digits.slice(10, 12); // 75

  return `+${country}-${code}-${part1}-${part2}-${part3}`;
}

export default formatUzPhoneNumber