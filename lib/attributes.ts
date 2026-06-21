export const ATTRIBUTE_GROUPS = [
  {
    id: 'biltype',
    labels: { no: 'Biltype', nn: 'Biltype', en: 'Vehicle Type', de: 'Fahrzeugtyp', fr: 'Type de véhicule', es: 'Tipo de vehículo' },
    icon: '🚗',
    options: [
      { id: 20, labels: { no: 'Liten bil', nn: 'Liten bil', en: 'Small Car', de: 'Kleinwagen', fr: 'Petite voiture', es: 'Coche pequeño' } },
      { id: 3, labels: { no: 'Lav bil / Personbil', nn: 'Lav bil / Personbil', en: 'Standard Car', de: 'Standardwagen', fr: 'Voiture standard', es: 'Coche estándar' } },
      { id: 0, labels: { no: '6 seter', nn: '6 setar', en: '6 Seater', de: '6-Sitzer', fr: '6 Places', es: '6 Plazas' } },
      { id: 1, labels: { no: '7 seter', nn: '7 setar', en: '7 Seater', de: '7-Sitzer', fr: '7 Places', es: '7 Plazas' } },
      { id: 89, labels: { no: '8 seter', nn: '8 setar', en: '8 Seater', de: '8-Sitzer', fr: '8 Places', es: '8 Plazas' } },
      { id: 4, labels: { no: 'Rullestol', nn: 'Rullestol', en: 'Wheelchair', de: 'Rollstuhl', fr: 'Fauteuil roulant', es: 'Silla de ruedas' } }
    ]
  },
  {
    id: 'bagasje',
    labels: { no: 'Bagasje/utstyr', nn: 'Bagasje/utstyr', en: 'Luggage/Equipment', de: 'Gepäck/Ausrüstung', fr: 'Bagages/Équipement', es: 'Equipaje/Equipo' },
    icon: '🧳',
    options: [
      { id: 23, labels: { no: 'Mykje bagasje', nn: 'Mykje bagasje', en: 'Lots of luggage', de: 'Viel Gepäck', fr: 'Beaucoup de bagages', es: 'Mucho equipaje' } },
      { id: 99, labels: { no: 'Ekstra bagasjeplass', nn: 'Ekstra bagasjeplass', en: 'Extra luggage space', de: 'Zusätzlicher Gepäckraum', fr: 'Espace supplémentaire', es: 'Espacio extra para equipaje' } },
      { id: 21, labels: { no: 'Har med ski', nn: 'Har med ski', en: 'Bringing skis', de: 'Mit Skiern', fr: 'Avec des skis', es: 'Con esquís' } },
      { id: 22, labels: { no: 'Har med snowboard', nn: 'Har med snowboard', en: 'Bringing snowboard', de: 'Mit Snowboard', fr: 'Avec snowboard', es: 'Con tabla de snowboard' } },
      { id: 24, labels: { no: 'Har med hund', nn: 'Har med hund', en: 'Bringing dog', de: 'Mit Hund', fr: 'Avec un chien', es: 'Con perro' } },
      { id: -1, labels: { no: 'Har med sykkel', nn: 'Har med sykkel', en: 'Bringing bicycle', de: 'Mit Fahrrad', fr: 'Avec un vélo', es: 'Con bicicleta' } }
    ]
  },
  {
    id: 'barneseter',
    labels: { no: 'Barneseter', nn: 'Barnesete', en: 'Child Seats', de: 'Kindersitze', fr: 'Sièges enfant', es: 'Sillas infantiles' },
    icon: '👶',
    options: [
      { id: 29, labels: { no: 'Barnestol 0-1 år/0-13 kg', nn: 'Barnestol 0-1 år/0-13 kg', en: 'Child seat 0-1 yrs', de: 'Kindersitz 0-1 Jahre', fr: 'Siège enfant 0-1 ans', es: 'Silla infantil 0-1 años' } },
      { id: 30, labels: { no: 'Barnestol 1-4 år/9-18 kg', nn: 'Barnestol 1-4 år/9-18 kg', en: 'Child seat 1-4 yrs', de: 'Kindersitz 1-4 Jahre', fr: 'Siège enfant 1-4 ans', es: 'Silla infantil 1-4 años' } },
      { id: 31, labels: { no: 'Barnestol 4-10 år/15-25 kg', nn: 'Barnestol 4-10 år/15-25 kg', en: 'Child seat 4-10 yrs', de: 'Kindersitz 4-10 Jahre', fr: 'Siège enfant 4-10 ans', es: 'Silla infantil 4-10 años' } },
      { id: 25, labels: { no: 'Barnepute', nn: 'Barnepute', en: 'Booster seat', de: 'Sitzerhöhung', fr: 'Rehausseur', es: 'Asiento elevador' } },
      { id: 27, labels: { no: 'Spedbarnstol', nn: 'Spedbarnstol', en: 'Infant seat', de: 'Babyschale', fr: 'Siège bébé', es: 'Silla de bebé' } }
    ]
  },
  {
    id: 'helse',
    labels: { no: 'Helse/Behov', nn: 'Helse/Behov', en: 'Health/Needs', de: 'Gesundheit/Bedürfnisse', fr: 'Santé/Besoins', es: 'Salud/Necesidades' },
    icon: '♿',
    options: [
      { id: 16, labels: { no: 'Trenger assistanse', nn: 'Treng assistanse', en: 'Needs assistance', de: 'Benötigt Hilfe', fr: 'A besoin d\'assistance', es: 'Necesita asistencia' } },
      { id: 19, labels: { no: 'Har rullator', nn: 'Har rullator', en: 'Has rollator', de: 'Hat Rollator', fr: 'A un déambulateur', es: 'Tiene andador' } },
      { id: 39, labels: { no: 'Høg innstiging', nn: 'Høg innstiging', en: 'High boarding', de: 'Hoher Einstieg', fr: 'Embarquement haut', es: 'Embarque alto' } },
      { id: 40, labels: { no: 'Allergi', nn: 'Allergi', en: 'Allergies', de: 'Allergien', fr: 'Allergies', es: 'Alergias' } },
      { id: 41, labels: { no: 'Røykfri', nn: 'Røykfri', en: 'Smoke-free', de: 'Rauchfrei', fr: 'Non-fumeur', es: 'Libre de humo' } },
      { id: 9, labels: { no: 'Sammenleggbar rullestol', nn: 'Samanleggbar rullestol', en: 'Foldable wheelchair', de: 'Faltbarer Rollstuhl', fr: 'Fauteuil roulant pliable', es: 'Silla de ruedas plegable' } }
    ]
  },
  {
    id: 'anna',
    labels: { no: 'Anna nyttig', nn: 'Anna nyttig', en: 'Other', de: 'Sonstiges', fr: 'Autres', es: 'Otros' },
    icon: '⭐',
    options: [
      { id: 63, labels: { no: 'Må ha 4WD', nn: 'Må ha 4WD', en: 'Needs 4WD', de: 'Benötigt Allradantrieb', fr: 'A besoin de 4x4', es: 'Necesita 4x4' } },
      { id: 62, labels: { no: 'Må ha piggdekk', nn: 'Må ha piggdekk', en: 'Needs studded tires', de: 'Benötigt Spikereifen', fr: 'A besoin de pneus à clous', es: 'Necesita neumáticos con clavos' } },
      { id: 75, labels: { no: 'Engelskspråkleg sjåfør', nn: 'Engelskspråkleg sjåfør', en: 'English-speaking driver', de: 'Englischsprachiger Fahrer', fr: 'Chauffeur anglophone', es: 'Conductor que hable inglés' } },
      { id: 73, labels: { no: 'Kvinnleg sjåfør', nn: 'Kvinnleg sjåfør', en: 'Female driver', de: 'Weibliche Fahrerin', fr: 'Chauffeuse', es: 'Conductora' } }
    ]
  }
];
