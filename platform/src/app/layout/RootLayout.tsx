import { Outlet } from "react-router";
import ScrollToTop from "@framework/components/ui/ScrollToTop";

const RootLayout = () => (
  <>
    <ScrollToTop />
    <Outlet />
  </>
);

export default RootLayout;
