import { Outlet } from "react-router";
import { Navbar } from "@framework/app/layout/Navbar";
import { BackToTop } from "@framework/components/ui/BackToTop";

const PageLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* No logo slot: the bar opens with a home icon per DESIGN.md §6, and Navbar
          reads its glyph from app.homeIcon itself. */}
      <Navbar />
      {/* The single owner of page-edge padding (DESIGN.md §7) and max content
          width. `--container-max` lives in index.css and is the only place the
          app's width is declared — templates and pages never set their own, so
          rewidthing the app is one CSS value, not an edit per template.
          The cap sits on the inner div rather than on the padded <main> so it
          bounds the *content*, matching how DESIGN.md words it; on <main> the
          border-box would count the padding and lose 48px. */}
      <main className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="mx-auto w-full max-w-(--container-max)">
          <Outlet />
        </div>
      </main>
      <BackToTop />
    </div>
  );
};

export default PageLayout;
