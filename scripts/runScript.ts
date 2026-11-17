// Runs a script's main() and always ends with a clear result (VXM-010 D2): the script's
// own success line, or "<name>: failed, nothing written - <error>" with an error exit
// code. If Node runs out of work while main() is still waiting, that is reported too
// instead of ending silently.
export function runScript(name: string, main: () => Promise<void>): void {
	let finished = false;
	process.on('exit', code => {
		if (!finished && code === 0) {
			console.error(`${name}: stopped before finishing, nothing written`);
			process.exitCode = 1;
		}
	});

	main()
		.then(() => {
			finished = true;
		})
		.catch((error: unknown) => {
			finished = true;
			console.error(`${name}: failed, nothing written -`, error);
			process.exitCode = 1;
		});
}
