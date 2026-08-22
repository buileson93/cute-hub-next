import { describe, it, expect } from "vitest";

interface CanvasData {
  business_problem: string | null;
  business_outcomes: string | null;
  users_customers: string | null;
  user_benefits: string | null;
  solution_ideas: string | null;
  hypotheses: string | null;
  riskiest_assumptions: string | null;
  first_steps_experiments: string | null;
}

describe("Lean UX Canvas Logic", () => {
  it("should initialize with empty fields", () => {
    const initialForm: CanvasData = {
      business_problem: "",
      business_outcomes: "",
      users_customers: "",
      user_benefits: "",
      solution_ideas: "",
      hypotheses: "",
      riskiest_assumptions: "",
      first_steps_experiments: "",
    };

    expect(initialForm.business_problem).toBe("");
  });

  it("should handle updates to individual fields", () => {
    let form: CanvasData = {
      business_problem: "",
      business_outcomes: "",
      users_customers: "",
      user_benefits: "",
      solution_ideas: "",
      hypotheses: "",
      riskiest_assumptions: "",
      first_steps_experiments: "",
    };

    form = { ...form, business_problem: "New Problem" };
    expect(form.business_problem).toBe("New Problem");
    expect(form.business_outcomes).toBe("");
  });
});
