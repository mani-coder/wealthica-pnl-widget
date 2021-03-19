<script lang="ts">
  export let labels: string[];
  export let onClick: (index: number) => void;
  export let selectedIndex: number;
</script>

<div class="my-1">
  <div class="flex flex-wrap rounded-lg" role="group">
    {#each labels as label, index}
      <span
        on:click={() => onClick(index)}
        class={`inline-flex items-center cursor-pointer justify-center px-2 py-1 mr-2 mb-2 text-xs font-bold leading-none ${
          index === selectedIndex
            ? "bg-purple-600 text-white"
            : "bg-white text-purple-600 border border-purple-600"
        }  rounded-full`}>{label}</span
      >
    {/each}
  </div>
</div>
