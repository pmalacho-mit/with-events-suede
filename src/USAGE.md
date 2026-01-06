# Usage

Here's a simple example

Here's a more verbose example

It's also common to interact with `WithEvents` as a base class

## API

### `subscribe` + `fire`

### `once`

### `until`

### `Collect`

## svelte runes

The original motivation for this library was to enable some development with [svelte runes](https://svelte.dev/blog/runes), especially when using MVC-style components, like:

```svelte
<script lang="ts" module>
  class Model {
    example = $state("hello world");
  }
</script>

<script lang="ts">
  let { model }: { model: Model } = $props();
</script>

{model.example}
```

Because `model` is a property of `props$()` (and is thus **_reactive_**), it can change over the lifetime of a rendered component.

Thus, this library was created to improve the ergonomics (and typesafety) of subscribing to events on a reactive value.

```svelte
<script lang="ts" module>
  class Model extends WithEvents<{
    hide: []
  }> {
    example = $state("hello world");
  }
</script>

<script lang="ts">
  let { model }: { model: Model } = $props();

  let hidden = $state(false);

  // subscription automatically cleans up when `model` changes
  $effect(() => model.subscribe({
    hide: () => (hidden = true)
  }))
</script>

<div style:display={hidden ? "none" : "block"}>
  {model.example}
</div>
```

Below are more specific examples with

### single

### multi
