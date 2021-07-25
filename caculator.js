let form;
let amount;
let years;
let rate;

window.addEventListener("DOMContentLoaded", function () {
  form = document.getElementById("calc-form");
  amount = document.getElementById("loan-amount");
  years = document.getElementById("loan-years");
  rate = document.getElementById("loan-rate");

  if (form) {
    setupInitialValues();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      update();
    });
  }
});

function getCurrentUIValues() {
  return {
    amount: +amount.value,
    years: +years.value,
    rate: +rate.value,
  };
}

// Get the inputs from the DOM.
// Put some default values in the inputs
// Call a function to calculate the current monthly payment
function setupInitialValues() {
  amount.value = 10000;
  years.value = 5;
  rate.value = 4;
  update();
}

// Get the current values from the UI
// Update the monthly payment
function update() {
  const monthlyPayment = calculateMonthlyPayment(getCurrentUIValues());
  updateMonthly(monthlyPayment);
}

// Given an object of values (a value has amount, years and rate ),
// calculate the monthly payment.  The output should be a string
// that always has 2 decimal places.
// i = periodic interest rate (in our case yearly rate ÷ 12)
// n = total number of payments (years × 12)
function calculateMonthlyPayment(values) {
  const { amount, years, rate } = values;
  const i = rate / 100 / 12;
  const n = years * 12;
  return toFixed((amount * i) / (1 - Math.pow(1 + i, -n)), 2);
}

// Given a string representing the monthly payment value,
// update the UI to show the value.
function updateMonthly(monthly) {
  const payment = document.getElementById("monthly-payment");
  payment.innerText = monthly;
}

function toFixed(number, numOfDec) {
  numOfDec = Math.pow(10, numOfDec > 0 ? numOfDec : 0);
  const fixed = parseInt(number * numOfDec) / numOfDec;
  return fixed.toString();
}