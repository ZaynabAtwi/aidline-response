export interface IdentityPayload {
  full_name: string;
  mother_full_name: string;
  sejel_number: string;
  date_of_birth: string; // YYYY-MM-DD
}

function safeTrim(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function firstLetter(value: string): string {
  const trimmed = safeTrim(value);
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : 'X';
}

function extractFamilyName(fullName: string): string {
  const parts = safeTrim(fullName).split(' ').filter(Boolean);
  if (parts.length === 0) return '';
  return parts[parts.length - 1];
}

function alphabeticalHash(initials: string): string {
  return initials
    .toUpperCase()
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String(code - 64).padStart(2, '0'); // A=01 ... Z=26
      }
      return '00';
    })
    .join('');
}

function dateCode(dateOfBirth: string): string {
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date_of_birth format');
  }
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
}

export function generateAidlineIdentity(input: IdentityPayload) {
  const fullName = safeTrim(input.full_name);
  const motherName = safeTrim(input.mother_full_name);
  const familyName = extractFamilyName(fullName);
  const sejelNumber = safeTrim(input.sejel_number).replace(/\s+/g, '');

  const initials = `${firstLetter(fullName)}${firstLetter(motherName)}${firstLetter(familyName)}`;
  const initialsHash = alphabeticalHash(initials);
  const dobCode = dateCode(input.date_of_birth);

  const generated_identity_id = `${initialsHash}${sejelNumber}${dobCode}`;

  return {
    fullName,
    motherName,
    familyName,
    sejelNumber,
    initials,
    initialsHash,
    dobCode,
    generated_identity_id,
  };
}
