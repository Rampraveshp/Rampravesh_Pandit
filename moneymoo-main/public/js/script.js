document.addEventListener("DOMContentLoaded", () => {
  const navbarBurger = document.getElementById("navbarBurger");
  const navbarMenu = document.getElementById("navbarMenu");
  navbarBurger.addEventListener("click", () => {
    navbarBurger.classList.toggle("is-active");
    navbarMenu.classList.toggle("is-active");
  });
});

document.querySelectorAll(".unrealized-pl-data").forEach((data) => {
  const number = parseFloat(data.textContent.replace(/,/g, ""));
  if (number > 0) {
    data.classList.add("unrealized-pl-profit-color");
  } else if (number < 0) {
    data.classList.add("unrealized-pl-loss-color");
  }
});
