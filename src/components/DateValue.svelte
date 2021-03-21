<script lang="ts">
  import { formatCurrency } from "utils";

  export let date: string;
  export let value: number;
  export let ratio: number;
  export let privateMode: boolean;
</script>

<div class="flex w-full text-xs justify-between text-gray-600">
  <div class="font-extralight">{date}</div>

  <div class="text-left">
    <span>{ratio.toFixed(2)}%</span>{" "}
    {#if privateMode}
      $--
    {:else}
      <span class="font-extralight">
        ({value >= 0 ? "" : "-"}${formatCurrency(Math.abs(value), 2)})
      </span>
    {/if}
  </div>
</div>
