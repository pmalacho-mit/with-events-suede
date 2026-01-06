<script lang="ts" module>
  import { WithEvents } from "../../../release";
  import Child, { Model as ChildModel } from "./Child.svelte";

  class Model {
    children = $state<ChildModel[]>([]);
  }
</script>

<script lang="ts">
  const model = new Model();

  const details = $state<string[]>([]);

  const collection = $derived(WithEvents.Collect(model.children));

  $effect(() => {
    return collection.subscribe({
      "request removal": (_, index) => {
        model.children.splice(index, 1);
      },
      "request announce": (text, _, index) => details.push(`${index}: ${text}`),
    });
  });
</script>

<div>
  <button
    onclick={() => model.children.push(new ChildModel(model.children.length))}
  >
    Add Child
  </button>
</div>

{#each model.children as child}
  <div>
    <Child model={child} />
  </div>
{/each}

<div>
  <h3>Details:</h3>
  <ul>
    {#each details as detail}
      <li>{detail}</li>
    {/each}
  </ul>
</div>

<!-- must be careful firing event that has a subscriber that mutates the collection,
since that will invalidate the iteration, as the unsubscriber will be called likely during the iteration 
-->
<button onclick={() => collection.fire("request removal")}>Delete all</button>
