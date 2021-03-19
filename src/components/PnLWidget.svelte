<script lang="ts">
  import Highcharts from "highcharts";
  import moment, { Moment } from "moment";
  import { afterUpdate } from "svelte";
  import type { Portfolio } from "../types";
  import { formatCurrency, getPreviousWeekday } from "../utils";

  export let portfolios: Portfolio[] = [];
  export let privateMode: boolean;

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
          color: changeRatio >= 0 ? "green" : "red",
        };
      });

    console.debug("PnL change data -- ", data);

    const series: Highcharts.SeriesBarOptions[] = [
      {
        name: "PnL Change %",
        type: "bar",
        data: data.map((value) => ({
          key: value.id,
          name: value.id,
          label: value.label,
          y: value.changeRatio,

          startDate: value.startDate,
          endDate: value.endDate,
          startPnl: !privateMode ? formatCurrency(value.startPnl, 2) : "-",
          endPnl: !privateMode ? formatCurrency(value.endPnl, 2) : "-",
          changeValue: !privateMode
            ? `$${formatCurrency(value.changeValue, 1)}`
            : "-",
        })),
        point: {
          events: {
            // mouseOver: (e: any) => {
            //   trackEvent("mouse-over-point", {
            //     chart: "pnl-change-over-periods",
            //     name: e && e.target ? e.target.key : null,
            //   });
            // },
          },
        },
        tooltip: {
          headerFormat: "",
          pointFormat: `<b style="font-size: 13px;">{point.label} ({point.key})</b><br /><b style="color: {point.color};font-size: 14px;">{point.y:.1f}% ({point.changeValue})</b><br /><hr />
            P/L on {point.startDate}: <b>{point.startPnl}</b><br />
            P/L on {point.endDate}: <b>{point.endPnl}</b><br />`,
        },
        dataLabels: {
          enabled: true,
          format: "{point.y:.1f}% ({point.changeValue})",
        },
        showInLegend: false,
      },
    ];

    return series;
  }

  const getOptions = (): Highcharts.Options => {
    return {
      series: getData(),

      tooltip: {
        outside: true,

        useHTML: true,
        backgroundColor: "#FFF",
        style: {
          color: "#1F2A33",
        },
      },

      title: {
        text: undefined,
      },
      // subtitle: {
      //   text:
      //     "This chart shows how your portfolio had performed in multiple time slices. This chart is inspired based on YoY growth. You might want to see the change in your P/L in the last few days, weeks, months, years etc.,",
      //   style: {
      //     color: "#1F2A33",
      //   },
      // },
      xAxis: {
        type: "category",
        labels: {
          // rotation: -45,
          style: {
            fontSize: "13px",
            fontFamily: "Verdana, sans-serif",
          },
        },
      },

      yAxis: {
        labels: {
          enabled: !privateMode,
        },
        title: {
          text: "P/L Change (%)",
        },
      },

      plotOptions: {
        bar: {
          zones: [
            {
              value: -0.00000001,
              color: "#FF897C",
            },
            {
              color: "#84C341",
            },
          ],
        },
      },
    };
  };

  let chart;
  afterUpdate(() => {
    setTimeout(() => {
      Highcharts.chart(chart, getOptions());
    }, 50);
  });
</script>

<div class="w-full h-full overflow-scroll">
  <div class="flex items-center justify-center">
    <img src="favicon.png" alt="P/L" width={30} height={30} />
    <h5 class="font-bold px-1 text-center">
      P/L Change Over Multiple Time Periods
    </h5>
  </div>
  <div bind:this={chart}>
    <slot />
  </div>
</div>
