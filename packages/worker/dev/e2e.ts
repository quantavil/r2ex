import { r2ex } from "../src";

export default {
	async fetch(request, env, context) {
		return r2ex({
			readonly: false,
			cors: true,
			showHiddenFiles: true,
		}).fetch(request, env, context);
	},
};
