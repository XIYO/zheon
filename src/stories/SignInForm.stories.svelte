<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SignInForm from '$lib/components/SignInForm.svelte';

	const { Story } = defineMeta({
		title: 'Auth/Sign/SignInForm',
		component: SignInForm,
		tags: ['autodocs']
	});
</script>

<Story name="Sign In" />
