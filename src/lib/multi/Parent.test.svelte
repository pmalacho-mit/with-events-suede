<script lang="ts">
  import { Sweater } from "../sweater-vest-suede";
  import Parent from "./Parent.svelte";
</script>

<Sweater body={async () => {}}>
  {#snippet vest({}: {})}
    <Parent />
  {/snippet}
</Sweater>
