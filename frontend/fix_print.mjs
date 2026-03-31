import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dir = './src/components/results';
const files = readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [
  // Inner cards with rounded-2xl
  {
    from: 'bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg"',
    to:   'bg-white backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg print:shadow-none"',
  },
  // Inner cards with mt-6
  {
    from: 'mt-6 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg"',
    to:   'mt-6 bg-white backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg print:shadow-none"',
  },
  // Rounded-xl p-4 text-center
  {
    from: 'bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50 shadow-lg text-center"',
    to:   'bg-white backdrop-blur-sm rounded-xl p-4 border border-orange-200/50 shadow-lg text-center print:shadow-none"',
  },
  // rounded-2xl hover variant
  {
    from: 'bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300"',
    to:   'bg-white backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300 print:shadow-none"',
  },
  // mt-8 rounded-xl (LifeSituation footer)
  {
    from: 'mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-200/50 text-center"',
    to:   'mt-8 bg-white backdrop-blur-sm rounded-xl p-6 border border-orange-200/50 text-center"',
  },
  // Outer overflow-hidden containers
  {
    from: 'rounded-3xl p-8 border border-orange-200 shadow-xl overflow-hidden"',
    to:   'rounded-3xl p-8 border border-orange-200 shadow-xl overflow-hidden print:overflow-visible print:bg-white print:shadow-none"',
  },
];

for (const file of files) {
  const path = join(dir, file);
  let content = readFileSync(path, 'utf8');
  let changed = false;
  for (const { from, to } of replacements) {
    while (content.includes(from)) {
      content = content.replace(from, to);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(path, content, 'utf8');
    console.log('Updated:', file);
  }
}
console.log('Done.');
