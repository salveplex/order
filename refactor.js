const fs = require('fs');

let content = fs.readFileSync('components/BookingForm.tsx', 'utf8');

// Strip theme toggle logic
content = content.replace(/const \[theme, setTheme\] = useState<[^>]+>\('system'\);/, '');
content = content.replace(/const \[isDark, setIsDark\] = useState\(false\);/, 'const isDark = false;');
content = content.replace(/\/\/ Handle theme changes[\s\S]*?\}, \[theme\]\);/, '');

// Let's remove the theme selector properly
content = content.replace(/\{\/\* Theme selector \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, '</div>\n          </div>\n        </div>\n      </div>');

// Replace dark classes
content = content.replace(/\bdark:[a-zA-Z0-9-/[\]]+\b/g, '');

// Replace main container
content = content.replace(/className="min-h-screen bg-white transition-colors"/g, 'className="min-h-screen bg-[var(--background)] transition-colors"');
content = content.replace(/className="min-h-screen bg-white\s+transition-colors"/g, 'className="min-h-screen bg-[var(--background)] transition-colors"');

// Replace form panels
content = content.replace(/className="bg-white\s+rounded-2xl\s+shadow-sm\s+border\s+border-gray-200\s+p-5\s+md:p-12"/g, 'className="glass-panel p-5 md:p-12"');
content = content.replace(/className="bg-white\s+rounded-2xl\s+shadow-sm\s+border\s+border-gray-200\s+p-8\s+md:p-12"/g, 'className="glass-panel p-8 md:p-12"');

// Replace input fields
content = content.replace(/className="w-full\s+px-4\s+py-2\.5\s+rounded-lg\s+border\s+border-gray-300\s+bg-white\s+text-gray-900\s+placeholder-gray-400\s+text-sm\s+focus:outline-none\s+focus:border-amber-600\s+focus:ring-1\s+focus:ring-amber-500\s+transition-colors"/g, 'className="soft-input w-full px-4 py-2.5"');
content = content.replace(/className="w-full\s+pl-10\s+pr-4\s+py-2\.5\s+rounded-lg\s+border\s+border-gray-300\s+bg-white\s+text-gray-900\s+text-sm\s+focus:outline-none\s+focus:border-amber-600\s+focus:ring-1\s+focus:ring-amber-500\s+transition-colors"/g, 'className="soft-input w-full pl-10 pr-4 py-2.5"');
content = content.replace(/className="w-full\s+pl-11\s+pr-4\s+py-2\.5\s+rounded-lg\s+border\s+border-gray-300\s+bg-white\s+text-gray-900\s+placeholder-gray-400\s+text-sm\s+focus:outline-none\s+focus:border-amber-600\s+focus:ring-1\s+focus:ring-amber-500\s+transition-colors"/g, 'className="soft-input w-full pl-11 pr-4 py-2.5"');

// Replace text areas and selects
content = content.replace(/className="w-full\s+px-4\s+py-2\.5\s+rounded-lg\s+border\s+border-gray-300\s+bg-white\s+text-gray-900\s+text-sm\s+focus:outline-none\s+focus:border-amber-600\s+focus:ring-1\s+focus:ring-amber-500\s+transition-colors\s+appearance-none"/g, 'className="soft-input w-full px-4 py-2.5 appearance-none"');
content = content.replace(/className="w-full\s+px-4\s+py-2\.5\s+rounded-lg\s+border\s+border-gray-300\s+bg-white\s+text-gray-900\s+placeholder-gray-400\s+text-sm\s+focus:outline-none\s+focus:border-amber-600\s+focus:ring-1\s+focus:ring-amber-500\s+transition-colors\s+resize-none"/g, 'className="soft-input w-full px-4 py-2.5 resize-none"');

// Replace CTA buttons
content = content.replace(/className="w-full\s+px-6\s+py-3\.5\s+bg-\[#ffcc00\]\s+text-gray-900\s+font-bold\s+text-lg\s+rounded-lg\s+hover:bg-\[#e6b800\]\s+focus:outline-none\s+focus:ring-2\s+focus:ring-\[#ffcc00\]\s+focus:ring-offset-2\s+transition-colors\s+shadow-md\s+disabled:opacity-50\s+disabled:cursor-not-allowed"/g, 'className="cta-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"');

// Fix theme state variables if they got messed up in spaces
fs.writeFileSync('components/BookingForm.tsx', content);
console.log("Refactoring complete");
