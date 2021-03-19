<script lang="ts">
  import moment, { Moment } from "moment";
  import type { Portfolio } from "../types";
  import { formatMoney, getPreviousWeekday } from "../utils";
  import DateRanges from "./DateRanges.svelte";
  import DateValue from "./DateValue.svelte";
  import ArrowDown from "./icons/ArrowDown.svelte";
  import ArrowUp from "./icons/ArrowUp.svelte";

  export let portfolios: Portfolio[] = [];
  export let privateMode: boolean;
  let pnlIndexToShow = 0;

  const portfolioReverse = portfolios.slice().reverse();
  const DATE_DISPLAY_FORMAT = "MMM DD, YYYY";

  function getNearestPortfolioDate(date: string): Portfolio | undefined {
    const dateObj = moment(date);
    if (dateObj.isoWeekday() >= 5) {
      date = dateObj
        .add(dateObj.isoWeekday() === 6 ? 2 : 1, "days")
        .format("YYYY-MM-DD");
    }
    const portfolio = portfolioReverse.find(
      (portfolio) => portfolio.date <= date
    );
    return portfolio;
  }

  function getData() {
    let currentPortfolio = portfolioReverse[0];
    const currentDate = moment().utc();
    if (
      currentDate.format("YYYY-MM-DD") === currentPortfolio.date &&
      currentDate.hour() < 20 &&
      portfolioReverse.length > 1
    ) {
      currentPortfolio = portfolioReverse[1];
    }
    const lastDate = currentPortfolio.date;

    const portfolioValues: {
      id: string;
      label: string;
      date: Moment;
      startPortfolio: Portfolio;
      endPortfolio: Portfolio;
    }[] = [];

    [
      { id: "1D", label: "1 Day", date: getPreviousWeekday(lastDate) },
      {
        id: "1W",
        label: "1 Week",
        date: moment(lastDate).subtract(1, "weeks"),
      },
      {
        id: "1M",
        label: "1 Month",
        date: moment(lastDate).subtract(1, "months").add(1, "days"),
      },
      {
        id: "3M",
        label: "3 Months",
        date: moment(lastDate).subtract(3, "months").add(1, "days"),
      },
      {
        id: "6M",
        label: "6 Months",
        date: moment(lastDate).subtract(6, "months").add(1, "days"),
      },
      {
        id: "1Y",
        label: "1 Year",
        date: moment(lastDate).subtract(1, "years").add(1, "days"),
      },
      {
        id: "2Y",
        label: "2 Years",
        date: moment(lastDate).subtract(2, "years").add(1, "days"),
      },
      {
        id: "3Y",
        label: "3 Years",
        date: moment(lastDate).subtract(3, "years").add(1, "days"),
      },
      {
        id: "5Y",
        label: "5 Years",
        date: moment(lastDate).subtract(5, "years").add(1, "days"),
      },
      {
        id: "MTD",
        label: "Month To Date",
        date: moment(lastDate).startOf("month"),
      },
      {
        id: "WTD",
        label: "Week To Date",
        date: moment(lastDate).startOf("week"),
      },
      {
        id: "YTD",
        label: "Year To Date",
        date: moment(lastDate).startOf("year"),
      },
    ].map((value) => {
      const portfolio = getNearestPortfolioDate(
        value.date.format("YYYY-MM-DD")
      );
      if (portfolio) {
        portfolioValues.push({
          id: value.id,
          label: value.label,
          date: value.date,
          startPortfolio: portfolio,
          endPortfolio: currentPortfolio,
        });
      }
    });

    [1, 2, 3, 4].forEach((value) => {
      const year = moment(lastDate).subtract(value, "years").year();
      const startDate = moment().day(1).month("Jan").year(year);

      const startPortfolio = getNearestPortfolioDate(
        startDate.format("YYYY-MM-DD")
      );
      const endPortfolio = getNearestPortfolioDate(
        moment().year(year).month("Dec").day(31).format("YYYY-MM-DD")
      );

      if (startPortfolio && endPortfolio) {
        portfolioValues.push({
          id: `FY ${year}`,
          label: `Jan - Dec ${year}`,
          date: startDate,
          startPortfolio,
          endPortfolio,
        });
      }
    });

    const data = portfolioValues
      .filter((value) => value.endPortfolio.date !== value.startPortfolio.date)
      .sort((a, b) => b.date.valueOf() - a.date.valueOf())
      .map((value) => {
        const startPnl =
          value.startPortfolio.value - value.startPortfolio.deposits;
        const endPnl = value.endPortfolio.value - value.endPortfolio.deposits;

        const changeValue = endPnl - startPnl;
        const changeRatio =
          (endPnl / value.endPortfolio.deposits -
            startPnl / value.startPortfolio.deposits) *
          100;

        return {
          id: value.id,
          label: value.label,
          date: value.date.format(DATE_DISPLAY_FORMAT),
          startDate: moment(value.startPortfolio.date).format(
            DATE_DISPLAY_FORMAT
          ),
          endDate: moment(value.endPortfolio.date).format(DATE_DISPLAY_FORMAT),
          startPnl,
          endPnl,
          changeRatio,
          changeValue,
          color: changeRatio >= 0 ? "text-green-500" : "text-red-500",
        };
      });

    console.debug("PnL change data -- ", data);

    return data;
  }

  const data = getData();
  $: pnl = pnlIndexToShow < data.length ? data[pnlIndexToShow] : data[0];

  function handlePnlClick(pnlIndex: number) {
    pnlIndexToShow = pnlIndex;
  }
</script>

<div class="w-full h-full overflow-scroll">
  <!-- <img src="favicon.png" alt="P/L" width={20} height={20} /> -->

  <h5 class="my-2 text-base font-bold text-center text-gray-500">
    {pnl.label} PnL Change
  </h5>

  <div class="flex flex-col space-y-1 w-full p-2 bg-gray-100 rounded-lg">
    <div class="flex items-center space-x-3">
      <div class="mx-2">
        {#if pnl.changeRatio >= 0}<ArrowUp />{:else}<ArrowDown />{/if}
      </div>

      <div class={pnl.color}>
        <div class="text-base font-medium">{pnl.changeRatio.toFixed(2)}%</div>
        <div class="text-sm">
          {#if privateMode}
            $--
          {:else}
            {pnl.changeValue >= 0 ? "" : "-"}${Math.abs(
              pnl.changeValue
            ).toFixed(2)}
          {/if}
        </div>
      </div>
    </div>

    <div class="border-gray-300 border-t px-1" />
    <div class="flex-col text-sm px-1 space-y-1">
      <DateValue date={pnl.startDate} value={pnl.startPnl} {privateMode} />
      <DateValue date={pnl.endDate} value={pnl.endPnl} {privateMode} />
    </div>
  </div>

  <div class="w-full my-2 px-1">
    <DateRanges
      labels={data.map((value) => value.id)}
      onClick={handlePnlClick}
      selectedIndex={pnlIndexToShow}
    />
  </div>
</div>
