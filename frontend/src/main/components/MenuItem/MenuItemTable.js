import React from "react";
import OurTable, { ButtonColumn } from "../OurTable";
import { hasRole } from "../../utils/currentUser";
import { useNavigate } from "react-router-dom";

export default function MenuItemTable({ menuItems, currentUser }) {
  const testid = "MenuItemTable";
  const navigate = useNavigate();

  // Navigate to the "create review" form for this item
  const reviewCallback = (cell) => {
    const item = cell.row.original;
    navigate(
      `/myreviews/create?itemId=${item.id}&itemName=${encodeURIComponent(
        item.name
      )}`
    );
  };

  // View all existing reviews for this item
  const viewCallback = (cell) => {
    const item = cell.row.original;
    navigate(`/reviews/${item.id}`);
  };

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

  if (hasRole(currentUser, "ROLE_USER")) {
    columns.push(
      ButtonColumn("Review Item", "warning", reviewCallback, testid)
    );
    columns.push(
      ButtonColumn("All Reviews", "warning", viewCallback, testid)
    );
  }

  return <OurTable columns={columns} data={menuItems} testid={testid} />;
}
