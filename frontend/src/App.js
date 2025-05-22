import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "main/pages/HomePage";
import ProfilePage from "main/pages/ProfilePage";
import AdminUsersPage from "main/pages/AdminUsersPage";

import PlaceholderIndexPage from "main/pages/Placeholder/PlaceholderIndexPage";
import PlaceholderCreatePage from "main/pages/Placeholder/PlaceholderCreatePage";
import PlaceholderEditPage from "main/pages/Placeholder/PlaceholderEditPage";

import ReviewsPage from "main/pages/Reviews/ReviewsPage";

import MyReviewsIndexPage from "main/pages/MyReviews/MyReviewsIndexPage";
import MyReviewsCreatePage from "main/pages/MyReviews/MyReviewsCreatePage";

import MealTimesPage from "main/pages/Meal/MealTimesPage";
import MenuItemPage from "main/pages/MenuItem/MenuItemPage";

import Moderate from "main/pages/Moderate";

import { hasRole, useCurrentUser } from "main/utils/currentUser";

import "bootstrap/dist/css/bootstrap.css";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { data: currentUser } = useCurrentUser();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route exact path="/" element={<HomePage />} />
        <Route exact path="/profile" element={<ProfilePage />} />

        {/* Admin-only */}
        {hasRole(currentUser, "ROLE_ADMIN") && (
          <Route exact path="/admin/users" element={<AdminUsersPage />} />
        )}

        {/* User-only */}
        {hasRole(currentUser, "ROLE_USER") && (
          <>
            <Route exact path="/myreviews" element={<MyReviewsIndexPage />} />
            <Route
              exact
              path="/myreviews/create"
              element={<MyReviewsCreatePage />}
            />
            <Route exact path="/reviews/:itemid" element={<ReviewsPage />} />
          </>
        )}

        {/* Admin-only */}
        {hasRole(currentUser, "ROLE_ADMIN") && (
          <Route exact path="/moderate" element={<Moderate />} />
        )}

        {/* User-only placeholder */}
        {hasRole(currentUser, "ROLE_USER") && (
          <Route exact path="/placeholder" element={<PlaceholderIndexPage />} />
        )}

        {/* Admin-only placeholder edits/creates */}
        {hasRole(currentUser, "ROLE_ADMIN") && (
          <>
            <Route
              exact
              path="/placeholder/edit/:id"
              element={<PlaceholderEditPage />}
            />
            <Route
              exact
              path="/placeholder/create"
              element={<PlaceholderCreatePage />}
            />
          </>
        )}

        {/* Dining commons (public) */}
        <Route
          exact
          path="/diningcommons/:date-time/:dining-commons-code"
          element={<MealTimesPage />}
        />
        <Route
          exact
          path="/diningcommons/:date-time/:dining-commons-code/:meal"
          element={<MenuItemPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
