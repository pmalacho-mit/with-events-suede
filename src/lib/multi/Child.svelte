<script lang="ts" module>
  import { WithEvents } from "../../../release";
  export class Model extends WithEvents<{
    "request announce": [text: string];
    "request removal": [];
  }> {
    text = $state("hello world");

    constructor(index: number) {
      super();
      this.text += ` (${index})`;
    }
  }
</script>

<script lang="ts">
  let { model }: { model: Model } = $props();
</script>

{model.text}

<button onclick={() => model.fire("request announce", `${model.text}!!`)}>
  Request Update
</button>

<button onclick={() => model.fire("request removal")}> Request Removal </button>
