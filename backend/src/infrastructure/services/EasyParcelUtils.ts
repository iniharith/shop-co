const MALAYSIAN_SUBDIVISIONS: Record<string, string> = {
  johor: 'MY-01',
  kedah: 'MY-02',
  kelantan: 'MY-03',
  melaka: 'MY-04',
  malacca: 'MY-04',
  'negeri sembilan': 'MY-05',
  pahang: 'MY-06',
  'pulau pinang': 'MY-07',
  penang: 'MY-07',
  perak: 'MY-08',
  perlis: 'MY-09',
  selangor: 'MY-10',
  terengganu: 'MY-11',
  sabah: 'MY-12',
  sarawak: 'MY-13',
  'kuala lumpur': 'MY-14',
  'wilayah persekutuan kuala lumpur': 'MY-14',
  labuan: 'MY-15',
  'wilayah persekutuan labuan': 'MY-15',
  putrajaya: 'MY-16',
  'wilayah persekutuan putrajaya': 'MY-16',
};

export function toMalaysianSubdivisionCode(value: string): string {
  const normalized = value.trim();
  if (/^MY-(0[1-9]|1[0-6])$/i.test(normalized)) return normalized.toUpperCase();

  const code = MALAYSIAN_SUBDIVISIONS[normalized.toLowerCase()];
  if (!code) throw new Error(`Unsupported Malaysian state: ${normalized || 'empty'}`);
  return code;
}

export function normalizeMalaysianPhone(value: string): { countryCode: 'MY'; number: string } {
  let number = value.replace(/[^\d+]/g, '').replace(/^\+/, '');
  if (number.startsWith('60')) number = number.slice(2);
  number = number.replace(/^0+/, '');
  if (!/^\d{8,11}$/.test(number)) throw new Error('A valid Malaysian phone number is required');
  return { countryCode: 'MY', number };
}
