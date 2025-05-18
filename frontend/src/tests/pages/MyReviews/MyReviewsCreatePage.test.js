import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyReviewsCreatePage from "main/pages/MyReviews/MyReviewsCreatePage";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { ToastContainer } from "react-toastify";

// Mock useNavigate and useSearchParams
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams("itemId=42&itemName=Spaghetti")],
  };
});

describe("MyReviewsCreatePage tests", () => {
  const renderPage = () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyReviewsCreatePage />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  test("renders heading with item name", () => {
    renderPage();
    expect(screen.getByText("Review: Spaghetti")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Spaghetti")).toBeDisabled();
  });

  test("submits form and navigates on success", async () => {
    const axiosMock = new AxiosMockAdapter(axios);
    axiosMock.onPost("/api/reviews/post").reply(200, {});

    renderPage();

    fireEvent.change(screen.getByLabelText(/comments/i), {
      target: { value: "Pretty good!" },
    });
    fireEvent.change(screen.getByLabelText(/stars/i), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: "2024-04-01T12:00" },
    });

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => {
      expect(axiosMock.history.post.length).toBe(1);
      expect(mockNavigate).toHaveBeenCalledWith("/myreviews");
    });

    expect(await screen.findByText(/review submitted for spaghetti/i)).toBeInTheDocument();
  });

  test("shows error toast on failed submit", async () => {
    const axiosMock = new AxiosMockAdapter(axios);
    axiosMock.onPost("/api/reviews/post").reply(500, {
      error: "Internal Server Error",
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    expect(await screen.findByText(/error submitting review/i)).toBeInTheDocument();
  });

  test("submits default values if user makes no changes", async () => {
    const axiosMock = new AxiosMockAdapter(axios);
    axiosMock.onPost("/api/reviews/post").reply(200, {});

    renderPage();

    const dateValue = screen.getByLabelText(/date and time/i).value;

    fireEvent.click(screen.getByRole("button", { name: /submit review/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/myreviews");
    });

    const lastRequest = axiosMock.history.post[0];
    const params = new URLSearchParams(lastRequest.params);

    expect(params.get("itemId")).toBe("42");
    expect(params.get("reviewerComments")).toBe("");
    expect(params.get("itemsStars")).toBe("5");
    expect(params.get("dateItemServed")).toBe(dateValue);
  });
});
