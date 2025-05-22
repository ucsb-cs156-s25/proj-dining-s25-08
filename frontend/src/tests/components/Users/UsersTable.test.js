import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import usersFixtures from "fixtures/usersFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import UsersTable from "main/components/Users/UsersTable";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import mockConsole from "jest-mock-console";

const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate
}));

describe("UserTable tests", () => {
  const queryClient = new QueryClient();
  const axiosMock = new AxiosMockAdapter(axios);

  beforeEach(() => {
    axiosMock.reset();
    queryClient.clear();
  });

  test("renders without crashing for empty table with user not logged in", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UsersTable users={[]} currentUser={null} />
        </MemoryRouter>
      </QueryClientProvider>
    );
  });

  test("renders without crashing for empty table for regular user", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UsersTable users={[]} currentUser={currentUserFixtures.userOnly} />
        </MemoryRouter>
      </QueryClientProvider>
    );
  });

  test("renders without crashing for empty table for admin", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UsersTable users={[]} currentUser={currentUserFixtures.adminUser} />
        </MemoryRouter>
      </QueryClientProvider>
    );
  });

  test("Has the expected column headers and content for adminUser", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UsersTable users={usersFixtures.threeUsers} currentUser={currentUserFixtures.adminUser} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const expectedHeaders = [
      "id",
      "First Name",
      "Last Name",
      "Email",
      "Admin",
      "Moderator",
      "Alias",
      "Proposed Alias",
      "Toggle Admin",
      "Toggle Moderator"
    ];
    const expectedFields = [
      "id",
      "givenName",
      "familyName",
      "email",
      "admin",
      "moderator",
      "alias",
      "proposedAlias",
    ];
    const testId = "UsersTable";

    expectedHeaders.forEach((headerText) => {
      const header = screen.getByText(headerText);
      expect(header).toBeInTheDocument();
    });

    expectedFields.forEach((field) => {
      const header = screen.getByTestId(`${testId}-cell-row-0-col-${field}`);
      expect(header).toBeInTheDocument();
    });

    expect(screen.getByTestId(`${testId}-cell-row-0-col-id`)).toHaveTextContent("1");
    expect(screen.getByTestId(`${testId}-cell-row-0-col-admin`)).toHaveTextContent("true");
    expect(screen.getByTestId(`${testId}-cell-row-0-col-moderator`)).toHaveTextContent("true");
    expect(screen.getByTestId(`${testId}-cell-row-1-col-id`)).toHaveTextContent("2");
    expect(screen.getByTestId(`${testId}-cell-row-1-col-admin`)).toHaveTextContent("false");
  });

  test("Has the expected column headers and content for regular user", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UsersTable users={usersFixtures.threeUsers} currentUser={currentUserFixtures.userOnly} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const expectedHeaders = [
      "id",
      "First Name",
      "Last Name",
      "Email",
      "Admin",
      "Moderator",
      "Alias",
      "Proposed Alias"
    ];
    const testId = "UsersTable";

    expectedHeaders.forEach((headerText) => {
      const header = screen.getByText(headerText);
      expect(header).toBeInTheDocument();
    });

    expect(screen.queryByText("Toggle Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Toggle Moderator")).not.toBeInTheDocument();
  });

  test("Status column appends approval date only for approved users with a valid date", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UsersTable
            users={[
              { id: 1, status: "Approved", dateApproved: "2024-11-01" },
              { id: 2, status: "Approved", dateApproved: null },
              { id: 3, status: "Rejected", dateApproved: "2024-11-01" },
              { id: 4, status: "Awaiting Moderation", dateApproved: null },
            ]}
            currentUser={currentUserFixtures.adminUser}
          />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("Approved on 10/31/2024")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("Awaiting Moderation")).toBeInTheDocument();
  });

  test("Toggle buttons work for admin user and call onSuccess", async () => {
    const onSuccess = jest.fn();
    axiosMock.onPost('/api/admin/users/toggleAdmin').reply(200);
    axiosMock.onPost('/api/admin/users/toggleModerator').reply(200);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UsersTable users={usersFixtures.threeUsers} currentUser={currentUserFixtures.adminUser} onSuccess={onSuccess} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const adminButton = screen.getByTestId(`UsersTable-cell-row-0-col-Toggle Admin-button`);
    expect(adminButton).toBeInTheDocument();
    fireEvent.click(adminButton);

    const moderatorButton = screen.getByTestId(`UsersTable-cell-row-0-col-Toggle Moderator-button`);
    expect(moderatorButton).toBeInTheDocument();
    fireEvent.click(moderatorButton);

    await waitFor(() => {
      expect(axiosMock.history.post.length).toBe(2);
      expect(onSuccess).toHaveBeenCalledTimes(2);
    });

    expect(axiosMock.history.post[0].data).toBe(JSON.stringify({ id: 1 }));
    expect(axiosMock.history.post[1].data).toBe(JSON.stringify({ id: 1 }));
  });

  test("Toggle buttons handle errors correctly", async () => {
    const restoreConsole = mockConsole();
    const onSuccess = jest.fn();

    axiosMock.onPost('/api/admin/users/toggleAdmin').reply(400, {
      message: "Error toggling admin status"
    });
    axiosMock.onPost('/api/admin/users/toggleModerator').reply(400, {
      message: "Error toggling moderator status"
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UsersTable users={usersFixtures.threeUsers} currentUser={currentUserFixtures.adminUser} onSuccess={onSuccess} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    const adminButton = screen.getByTestId(`UsersTable-cell-row-0-col-Toggle Admin-button`);
    expect(adminButton).toBeInTheDocument();
    fireEvent.click(adminButton);

    const moderatorButton = screen.getByTestId(`UsersTable-cell-row-0-col-Toggle Moderator-button`);
    expect(moderatorButton).toBeInTheDocument();
    fireEvent.click(moderatorButton);

    await waitFor(() => {
      expect(axiosMock.history.post.length).toBe(2);
    });

    expect(console.error).toHaveBeenCalledWith(
      "Error toggling admin status:",
      "Error toggling admin status"
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error toggling moderator status:",
      "Error toggling moderator status"
    );
    expect(onSuccess).not.toHaveBeenCalled();

    restoreConsole();
  });
});
