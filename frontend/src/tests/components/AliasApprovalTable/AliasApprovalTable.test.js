import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AliasApprovalTable from "main/components/AliasApprovalTable/AliasApprovalTable";

// first, mock out the two hooks from main/utils/useBackend
jest.mock("main/utils/useBackend", () => ({
  useBackend: jest.fn(),
  useBackendMutation: jest.fn(),
}));
import { useBackend, useBackendMutation } from "main/utils/useBackend";

describe("AliasApprovalTable", () => {
  const dummyRefetch = jest.fn();
  const dummyMutate = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();

    useBackend.mockReturnValue({
      data: [{ id: 123, proposedAlias: "CleverCat" }],
      isLoading: false,
      refetch: dummyRefetch,
    });

    useBackendMutation.mockReturnValue({
      mutate: dummyMutate,
    });
  });

  it("renders just the header row when loading", () => {
    // override to simulate loading
    useBackend.mockReturnValueOnce({
      data: [],
      isLoading: true,
      refetch: dummyRefetch,
    });

    render(<AliasApprovalTable />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent.trim())).toEqual([
      "Proposed Alias",
      "Approve",
      "Reject",
    ]);
    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1);
  });

  it("wires up useBackend with the correct key, params & initialData", () => {
    render(<AliasApprovalTable />);
    expect(useBackend).toHaveBeenCalledWith(
      ["/api/admin/usersWithProposedAlias"],
      { method: "GET", url: "/api/admin/usersWithProposedAlias" },
      [],
    );
  });

  it("wires up useBackendMutation with the correct transform & invalidation key", () => {
    render(<AliasApprovalTable />);
    const [transformFn, opts, invalidateKeys] =
      useBackendMutation.mock.calls[0];
    expect(typeof transformFn).toBe("function");
    expect(opts).toEqual({ onSuccess: expect.any(Function) });
    expect(invalidateKeys).toEqual(["/api/admin/usersWithProposedAlias"]);
  });

  it("renders a table with the correct headers and one row", () => {
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
    expect(screen.getByText("CleverCat")).toBeInTheDocument();
  });

  it("calls mutate with approved=true when you click Approve", () => {
    render(<AliasApprovalTable />);
    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));
    expect(dummyMutate).toHaveBeenCalledWith({
      id: 123,
      proposedAlias: "CleverCat",
      approved: true,
    });
  });

  it("calls mutate with approved=false when you click Reject", () => {
    render(<AliasApprovalTable />);
    fireEvent.click(screen.getByRole("button", { name: /Reject/i }));
    expect(dummyMutate).toHaveBeenCalledWith({
      id: 123,
      proposedAlias: "CleverCat",
      approved: false,
    });
  });

  it("will refetch after a successful mutation", () => {
    render(<AliasApprovalTable />);
    const onSuccess = useBackendMutation.mock.calls[0][1].onSuccess;
    onSuccess();
    expect(dummyRefetch).toHaveBeenCalled();
  });

  it("transforms a row into the correct axios parameters", () => {
    render(<AliasApprovalTable />);
    // grab the transform function passed into useBackendMutation
    const transform = useBackendMutation.mock.calls[0][0];
    // call it with a dummy row
    const row = { id: 999, proposedAlias: "Foxtrot", approved: false };
    expect(transform(row)).toEqual({
      method: "PUT",
      url: "/api/currentUser/updateAliasModeration",
      params: {
        id: 999,
        approved: false,
      },
    });
  });

  it("defaults data to [] when useBackend returns no data property", () => {
    useBackend.mockReturnValueOnce({
      isLoading: false,
      refetch: dummyRefetch,
    });

    render(<AliasApprovalTable />);

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(1);
  });
});
