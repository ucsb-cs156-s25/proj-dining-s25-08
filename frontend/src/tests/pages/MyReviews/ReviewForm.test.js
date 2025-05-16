import { render, screen, fireEvent } from "@testing-library/react";
import ReviewForm from "main/components/MyReviews/ReviewForm";

describe("ReviewForm tests", () => {
  test("renders form fields and calls submitAction", () => {
    const mockSubmit = jest.fn();

    render(<ReviewForm initialItemName="Spaghetti" submitAction={mockSubmit} />);

    // Check that the disabled item name field is filled
    expect(screen.getByLabelText(/item name/i)).toHaveValue("Spaghetti");

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/comments/i), {
      target: { value: "Yummy!" },
    });
    fireEvent.change(screen.getByLabelText(/stars/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: "2024-04-01T10:00" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    // Verify submission
    expect(mockSubmit).toHaveBeenCalledWith({
      reviewerComments: "Yummy!",
      itemsStars: 5,
      dateItemServed: "2024-04-01T10:00",
    });
  });
});
