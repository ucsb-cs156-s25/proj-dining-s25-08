import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AliasApprovalTable from "main/components/AliasApprovalTable/AliasApprovalTable";
import { useBackend, useBackendMutation } from "main/utils/useBackend";

jest.mock("main/utils/useBackend");

describe("AliasApprovalTable", () => {
  const fakeUsers = [
    { id: 1, currentAlias: "old1", proposedAlias: "new1" },
    { id: 2, currentAlias: "old2", proposedAlias: "new2" },
  ];

  let refetchMock;
  let mutateMock;

  beforeEach(() => {
    refetchMock = jest.fn();
    mutateMock = jest.fn();

    useBackend.mockReturnValue({
      data: fakeUsers,
      isLoading: false,
      refetch: refetchMock,
    });
    useBackendMutation.mockReturnValue({
      mutate: mutateMock,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("wires up useBackend with the correct args", () => {
    render(<AliasApprovalTable />);
    expect(useBackend).toHaveBeenCalledWith(
      ["/api/admin/usersWithProposedAlias"],
      { method: "GET", url: "/api/admin/usersWithProposedAlias" },
      [],
    );
  });

  it("wires up useBackendMutation transform and calls refetch on success", () => {
    render(<AliasApprovalTable />);
    const [transform, options] = useBackendMutation.mock.calls[0];
    expect(transform({ id: 42, approved: true })).toEqual({
      method: "PUT",
      url: "/api/currentUser/updateAliasModeration",
      params: { id: 42, approved: true },
    });
    options.onSuccess();
    expect(refetchMock).toHaveBeenCalled();
  });

  it("renders only the header row when loading", () => {
    useBackend.mockReturnValue({
      data: [],
      isLoading: true,
      refetch: refetchMock,
    });
    render(<AliasApprovalTable />);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1);
  });

  it("renders one row per user, showing only proposedAlias", () => {
    render(<AliasApprovalTable />);
    fakeUsers.forEach((u) => {
      expect(screen.getByText(u.proposedAlias)).toBeInTheDocument();
    });
  });

  it("calls mutate with the full row + approved=true when Approve clicked", () => {
    render(<AliasApprovalTable />);
    const approveButtons = screen.getAllByRole("button", { name: /approve/i });
    userEvent.click(approveButtons[0]);
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: fakeUsers[0].id, approved: true }),
    );
  });

  it("calls mutate with the full row + approved=false when Reject clicked", () => {
    render(<AliasApprovalTable />);
    const rejectButtons = screen.getAllByRole("button", { name: /reject/i });
    userEvent.click(rejectButtons[0]);
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: fakeUsers[0].id, approved: false }),
    );
  });

  it("renders only the header row when data is empty (not loading)", () => {
    useBackend.mockReturnValue({
      data: [],
      isLoading: false,
      refetch: refetchMock,
    });
    render(<AliasApprovalTable />);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1);
  });

  it("renders the correct column headers", () => {
    render(<AliasApprovalTable />);
    expect(
      screen.getByRole("columnheader", { name: /Proposed Alias/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Approve/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /Reject/i }),
    ).toBeInTheDocument();
  });

  it("uses default empty array when useBackend returns data as undefined", () => {
    useBackend.mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: refetchMock,
    });
    render(<AliasApprovalTable />);
    const rows = screen.getAllByRole("row");

    expect(rows).toHaveLength(1);
  });
});
