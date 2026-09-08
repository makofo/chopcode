// Единый источник правды по тарифам — и для API, и для расчётов экономии.
// Меняешь цену здесь — пересчёт экономии происходит автоматически.

export const MONTHLY_PRICE = 305;
export const FREE_VOICE_LIMIT = 2; // бесплатных голосовых на аккаунт, ОДИН раз, не в день

export const PLANS = [
  {
    id: "monthly",
    title: "1 месяц",
    months: 1,
    price: 305,
    oldPrice: null,
  },
  {
    id: "half_year",
    title: "6 месяцев",
    months: 6,
    price: 1350,
  },
  {
    id: "year",
    title: "12 месяцев",
    months: 12,
    price: 2600,
  },
  {
    id: "lifetime",
    title: "Навсегда",
    months: null, // условно приравниваем к 24 мес для расчёта "обычной" цены
    equivalentMonths: 24,
    price: 5000,
    isLifetime: true,
  },
];

export function getPlansWithSavings() {
  return PLANS.map((plan) => {
    if (plan.id === "monthly") {
      return { ...plan, oldPrice: null, save: 0, savePercent: 0 };
    }
    const months = plan.equivalentMonths ?? plan.months;
    const oldPrice = MONTHLY_PRICE * months;
    const save = oldPrice - plan.price;
    const savePercent = Math.round((save / oldPrice) * 100);
    return { ...plan, oldPrice, save, savePercent };
  });
}

export function getPlanById(id) {
  return PLANS.find((p) => p.id === id);
}
