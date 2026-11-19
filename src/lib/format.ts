// "30 dic 2025" - it-IT for now (Max, 2026-11-13); follows the language once i18n exists.
// Shared by the footer and the detail card (VXM-011).
export function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString('it-IT', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}
