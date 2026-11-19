// Every job endpoint checks the secret (VXM-012 R5). Vercel Cron sends it as
// "Authorization: Bearer <CRON_SECRET>"; a run by hand sends the same header.
export function isAuthorized(request: Request): boolean {
	const secret = process.env.CRON_SECRET;
	return (
		Boolean(secret) &&
		request.headers.get('authorization') === `Bearer ${secret}`
	);
}
