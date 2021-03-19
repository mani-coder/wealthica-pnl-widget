<script lang="ts">
  import { formatCurrency } from "utils";

  export let date: string;
  export let value: number;
</script>

<div class="flex w-full justify-between text-gray-600">
  <div>{date} PnL</div>
  <div>:</div>
  <div class="text-left font-medium">
    {value >= 0 ? "" : "-"}${formatCurrency(Math.abs(value), 2)}
  </div>
</div>
