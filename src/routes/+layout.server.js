export const trailingSlash = 'always';

export function load({ locals }) {
	if (locals.session) {
		return {
			userMetadata: locals.user.user_metadata
		};
	}

	return {
		userMetadata: null
	};
}
