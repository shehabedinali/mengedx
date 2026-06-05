/**
 * Normalise an Ethiopian phone number to +251XXXXXXXXX format.
 * Accepts: 0911234567, 911234567, +251911234567, 251911234567
 */
export function toEthiopianPhone(phone: string): string {
    if (!phone) return phone;
    const digits = phone.replace(/\D/g, '');

    // Already full international: 251XXXXXXXXX (12 digits)
    if (digits.startsWith('251') && digits.length === 12) return `+${digits}`;

    // With leading 0: 0XXXXXXXXX (10 digits)
    if (digits.startsWith('0') && digits.length === 10) return `+251${digits.slice(1)}`;

    // Local 9-digit: XXXXXXXXX
    if (digits.length === 9) return `+251${digits}`;

    // Already has + prefix stored as string
    if (phone.startsWith('+251')) return phone;

    // Fallback — return as-is with prefix
    return `+251${digits}`;
}

/**
 * Strip +251 / 251 / leading 0 to get a bare 9-digit local number
 * suitable for display in the +251 | XXXXXXXXX input pattern.
 */
export function fromEthiopianPhone(phone: string): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');

    if (digits.startsWith('251') && digits.length === 12) return digits.slice(3);
    if (digits.startsWith('0') && digits.length === 10) return digits.slice(1);
    if (digits.length === 9) return digits;
    return digits;
}

/**
 * For controlled inputs: strip any country-code prefix so the user only sees
 * the local 9 digits (used with onChange handlers).
 */
export function stripLocalPhoneDigits(value: string): string {
    const digits = value.replace(/\D/g, '');
    // Remove leading 251 or 0 if the user accidentally typed them
    if (digits.startsWith('251')) return digits.slice(3).slice(0, 9);
    if (digits.startsWith('0')) return digits.slice(1).slice(0, 9);
    return digits.slice(0, 9);
}
