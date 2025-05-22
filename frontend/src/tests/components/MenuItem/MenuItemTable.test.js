import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import MenuItemTable from "../../../main/components/MenuItem/MenuItemTable";
import { menuItemFixtures } from "../../../fixtures/menuItemFixtures";
import AxiosMockAdapter from "axios-mock-adapter";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import {
  apiCurrentUserFixtures,
  currentUserFixtures,
} from "../../../fixtures/currentUserFixtures";
import { systemInfoFixtures } from "../../../fixtures/systemInfoFixtures";

const mockedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

describe("MenuItemTable Tests", () => {
  let axiosMock;

  beforeAll(() => {
    axiosMock = new AxiosMockAdapter(axios);
  });
  afterEach(() => {
    axiosMock.reset();
  });
  test("Headers appear and empty table renders correctly without buttons", async () => {
    render(
      <MemoryRouter>
        <MenuItemTable
          menuItems={[]}
          currentUser={currentUserFixtures.notLoggedIn}
        />
        ,
      </MemoryRouter>,
    );

    expect(screen.getByTestId("MenuItemTable-header-name")).toHaveTextContent(
      "Item Name",
    );
    expect(
      screen.getByTestId("MenuItemTable-header-station"),
    ).toHaveTextContent("Station");
    expect(
      screen.getByTestId("MenuItemTable-header-averageRating"),
    ).toHaveTextContent("Average Rating");
    expect(
      screen.queryByTestId("MenuItemTable-row-cell-0-col-name"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("MenuItemTable-row-cell-0-col-station"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("MenuItemTable-cell-row-0-col-Review Item-button"),
    ).not.toBeInTheDocument();
  });

  test("Renders 5 Menu Items Correctly with ratings", async () => {
    let fiveMenuItems = menuItemFixtures.fiveMenuItems;
    render(
      <MemoryRouter>
        <MenuItemTable
          menuItems={fiveMenuItems}
          currentUser={currentUserFixtures.notLoggedIn}
        />
        ,
      </MemoryRouter>,
    );

    expect(
      screen.getByTestId(`MenuItemTable-cell-row-0-col-averageRating`),
    ).toHaveTextContent("4.5");
    expect(
      screen.getByTestId(`MenuItemTable-cell-row-1-col-averageRating`),
    ).toHaveTextContent("No reviews");
    expect(
      screen.getByTestId(`MenuItemTable-cell-row-2-col-averageRating`),
    ).toHaveTextContent("3.5");
    expect(
      screen.getByTestId(`MenuItemTable-cell-row-3-col-averageRating`),
    ).toHaveTextContent("5.0");
    expect(
      screen.getByTestId(`MenuItemTable-cell-row-4-col-averageRating`),
    ).toHaveTextContent("No reviews");

    for (let i = 0; i < fiveMenuItems.length; i++) {
      expect(
        screen.getByTestId(`MenuItemTable-cell-row-${i}-col-name`),
      ).toHaveTextContent(fiveMenuItems[i].name);
      expect(
        screen.getByTestId(`MenuItemTable-cell-row-${i}-col-station`),
      ).toHaveTextContent(fiveMenuItems[i].station);
    }
  });

  test("calculateAverageRating handles edge cases correctly", async () => {
    const edgeCaseItems = [
      {
        id: 1,
        name: "Test Item 1",
        station: "Test Station",
        reviews: [{ }, { itemsStars: null }] // Should show "No ratings"
      },
      {
        id: 2,
        name: "Test Item 2",
        station: "Test Station",
        reviews: [null, { itemsStars: 5 }] // Should still calculate average from valid rating
      },
      {
        id: 3,
        name: "Test Item 3",
        station: "Test Station",
        reviews: ["not an object", { itemsStars: 4 }] // Should handle invalid review objects
      }
    ];

    render(
      <MemoryRouter>
        <MenuItemTable
          menuItems={edgeCaseItems}
          currentUser={currentUserFixtures.notLoggedIn}
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId(`MenuItemTable-cell-row-0-col-averageRating`)).toHaveTextContent("No ratings");
    expect(screen.getByTestId(`MenuItemTable-cell-row-1-col-averageRating`)).toHaveTextContent("5.0");
    expect(screen.getByTestId(`MenuItemTable-cell-row-2-col-averageRating`)).toHaveTextContent("4.0");
  });

  test("Navigation uses correct menu item id", async () => {
    const items = [
      { id: 42, name: "Test Item", station: "Test Station", reviews: [] },
      { id: 43, name: "Test Item 2", station: "Test Station", reviews: [] }
    ];

    render(
      <MemoryRouter>
        <MenuItemTable
          menuItems={items}
          currentUser={currentUserFixtures.userOnly}
        />
      </MemoryRouter>
    );

    const firstItemButton = screen.getByTestId("MenuItemTable-cell-row-0-col-All Reviews-button");
    const secondItemButton = screen.getByTestId("MenuItemTable-cell-row-1-col-All Reviews-button");

    fireEvent.click(firstItemButton);
    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith("/reviews/42"));

    fireEvent.click(secondItemButton);
    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith("/reviews/43"));
  });

  test("calculateAverageRating ignores non-number ratings", () => {
    const items = [
      {
        id: 1,
        name: "Mixed Reviews",
        station: "Mixed Station",
        reviews: [
          { itemsStars: 4 },
          { itemsStars: null },
          { itemsStars: "bad" },
          {}, // empty object
          { itemsStars: 5 }
        ]
      }
    ];
  
    render(
      <MemoryRouter>
        <MenuItemTable menuItems={items} currentUser={currentUserFixtures.notLoggedIn} />
      </MemoryRouter>
    );
  
    expect(screen.getByTestId("MenuItemTable-cell-row-0-col-averageRating")).toHaveTextContent("4.5");
  });
  
  test("returns 'No ratings' if all reviews are invalid", () => {
    const items = [
      {
        id: 2,
        name: "No Ratings",
        station: "Station X",
        reviews: [{}, { itemsStars: null }, "bad"]
      }
    ];
  
    render(
      <MemoryRouter>
        <MenuItemTable menuItems={items} currentUser={currentUserFixtures.notLoggedIn} />
      </MemoryRouter>
    );
  
    expect(screen.getByTestId("MenuItemTable-cell-row-0-col-averageRating")).toHaveTextContent("No ratings");
  });
  
  test("calculates average rating with correct math and precision", () => {
    const items = [
      {
        id: 3,
        name: "Precise Item",
        station: "Station Math",
        reviews: [
          { itemsStars: 5 },
          { itemsStars: 4 },
          { itemsStars: 3 }
        ]
      }
    ];
  
    render(
      <MemoryRouter>
        <MenuItemTable menuItems={items} currentUser={currentUserFixtures.notLoggedIn} />
      </MemoryRouter>
    );
  
    // (5 + 4 + 3) / 3 = 4.0
    expect(screen.getByTestId("MenuItemTable-cell-row-0-col-averageRating")).toHaveTextContent("4.0");
  });
  
  test("does not show buttons when user is not logged in", () => {
    const items = [
      { id: 1, name: "Item A", station: "Station A", reviews: [] }
    ];
  
    render(
      <MemoryRouter>
        <MenuItemTable menuItems={items} currentUser={currentUserFixtures.notLoggedIn} />
      </MemoryRouter>
    );
  
    expect(screen.queryByTestId("MenuItemTable-cell-row-0-col-Review Item-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("MenuItemTable-cell-row-0-col-All Reviews-button")).not.toBeInTheDocument();
  });
  

  test("Buttons work correctly", async () => {
    const mockAlert = jest.spyOn(window, "alert").mockImplementation(() => {});
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
    render(
      <MemoryRouter>
        <MenuItemTable
          menuItems={menuItemFixtures.oneMenuItem}
          currentUser={currentUserFixtures.userOnly}
        />
        ,
      </MemoryRouter>,
    );
    let button = screen.getByTestId(
      "MenuItemTable-cell-row-0-col-Review Item-button",
    );
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn-warning");

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAlert).toBeCalledTimes(1);
    });
    expect(mockAlert).toBeCalledWith("Reviews coming soon!");

    let allButton = screen.getByTestId(
      "MenuItemTable-cell-row-0-col-All Reviews-button",
    );
    expect(allButton).toBeInTheDocument();
    expect(allButton).toHaveClass("btn-warning");

    fireEvent.click(allButton);
    await waitFor(() =>
      expect(mockedNavigate).toHaveBeenCalledWith("/reviews/1"),
    );
  });
});
