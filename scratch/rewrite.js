const fs = require('fs');
let code = fs.readFileSync('components/BookingForm.tsx', 'utf8');

// 1. Remove old ATTRIBUTE_GROUPS
code = code.replace(/const ATTRIBUTE_GROUPS = \[[\s\S]*?\n\];\n/, '');

// 2. Import ATTRIBUTE_GROUPS
code = code.replace(/import \{ useTranslation, type Language \} from '@\/lib\/i18n';/, `import { useTranslation, type Language } from '@/lib/i18n';\nimport { ATTRIBUTE_GROUPS } from '@/lib/attributes';`);

// 3. Change default language to 'nn'
code = code.replace(/const \[language, setLanguage\] = useState<Language>\('no'\);/, `const [language, setLanguage] = useState<Language>('nn');`);

// 4. Update the language selector buttons to a dropdown
const oldSelector = `            {/* Language selector */}
            <div className="flex gap-1 md:gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setLanguage('no')}
                className={\`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors \${
                  language === 'no'
                    ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }\`}
              >
                NO
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={\`px-2.5 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors \${
                  language === 'en'
                    ? 'bg-white dark:bg-gray-700 text-amber-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }\`}
              >
                EN
              </button>
            </div>`;

const newSelector = `            {/* Language selector */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-gray-700 dark:text-gray-200 text-xs md:text-sm font-medium px-2 py-1 md:py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="nn">Nynorsk</option>
                <option value="no">Bokmål</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>`;

code = code.replace(oldSelector, newSelector);

// 5. Fix inline language checks
code = code.replace(/language === 'no' \? 'Bestill' : 'Book'/g, `t.pageTitle`);
code = code.replace(/language === 'no' \? 'F.eks. Voss Stasjon' : 'e.g. Voss Station'/g, `language === 'en' ? 'e.g. Voss Station' : language === 'de' ? 'z.B. Voss Bahnhof' : language === 'fr' ? 'ex. Gare de Voss' : language === 'es' ? 'ej. Estación de Voss' : 'F.eks. Voss Stasjon'`);
code = code.replace(/language === 'no' \? 'F.eks. Voss Sjukehus' : 'e.g. Voss Hospital'/g, `language === 'en' ? 'e.g. Voss Hospital' : language === 'de' ? 'z.B. Voss Krankenhaus' : language === 'fr' ? 'ex. Hôpital de Voss' : language === 'es' ? 'ej. Hospital de Voss' : 'F.eks. Voss Sjukehus'`);
code = code.replace(/language === 'no' \? 'Ditt fulle navn' : 'Your full name'/g, `language === 'en' ? 'Your full name' : language === 'de' ? 'Ihr vollständiger Name' : language === 'fr' ? 'Votre nom complet' : language === 'es' ? 'Su nombre completo' : 'Ditt fulle namn'`);
code = code.replace(/language === 'no' \? '\+47 XXX XX XXX' : '\+47 XXX XX XXX'/g, `'+47 XXX XX XXX'`);
code = code.replace(/language === 'no' \? 'Din epost \(valgfritt\)' : 'Your email \(optional\)'/g, `language === 'en' ? 'Your email (optional)' : language === 'de' ? 'Ihre E-Mail (optional)' : language === 'fr' ? 'Votre email (optionnel)' : language === 'es' ? 'Su correo electrónico (opcional)' : 'Din e-post (valgfritt)'`);
code = code.replace(/language === 'no' \? 'F.eks. BK-1234567' : 'e.g. BK-1234567'/g, `language === 'en' ? 'e.g. BK-1234567' : language === 'de' ? 'z.B. BK-1234567' : language === 'fr' ? 'ex. BK-1234567' : language === 'es' ? 'ej. BK-1234567' : 'F.eks. BK-1234567'`);
code = code.replace(/\{statusLoading \? language === 'no' \? 'Søker\.\.\.' : 'Searching\.\.\.' : t.searchBooking\}/g, `{statusLoading ? t.booking : t.searchBooking}`);

// 6. Fix attributes logic
code = code.replace(/\{language === 'no' \? group.label_no : group.label_en\}/g, `{group.labels[language as keyof typeof group.labels]}`);
code = code.replace(/\{language === 'no' \? opt.label_no : opt.label_en\}/g, `{opt.labels[language as keyof typeof opt.labels]}`);
code = code.replace(/\{language === 'no' \? 'Kjøretøy og behov' : 'Vehicle and Needs'\}/g, `{t.vehicleType}`);

// 7. Fix passenger plural logic
code = code.replace(/language === 'no' \? \(num === 1 \? 'Passasjer' : 'Passasjerer'\) : num === 1 \? 'Passenger' : 'Passengers'/g, `num === 1 ? t.passenger : t.passengers_other`);


fs.writeFileSync('components/BookingForm.tsx', code);
console.log('Done rewriting BookingForm.tsx');
