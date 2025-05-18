import { render, screen, fireEvent } from "@testing-library/react";
import ReviewForm from "main/components/MyReviews/ReviewForm";

describe("ReviewForm tests", () => {
  const setup = () => {
    const mockSubmit = jest.fn();
    render(
      <ReviewForm initialItemName="Spaghetti" submitAction={mockSubmit} />,
    );
    return { mockSubmit };
  };

  test("renders all form fields with default values", () => {
    setup();

    const itemNameField = screen.getByLabelText(/item name/i);
    const commentsField = screen.getByLabelText(/comments/i);
    const starsField = screen.getByLabelText(/stars/i);
    const dateField = screen.getByLabelText(/date and time/i);

    expect(itemNameField).toHaveValue("Spaghetti");
    expect(itemNameField).toBeDisabled();

    expect(commentsField).toHaveValue("");
    expect(starsField).toHaveValue("5");

    // ISO 8601 string check (should be like 2025-05-17T21:05)
    expect(dateField.value).toMatch(/T\d{2}:\d{2}$/);
  });

  test("submits form with filled values", () => {
    const { mockSubmit } = setup();

    fireEvent.change(screen.getByLabelText(/comments/i), {
      target: { value: "Yummy!" },
    });
    fireEvent.change(screen.getByLabelText(/stars/i), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: "2024-04-01T10:00" },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(mockSubmit).toHaveBeenCalledWith({
      reviewerComments: "Yummy!",
      itemsStars: 4,
      dateItemServed: "2024-04-01T10:00",
    });
  });

  test("stars field handles string to number conversion", () => {
    const { mockSubmit } = setup();

    fireEvent.change(screen.getByLabelText(/stars/i), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ itemsStars: 3 }),
    );
  });

  test("submitting without changing fields uses default values", () => {
    const { mockSubmit } = setup();

    const defaultDate = screen.getByLabelText(/date and time/i).value;
    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(mockSubmit).toHaveBeenCalledWith({
      reviewerComments: "",
      itemsStars: 5,
      dateItemServed: defaultDate,
    });
  });
});
