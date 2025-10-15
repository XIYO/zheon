<script>
	import { signUpEmail, signUpGoogle } from '$lib/remote/auth.remote.js';
	import GoogleIcon from '$lib/icons/GoogleIcon.svelte';
	import * as m from '$lib/paraglide/messages';
</script>

<div class="h-screen w-screen flex items-center justify-center">
	<div class="max-w-md w-full">
		<!-- Header Section -->
		<header class="p-4 text-center">
			<h2 class="text-xl font-bold">{m.auth_sign_up_title()}</h2>
			<p>{m.auth_sign_up_subtitle()}</p>
		</header>

		<div class="divider"></div>

		<!-- Content Section -->
		<section class="p-4 space-y-4">
			<!-- Google Sign-up Form -->
			<form {...signUpGoogle}>
				<button type="submit" class="btn preset-filled-primary w-full">
					<GoogleIcon size={20} class="h-5 w-5" />
					<span>{m.auth_sign_up_google_button()}</span>
				</button>
			</form>

			<div class="divider">또는</div>

			<!-- Email Sign-up Form -->
			<form {...signUpEmail}>
				<label class="label">
					<span>이메일</span>
					<input
						class="input"
						{...signUpEmail.fields?.email?.as('email')}
						aria-invalid={(signUpEmail.fields?.email?.issues()?.length ?? 0) > 0}
					/>
					{#each signUpEmail.fields?.email?.issues() || [] as issue}
						<span class="text-error-500 text-sm">{issue.message}</span>
					{/each}
				</label>

				<label class="label mt-4">
					<span>비밀번호</span>
					<input
						class="input"
						{...signUpEmail.fields?.password?.as('password')}
						aria-invalid={(signUpEmail.fields?.password?.issues()?.length ?? 0) > 0}
					/>
					{#each signUpEmail.fields?.password?.issues() || [] as issue}
						<span class="text-error-500 text-sm">{issue.message}</span>
					{/each}
				</label>

				<label class="label mt-4">
					<span>비밀번호 확인</span>
					<input
						class="input"
						{...signUpEmail.fields?.confirmPassword?.as('password')}
						aria-invalid={(signUpEmail.fields?.confirmPassword?.issues()?.length ?? 0) > 0}
					/>
					{#each signUpEmail.fields?.confirmPassword?.issues() || [] as issue}
						<span class="text-error-500 text-sm">{issue.message}</span>
					{/each}
				</label>

				<button type="submit" class="btn preset-filled-primary w-full mt-4">회원가입</button>
			</form>
		</section>
	</div>
</div>
