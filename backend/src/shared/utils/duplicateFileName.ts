export const nextFileName = (requested: string, names: string[]): string => {
  const used = new Set(names.map(name => name.toLowerCase()));
  if (!used.has(requested.toLowerCase())) return requested;
  const dot = requested.lastIndexOf('.');
  const stem = dot > 0 ? requested.slice(0, dot) : requested;
  const extension = dot > 0 ? requested.slice(dot) : '';
  const base = stem.replace(/-\d+$/, '');
  let number = 2;
  for (const name of names) {
    const nameDot = name.lastIndexOf('.');
    const nameStem = nameDot > 0 ? name.slice(0, nameDot) : name;
    const nameExtension = nameDot > 0 ? name.slice(nameDot) : '';
    if (nameExtension.toLowerCase() !== extension.toLowerCase()) continue;
    const match = nameStem.match(/^(.*)-(\d+)$/);
    if (match && match[1].toLowerCase() === base.toLowerCase()) number = Math.max(number, Number(match[2]) + 1);
  }
  while (used.has(`${base}-${number}${extension}`.toLowerCase())) number++;
  return `${base}-${number}${extension}`;
};
