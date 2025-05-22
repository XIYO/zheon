<script>
	import SignUpForm from '$lib/components/SignUpForm.svelte';
	import { enhance } from '$app/forms';
</script>

<form class="space-y-6 bg-white p-6 rounded shadow-md max-w-md mx-auto" method="POST" use:enhance>
	<SignUpForm />
</form>