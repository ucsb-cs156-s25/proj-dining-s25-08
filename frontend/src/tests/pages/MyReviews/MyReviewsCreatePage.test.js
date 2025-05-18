import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyReviewsCreatePage from "main/pages/MyReviews/MyReviewsCreatePage";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { ToastContainer } from "react-toastify";

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
  test("submits form and navigates on success", async () => {
    const axiosMock = new AxiosMockAdapter(axios);
    axiosMock.onPost("/api/reviews/post").reply(200, {});

    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyReviewsCreatePage />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/comments/i), {
      target: { value: "Pretty good!" },
    });
    fireEvent.change(screen.getByLabelText(/stars/i), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: "2024-04-01T12:00" },
    });

    fireEvent.click(screen.getByText(/submit review/i));

    await waitFor(() => {
      expect(axiosMock.history.post.length).toBe(1);
      expect(mockNavigate).toHaveBeenCalledWith("/myreviews");
    });

    expect(await screen.findByText(/review submitted for spaghetti/i)).toBeInTheDocument();
  });

  test("gracefully handles missing query params", async () => {
    jest.resetModules();
    jest.doMock("react-router-dom", () => {
      const original = jest.requireActual("react-router-dom");
      return {
        ...original,
        useNavigate: () => jest.fn(),
        useSearchParams: () => [new URLSearchParams("")],
      };
    });

    const MyReviewsCreatePageNoParams = require("main/pages/MyReviews/MyReviewsCreatePage").default;

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyReviewsCreatePageNoParams />
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/review:/i)).toBeInTheDocument();
  });
});
