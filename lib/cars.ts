export const carModels: Record<string, { model: string, color: string }> = {
  "VE 2133": { "model": "VOLVO EX90", "color": "SVART" },
  "R 164": { "model": "NIO ES8", "color": "MØRK BLÅ" },
  "VE 2036": { "model": "VW ID.BUZZ", "color": "SVART" },
  "VE 2980": { "model": "MERCEDES SPRINTER", "color": "SVART" },
  "R 169": { "model": "VOLVO EX90", "color": "SVART" },
  "VE 3174": { "model": "MAN TGE", "color": "Ukjent" },
  "VE 3181": { "model": "TESLA", "color": "RØD" },
  "R 190": { "model": "NISSAN X-TRAIL", "color": "ORANGE" },
  "VE 2613": { "model": "VW ID-BUZZ", "color": "RØD" },
  "R 174": { "model": "MERCEDES VITO", "color": "GRÅBRUN" },
  "VE 2988": { "model": "MERCEDES SPRINTER", "color": "GRÅ" },
  "VE 2267": { "model": "VW ID.4", "color": "KVIT" },
  "R 166": { "model": "VOLKSWAGEN CRAFTER", "color": "HVIT" },
  "R 161": { "model": "VOLVO XC 40", "color": "SVART" },
  "R 844": { "model": "MERCEDES SPRINTER", "color": "MØRK BLÅ" },
  "VE 2065": { "model": "TESLA", "color": "KVIT" },
  "VT 2624": { "model": "SPRINTER", "color": "GRÅ" },
  "R 40": { "model": "TESLA", "color": "SVART" },
  "I 34": { "model": "MERCEDES", "color": "KVIT" },
  "VE 2614": { "model": "VW CRAFTER", "color": "GRÅ" },
};

export function getCarDetails(licenseNo: string | null | undefined) {
  if (!licenseNo) return null;
  // Prøv direkte treff
  if (carModels[licenseNo]) return carModels[licenseNo];
  
  // Prøv med bare tallene (f.eks "2065" hvis "VE 2065" mangler "VE")
  const numMatch = licenseNo.match(/\d+/);
  if (numMatch) {
    const num = numMatch[0];
    const key = Object.keys(carModels).find(k => k.includes(num));
    if (key) return carModels[key];
  }
  
  return null;
}
