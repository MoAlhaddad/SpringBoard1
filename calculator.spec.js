describe("Calculate monthly payments", () => {
    const monthlyPayment = calculateMonthlyPayment({
      amount: 225000,
      rate: 3.25,
      years: 30,
    });
  
    it("Should return a string", () => {
      expect(monthlyPayment).toBeInstanceOf(String);
    });
  
    it("Should calculate the monthly rate correctly", () => {
      expect(monthlyPayment).toEqual("979.21");
    });
  
    it("Should return a result with 2 decimal places", () => {
      const decimalPlaces = monthlyPayment.slice(monthlyPayment.indexOf(".") + 1);
      expect(decimalPlaces.length).toEqual(2);
    });
  });