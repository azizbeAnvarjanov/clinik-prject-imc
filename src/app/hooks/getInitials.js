function getInitials(fio) {
    if (!fio) return "";
  
    const parts = fio.trim().split(" ");
    if (parts.length < 2) return "";
  
    const firstLetter = parts[0][0]; // Familiya
    const secondLetter = parts[1][0]; // Ism
  
    return (firstLetter + secondLetter).toUpperCase();
  }
  
  export default getInitials;
  