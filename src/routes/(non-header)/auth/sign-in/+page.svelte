<script>
	import { signInEmail, signInGoogle } from '$lib/remote/auth.remote';
	import GoogleIcon from '$lib/icons/GoogleIcon.svelte';
	
</script>

<div class="h-screen w-screen flex items-center justify-center">
	<div class="max-w-md w-full">
		<!-- Header Section -->
		<header class="p-4 text-center">
			<h2 class="text-xl font-bold">로그인</h2>
			<p>계정에 로그인하세요</p>
		</header>

		<div class="divider"></div>

		<!-- Content Section -->
		<section class="p-4 space-y-4">
			<!-- Google Login Form -->
			{#if signInGoogle}
				<form {...signInGoogle}>
					<button type="submit" class="btn preset-filled-primary w-full">
						<GoogleIcon size={20} class="h-5 w-5" />
						<span>Google로 로그인</span>
					</button>
				</form>
			{/if}

			<div class="divider">또는</div>

			<!-- Email Login Form -->
			{#if signInEmail}
				<form {...signInEmail}>
					<label class="label">
						<span>이메일</span>
						<input
							class="input"
							{...signInEmail.fields?.email?.as('email')}
							aria-invalid={(signInEmail.fields?.email?.issues()?.length ?? 0) > 0} />
						{#each signInEmail.fields?.email?.issues() || [] as issue (issue.message)}
							<span class="text-error-500 text-sm">{issue.message}</span>
						{/each}
					</label>

					<label class="label mt-4">
						<span>비밀번호</span>
						<input
							class="input"
							{...signInEmail.fields?.password?.as('password')}
							aria-invalid={(signInEmail.fields?.password?.issues()?.length ?? 0) > 0} />
						{#each signInEmail.fields?.password?.issues() || [] as issue (issue.message)}
							<span class="text-error-500 text-sm">{issue.message}</span>
						{/each}
					</label>

					<button type="submit" class="btn preset-filled-primary w-full mt-4">로그인</button>
				</form>
			{/if}
		</section>
	</div>
</div>
