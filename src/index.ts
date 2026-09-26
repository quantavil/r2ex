import { r2ex } from "../packages/worker/src/index";

export default {
	async email(event: any, env: any, context: any) {
		await r2ex().email(event, env, context);
	},
	async fetch(request: Request, env: any, context: any) {
		const auth =
			env.BASIC_USERNAME && env.BASIC_PASSWORD
				? { username: env.BASIC_USERNAME, password: env.BASIC_PASSWORD }
				: undefined;

		const isReadonly =
			env.READONLY === "true" || env.READONLY === true;

		return r2ex({
			readonly: isReadonly,
			cors: true,
			showHiddenFiles:
				env.SHOW_HIDDEN_FILES === "true" || env.SHOW_HIDDEN_FILES === true,
			basicAuth: auth,
		}).fetch(request, env, context);
	},
};
