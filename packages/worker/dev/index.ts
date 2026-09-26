import { r2ex } from "../src";

const baseConfig = {
	readonly: false,
	cors: true,
	showHiddenFiles: true,
};

export default {
	async email(event, env, context) {
		await r2ex(baseConfig).email(event, env, context);
	},
	async fetch(request, env, context) {
		return r2ex({
			...baseConfig,
			basicAuth: {
				username: env.BASIC_USERNAME,
				password: env.BASIC_PASSWORD,
			},
		}).fetch(request, env, context);
	},
};
