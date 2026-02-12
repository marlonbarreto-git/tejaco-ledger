import { getExchangeRate, convertAmount, formatCurrency } from "../exchange-rates";
import { Currency } from "../types";

describe("getExchangeRate", () => {
  it("returns 1 for same currency", () => {
    const currencies: Currency[] = ["USD", "SGD", "PHP", "MYR", "IDR", "THB", "VND"];
    for (const c of currencies) {
      expect(getExchangeRate(c, c)).toBe(1);
    }
  });

  it("returns a positive rate for different currencies", () => {
    expect(getExchangeRate("SGD", "USD")).toBeGreaterThan(0);
    expect(getExchangeRate("USD", "PHP")).toBeGreaterThan(0);
    expect(getExchangeRate("MYR", "THB")).toBeGreaterThan(0);
  });

  it("inverse rate is reciprocal", () => {
    const rate = getExchangeRate("SGD", "USD");
    const inverseRate = getExchangeRate("USD", "SGD");
    expect(rate * inverseRate).toBeCloseTo(1, 5);
  });

  it("applies date-based rate variation", () => {
    const rateNoDate = getExchangeRate("SGD", "USD");
    const rateJan = getExchangeRate("SGD", "USD", "2025-01-15");
    const rateFeb = getExchangeRate("SGD", "USD", "2025-02-15");

    // Jan variation is 1.0, so should match no-date rate
    expect(rateJan).toBe(rateNoDate);
    // Feb has a different variation (1.005), but since both from and to
    // are multiplied by the same variation, the ratio stays the same
    // (variation cancels out in from/to division)
    expect(rateFeb).toBeCloseTo(rateNoDate, 5);
  });

  it("returns base rate for unknown month", () => {
    const rate = getExchangeRate("SGD", "USD", "2024-12-15");
    const baseRate = getExchangeRate("SGD", "USD");
    expect(rate).toBe(baseRate);
  });
});

describe("convertAmount", () => {
  it("returns same amount for same currency", () => {
    expect(convertAmount(100, "SGD", "SGD")).toBe(100);
    expect(convertAmount(0, "USD", "USD")).toBe(0);
  });

  it("converts between currencies correctly", () => {
    const result = convertAmount(100, "SGD", "USD");
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe("number");
  });

  it("rounds to 2 decimal places", () => {
    const result = convertAmount(100, "SGD", "USD");
    const decimals = result.toString().split(".")[1];
    if (decimals) {
      expect(decimals.length).toBeLessThanOrEqual(2);
    }
  });

  it("converts zero amount to zero", () => {
    expect(convertAmount(0, "SGD", "PHP")).toBe(0);
  });

  it("roundtrip conversion is approximately equal", () => {
    const original = 1000;
    const converted = convertAmount(original, "SGD", "USD");
    const backConverted = convertAmount(converted, "USD", "SGD");
    expect(backConverted).toBeCloseTo(original, 0);
  });
});

describe("formatCurrency", () => {
  it("formats SGD with S$ symbol", () => {
    expect(formatCurrency(1234.56, "SGD")).toBe("S$1,234.56");
  });

  it("formats USD with $ symbol", () => {
    expect(formatCurrency(1000, "USD")).toBe("$1,000.00");
  });

  it("formats PHP with peso symbol", () => {
    expect(formatCurrency(50000, "PHP")).toContain("\u20B1");
  });

  it("formats MYR with RM symbol", () => {
    expect(formatCurrency(2500.5, "MYR")).toBe("RM2,500.50");
  });

  it("formats IDR with 0 decimal places", () => {
    const formatted = formatCurrency(1500000, "IDR");
    expect(formatted).toBe("Rp1,500,000");
    expect(formatted).not.toContain(".");
  });

  it("formats VND with 0 decimal places", () => {
    const formatted = formatCurrency(3500000, "VND");
    expect(formatted).not.toContain(".");
  });

  it("formats THB with baht symbol", () => {
    expect(formatCurrency(15000, "THB")).toContain("\u0E3F");
  });

  it("formats zero amounts", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00");
  });
});
