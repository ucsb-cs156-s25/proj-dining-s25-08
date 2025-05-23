import OurTable, { ButtonColumn } from "../OurTable";
import { hasRole } from "../../utils/currentUser";
import { useNavigate } from "react-router-dom";

export default function MenuItemTable({ menuItems, currentUser }) {
  const testid = "MenuItemTable";
  const navigate = useNavigate();

  // when you click “Review Item”, go to the create-review page for that item
  const reviewCallback = (cell) => {
    const item = cell.row.original;
    navigate(
      `/myreviews/create?itemId=${item.id}&itemName=${encodeURIComponent(
        item.name
      )}`
    );
  };

  // when you click “All Reviews”, go to the reviews-list page for that item
  const viewCallback = (cell) => {
    const item = cell.row.original;
    navigate(`/reviews/${item.id}`);
  };

  // base columns
  const columns = [
    {
      Header: "Item Name",
      accessor: "name",
    },
    {
      Header: "Station",
      accessor: "station",
    },
  ];

  // if the current user has USER role, show the two buttons
  if (hasRole(currentUser, "ROLE_USER")) {
    columns.push(ButtonColumn("Review Item", "warning", reviewCallback, testid));
    columns.push(ButtonColumn("All Reviews", "warning", viewCallback, testid));
  }

  return <OurTable columns={columns} data={menuItems} testid={testid} />;
}