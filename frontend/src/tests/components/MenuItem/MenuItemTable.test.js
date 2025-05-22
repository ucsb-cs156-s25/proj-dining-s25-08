// frontend/src/tests/components/MenuItem/MenuItemTable.test.js

import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import MenuItemTable from "main/components/MenuItem/MenuItemTable";
import { menuItemFixtures } from "fixtures/menuItemFixtures";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { MemoryRouter } from "react-router-dom";
import {
  apiCurrentUserFixtures,
  currentUserFixtures,
} from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

// single mock of useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("MenuItemTable Tests", () => {
  let axiosMock;

  beforeAll(() => {
    axiosMock = new AxiosMockAdapter(axios);
  });

  afterEach(() => {
    axiosMock.reset();
    mockNavigate.mockReset();
  });

  beforeEach(() => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  test("Headers appear and empty table renders correctly without buttons", () => {
    render(
      <MemoryRouter>
        <MenuItemTable
          menuItems={[]}
          currentUser={currentUserFixtures.notLoggedIn}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId("MenuItemTable-header-name")).toHaveTextContent(
      "Item Name"
    );
    expect(
      screen.getByTestId("MenuItemTable-header-station")
    ).toHaveTextContent("Station");

    // no rows
    expect(
      screen.queryByTestId("MenuItemTable-row-cell-0-col-name")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("MenuItemTable-row-cell-0-col-station")
    ).not.toBeInTheDocument();

    // and since not logged in, no Review/All Reviews buttons
    expect(
      screen.queryByTestId("MenuItemTable-cell-row-0-col-Review Item-button")
    ).not.toBeInTheDocument();
  });

  test("Renders five Menu Items correctly without buttons when not logged in", () => {
    const five = menuItemFixtures.fiveMenuItems;

    render(
      <MemoryRouter>
        <MenuItemTable
          menuItems={five}
          currentUser={currentUserFixtures.notLoggedIn}
        />
      </MemoryRouter>
    );

    for (let i = 0; i < five.length; i++) {
      expect(
        screen.getByTestId(`MenuItemTable-cell-row-${i}-col-name`)
      ).toHaveTextContent(five[i].name);
      expect(
        screen.getByTestId(`MenuItemTable-cell-row-${i}-col-station`)
      ).toHaveTextContent(five[i].station);
      expect(
        screen.queryByTestId(
          `MenuItemTable-cell-row-${i}-col-Review Item-button`
        )
      ).not.toBeInTheDocument();
    }
  });

  test("Buttons work correctly for a user", async () => {
    render(
      <MemoryRouter>
        <MenuItemTable
          menuItems={menuItemFixtures.oneMenuItem}
          currentUser={currentUserFixtures.userOnly}
        />
      </MemoryRouter>
    );

    // 1) Review Item button
    const reviewBtn = screen.getByTestId(
      "MenuItemTable-cell-row-0-col-Review Item-button"
    );
    expect(reviewBtn).toBeInTheDocument();
    expect(reviewBtn).toHaveClass("btn-warning");

    fireEvent.click(reviewBtn);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/myreviews/create?itemId=1&itemName=Oatmeal%20(vgn)"
      )
    );

    // 2) All Reviews button
    const allBtn = screen.getByTestId(
      "MenuItemTable-cell-row-0-col-All Reviews-button"
    );
    expect(allBtn).toBeInTheDocument();
    expect(allBtn).toHaveClass("btn-warning");

    fireEvent.click(allBtn);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/reviews/1")
    );
  });
});
