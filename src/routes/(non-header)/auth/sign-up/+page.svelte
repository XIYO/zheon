<script>
	import SignUpForm from '$lib/components/SignUpForm.svelte';
	import { enhance } from '$app/forms';
</script>

<form class="mx-auto max-w-md space-y-6 rounded bg-white p-6 shadow-md" method="POST" use:enhance>
	<SignUpForm />
</form>
