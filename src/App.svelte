<script lang="ts">
  import { Addon } from "@wealthica/wealthica.js/index";
  import moment from "moment";
  import "src/styles/tailwind.pcss";
  import {
    parseCurrencyReponse,
    parseInstitutionsResponse,
    parsePortfolioResponse,
    parseTransactionsResponse,
  } from "./api";
  import Loading from "./components/Loading.svelte";
  import PnLWidget from "./components/PnLWidget.svelte";
  import { TRANSACTIONS_FROM_DATE } from "./constants";
  import { CURRENCIES_API_RESPONSE } from "./mocks/currencies";
  import { INSTITUTIONS_DATA } from "./mocks/institutions";
  import { PORTFOLIO_API_RESPONSE } from "./mocks/portfolio";
  import { TRANSACTIONS_API_RESPONSE } from "./mocks/transactions";
  import type { Portfolio } from "./types";

  let currencyCache: { [K: string]: string };
  let addon: any;
  let loading: boolean = true;
  let portfolios: Portfolio[] = [];
  let privateMode: boolean;
  let timer;

  try {
    addon = new Addon({});
    addon.on("init", (options) => {
      console.debug("Addon initialization", options);
      debounced(options);
    });

    addon.on("reload", () => {
      // Start reloading
      console.debug("Reload invoked!");
    });

    addon.on("update", (options) => {
      // Update according to the received options
      console.debug("Addon update - options: ", options);
      debounced(options);
    });
  } catch (error) {
    console.warn("Falied to load the addon -- ", error);
    loadStaticPortfolioData();
  }

  const debounced = (options) => {
    clearTimeout(timer);
    timer = setTimeout(() => load(options), 100);
  };

  async function load(options) {
    privateMode = options.privateMode;
    loading = true;
    const [
      currencyData,
      portfolioData,
      accounts,
      transactions,
    ] = await Promise.all([
      loadCurrenciesCache(),
      loadPortfolioData(options),
      loadInstitutionsData(options),
      loadTransactions(options),
    ]);
    currencyCache = currencyData ? currencyData : currencyCache;
    computePortfolios(portfolioData, transactions, accounts, currencyData);
    loading = false;
    console.debug("Done with loading data", { portfolios });
  }

  function loadStaticPortfolioData() {
    computePortfolios(
      parsePortfolioResponse(PORTFOLIO_API_RESPONSE),
      TRANSACTIONS_API_RESPONSE,
      parseInstitutionsResponse(INSTITUTIONS_DATA),
      parseCurrencyReponse(CURRENCIES_API_RESPONSE)
    );
    loading = false;
    console.debug("Static Dev State:", { portfolios });
  }

  function computePortfolios(
    portfolioData,
    transactions,
    accounts,
    currencyData
  ) {
    const transactionsByDate = parseTransactionsResponse(
      transactions,
      currencyData,
      accounts
    );

    const portfolioPerDay = Object.keys(portfolioData).reduce((hash, date) => {
      const data = transactionsByDate[date] || {};
      hash[date] = {
        value: portfolioData[date],
        deposit: data.deposit || 0,
        withdrawal: data.withdrawal || 0,
        income: data.income || 0,
        interest: data.interest || 0,
      };
      return hash;
    }, {});

    const _portfolios: Portfolio[] = [];

    const sortedDates = Object.keys(portfolioPerDay).sort();
    let deposits = Object.keys(transactionsByDate)
      .filter((date) => date < sortedDates[0])
      .reduce((totalDeposits, date) => {
        const transaction = transactionsByDate[date];
        totalDeposits += transaction.deposit - transaction.withdrawal;
        return totalDeposits;
      }, 0);

    sortedDates.forEach((date) => {
      const portfolio = portfolioPerDay[date];
      deposits += portfolio.deposit - portfolio.withdrawal;
      if (moment(date).isoWeekday() <= 5) {
        _portfolios.push({
          date: date,
          value: portfolio.value,
          deposits: deposits,
        });
      }
    });

    portfolios = _portfolios;
  }

  function loadCurrenciesCache() {
    if (currencyCache) {
      return null;
    }

    console.debug("Loading currencies data.");
    return addon
      .request({
        method: "GET",
        endpoint: "currencies/usd/history",
        query: {
          base: "cad",
        },
      })
      .then((response) => parseCurrencyReponse(response))
      .catch((error) => {
        console.error("Failed to load currency data.", error);
      });
  }

  function loadPortfolioData(options) {
    console.debug("Loading portfolio data.");
    const query = {
      from: options.dateRangeFilter && options.dateRangeFilter[0],
      to: options.dateRangeFilter && options.dateRangeFilter[1],
      groups: options.groupsFilter,
      institutions: options.institutionsFilter,
      investments:
        options.investmentsFilter === "all" ? null : options.investmentsFilter,
    };
    return addon
      .request({
        query,
        method: "GET",
        endpoint: "portfolio",
      })
      .then((response) => parsePortfolioResponse(response))
      .catch((error) => {
        console.error("Failed to load portfolio data.", error);
      });
  }

  function loadInstitutionsData(options) {
    console.debug("Loading institutions data..");
    const query = {
      assets: true,
      groups: options.groupsFilter,
      institutions: options.institutionsFilter,
      investments:
        options.investmentsFilter === "all" ? null : options.investmentsFilter,
    };
    return addon
      .request({
        query,
        method: "GET",
        endpoint: "institutions",
      })
      .then((response) =>
        parseInstitutionsResponse(
          response,
          options.groupsFilter ? options.groupsFilter.split(",") : [],
          options.institutionsFilter
            ? options.institutionsFilter.split(",")
            : []
        )
      )
      .catch((error) => {
        console.error("Failed to load institutions data.", error);
      });
  }

  function loadTransactions(options) {
    console.debug("Loading transactions data.");
    const fromDate = options.dateRangeFilter && options.dateRangeFilter[0];
    const query = {
      from:
        fromDate && fromDate < TRANSACTIONS_FROM_DATE
          ? fromDate
          : TRANSACTIONS_FROM_DATE,
      groups: options.groupsFilter,
      institutions: options.institutionsFilter,
      investments:
        options.investmentsFilter === "all" ? null : options.investmentsFilter,
    };
    return addon
      .request({
        query,
        method: "GET",
        endpoint: "transactions",
      })
      .then((response) => response)
      .catch((error) => {
        console.error("Failed to load transactions data.", error);
      });
  }

  console.log("rendering app", { portfolios, loading });
</script>

<main>
  <div class="max-w-xs max-h-96 w-full h-full m-auto">
    {#if loading}
      <Loading />
    {:else if portfolios}
      <PnLWidget {portfolios} {privateMode} />
    {:else}
      <p>No Data</p>
    {/if}
  </div>
</main>
