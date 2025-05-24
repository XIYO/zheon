<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SignUpForm from '$lib/components/SignUpForm.svelte';

	const { Story } = defineMeta({
		title: 'Auth/Sign/SignUpForm',
		component: SignUpForm,
		tags: ['autodocs']
	});
</script>

<Story name="Sign Up" />
