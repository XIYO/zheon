<script>
  import SignInForm from '$lib/components/SignInForm.svelte';
  import Dialog from '$lib/components/Dialog.svelte';

  /** @type {import('$lib/components/Dialog.svelte').default} */
  let signInDialog;

  /**
   * Handles the sign-in dialog opening.
   * @param {MouseEvent} [e] - The mouse event that triggered the function.
   */
  const handleSignIn = (e) => {
    e?.preventDefault();
    signInDialog.open();
  };

  /**
   * Handles the sign-in form submission success.
   */
  const onsuccessSignIn = () => {
    signInDialog.close();
  };
</script>

<section aria-labelledby="hero-title" class="min-h-screen content-center text-center space-y-8">
  <div class="space-y-4">
    <h1 class="text-7xl md:text-8xl font-bold gradient-text">展</h1>
    <p class="text-xl md:text-2xl text-surface-600 dark:text-surface-400">
      유튜브 영상 핵심을 한눈에 요약합니다
    </p>
  </div>

  <button 
    onclick={handleSignIn}
    class="preset-filled-secondary-500 btn"
  >
    시작하기
  </button>
  <p class="mt-3 text-sm text-surface-500">
    로그인하여 유튜브 영상 요약을 시작하세요
  </p>
</section>

<!-- Sign-in Dialog -->
<Dialog bind:this={signInDialog}>
  <SignInForm onsuccess={onsuccessSignIn} />
</Dialog>