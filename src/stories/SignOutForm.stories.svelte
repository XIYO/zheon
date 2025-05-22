<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SignOutForm from '$lib/components/SignOutForm.svelte';

  const { Story } = defineMeta({
    title: 'Auth/Sign/SignOutForm',
    component: SignOutForm,
    tags: ['autodocs'],
  });
</script>

<Story name="Sign Out" />

