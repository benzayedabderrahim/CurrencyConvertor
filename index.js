const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const fromAmount = document.getElementById('fromAmount');
const toAmount = document.getElementById('toAmount');
const rateInfo = document.getElementById('rateInfo');
const lastUpdated = document.getElementById('lastUpdated');
const swapBtn = document.getElementById('swapBtn');
const loader = document.getElementById('loader');

let exchangeRates = {};
let lastFetchTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

const API_KEY = 'e3afd566e7b761125e620727'; // Your ExchangeRate-API key
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/`;

function showLoader() {
    loader.style.display = 'block';
}

function hideLoader() {
    loader.style.display = 'none';
}

function updateTime() {
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    lastFetchTime = now.getTime();
}

async function fetchExchangeRates(baseCurrency) {
    showLoader();
    try {
        const response = await fetch(`${BASE_URL}${baseCurrency}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        if (data.result === 'success') {
            exchangeRates = data.conversion_rates;
            localStorage.setItem('exchangeRates', JSON.stringify({
                rates: exchangeRates,
                timestamp: Date.now(),
                base: baseCurrency
            }));
            convertCurrency();
            updateTime();
        } else {
            throw new Error(data['error-type'] || 'Failed to fetch rates');
        }
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
        const cachedData = localStorage.getItem('exchangeRates');
        if (cachedData) {
            const { rates, timestamp, base } = JSON.parse(cachedData);
            if (base === fromCurrency.value && Date.now() - timestamp < CACHE_DURATION * 24) {
                exchangeRates = rates;
                rateInfo.textContent = "Using cached rates (couldn't fetch latest)";
                convertCurrency();
                updateTime();
                return;
            }
        }
        rateInfo.textContent = "Error fetching rates. Please try again later.";
    } finally {
        hideLoader();
    }
}

function convertCurrency() {
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const amount = parseFloat(fromAmount.value);
    
    if (isNaN(amount)) {
        toAmount.value = '';
        rateInfo.textContent = 'Please enter a valid amount';
        return;
    }
    
    if (amount < 0) {
        toAmount.value = '';
        rateInfo.textContent = 'Amount must be positive';
        return;
    }
    
    // Check if we need to fetch new rates
    const cachedData = localStorage.getItem('exchangeRates');
    const shouldFetch = !cachedData || 
                      JSON.parse(cachedData).base !== from || 
                      Date.now() - lastFetchTime > CACHE_DURATION;
    
    if (shouldFetch || !exchangeRates[to]) {
        fetchExchangeRates(from);
        return;
    }
    
    const rate = exchangeRates[to];
    const convertedAmount = amount * rate;
    
    toAmount.value = convertedAmount.toFixed(2);
    rateInfo.textContent = `1 ${from} = ${rate.toFixed(6)} ${to}`;
}

// Swap currencies
function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    fetchExchangeRates(fromCurrency.value);
}

// Event listeners
fromAmount.addEventListener('input', convertCurrency);
fromCurrency.addEventListener('change', () => fetchExchangeRates(fromCurrency.value));
toCurrency.addEventListener('change', convertCurrency);
swapBtn.addEventListener('click', swapCurrencies);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Try to load cached rates first
    const cachedData = localStorage.getItem('exchangeRates');
    if (cachedData) {
        const { rates, timestamp, base } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION * 24) { // 24 hours cache
            exchangeRates = rates;
            fromCurrency.value = base;
            convertCurrency();
            lastFetchTime = timestamp;
            const lastUpdate = new Date(timestamp);
            lastUpdated.textContent = `Last updated: ${lastUpdate.toLocaleTimeString()} (cached)`;
            return;
        }
    }
    fetchExchangeRates(fromCurrency.value);
});