<script lang="ts">
  import { formatCurrency } from "utils";

  export let date: string;
  export let value: number;
  export let privateMode: boolean;
</script>

<div class="flex w-full justify-between text-gray-600">
  <div>{date} PnL</div>

  <div class="text-left font-medium">
    {#if privateMode}
      -
    {:else}
      {value >= 0 ? "" : "-"}${formatCurrency(Math.abs(value), 2)}
    {/if}
  </div>
</div>
