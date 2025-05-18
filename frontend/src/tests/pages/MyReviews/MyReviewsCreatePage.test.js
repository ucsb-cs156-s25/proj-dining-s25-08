import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ToastContainer } from "react-toastify";
import MyReviewsCreatePage from "main/pages/MyReviews/MyReviewsCreatePage";
import AxiosMockAdapter from "axios-mock-adapter";
import axios from "axios";

jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return {
    ...original,
    useNavigate: jest.fn(),
    useSearchParams: () => [
      new URLSearchParams("itemId=42&itemName=Spaghetti"),
    ],
  };
});

describe("MyReviewsCreatePage - full coverage tests", () => {
  const queryClient = new QueryClient();
  let axiosMock;

  beforeEach(() => {
    axiosMock = new AxiosMockAdapter(axios);
    axiosMock.reset();
    axiosMock.onGet("/api/currentUser").reply(200, {
      root: {
        user: { email: "test@example.com" },
        rolesList: [],
      },
    });
    axiosMock.onGet("/api/systemInfo").reply(200, {});
  });

  test("submits form and navigates on success", async () => {
    axiosMock.onPost("/api/reviews/post").reply(200, {});

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyReviewsCreatePage />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>,
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
    });

    const postedParams = axiosMock.history.post[0].params;
    expect(postedParams).toEqual({
      itemId: "42",
      reviewerComments: "Pretty good!",
      itemsStars: 4,
      dateItemServed: "2024-04-01T12:00",
    });

    expect(
      await screen.findByText(/review submitted for spaghetti/i),
    ).toBeInTheDocument();
  });

  test("gracefully handles missing query params", async () => {
    jest.mock("react-router-dom", () => {
      const original = jest.requireActual("react-router-dom");
      return {
        ...original,
        useNavigate: () => jest.fn(),
        useSearchParams: () => [new URLSearchParams("")],
      };
    });

    // Re-import after mock
    const { default: MyReviewsCreatePageLocal } = await import(
      "main/pages/MyReviews/MyReviewsCreatePage"
    );

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyReviewsCreatePageLocal />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: /review/i }),
    ).toBeInTheDocument();
  });

  test("shows error toast on failed post", async () => {
    axiosMock.onPost("/api/reviews/post").reply(500, {
      error: "Something went wrong",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <MyReviewsCreatePage />
          <ToastContainer />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    fireEvent.change(screen.getByLabelText(/comments/i), {
      target: { value: "Bad!" },
    });
    fireEvent.change(screen.getByLabelText(/stars/i), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: "2024-04-01T12:00" },
    });

    fireEvent.click(screen.getByText(/submit review/i));

    expect(
      await screen.findByText(/error submitting review: something went wrong/i),
    ).toBeInTheDocument();
  });
});
