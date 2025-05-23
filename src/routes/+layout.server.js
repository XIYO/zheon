export const trailingSlash = 'always';
export const prerender = true;
//export const csr = false;

export function load({ locals }) {
	if (locals.session) {
		return {
			userMetadata: locals.user.user_metadata,
		};
	}

	return {
		userMetadata: null,
	};
}