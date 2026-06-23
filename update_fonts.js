const fs = require('fs');

let nav = fs.readFileSync('frontend/src/components/global/nav.tsx', 'utf8');
nav = nav.replace(
  '<span className="text-lg text-black dark:text-foreground font-bold">Kampung Cetak</span>',
  '<span className="text-lg text-black dark:text-foreground font-brand font-bold tracking-wider">Kampung Cetak</span>'
);
nav = nav.replace(
  '<h1 className="text-lg md:text-2xl font-bold tracking-tight text-primary">\n                Kampung Cetak\n              </h1>',
  '<h1 className="text-lg md:text-2xl font-brand font-bold tracking-wider text-primary">\n                Kampung Cetak\n              </h1>'
);
fs.writeFileSync('frontend/src/components/global/nav.tsx', nav);

let about = fs.readFileSync('frontend/src/app/about/page.tsx', 'utf8');
about = about.replace(
  'About <span className="text-[#D4AF37]">Kampung Cetak</span>',
  'About <span className="text-[#D4AF37] font-brand">Kampung Cetak</span>'
);
about = about.replace(
  'KAMPUNG CETAK apart from the competition',
  '<span className="font-brand">KAMPUNG CETAK</span> apart from the competition'
);
about = about.replace(
  'Established in 2004, KAMPUNG CETAK',
  'Established in 2004, <span className="font-brand">KAMPUNG CETAK</span>'
);
about = about.replace(
  'Kampung Cetak offers a one-stop center',
  '<span className="font-brand">Kampung Cetak</span> offers a one-stop center'
);
fs.writeFileSync('frontend/src/app/about/page.tsx', about);

console.log("Successfully replaced fonts!");
