import { useEffect } from "react";
import { useLocation } from "react-router";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // A cross-page anchor link (`/sample/advanced#filter-sheet`) has to be handled here.
    // The browser only scrolls to a hash on a real document load or a same-document hash
    // change, and a client-side route change is neither — while this effect used to depend
    // on `pathname` alone, so it actively scrolled such a link back to the top.
    //
    // scrollIntoView honours `scroll-margin-top`, so a section carrying `scroll-mt-*` still
    // clears the sticky navbar. A target close to the end of the page settles wherever the
    // document bottoms out rather than at the top of the viewport; that is the browser
    // doing the right thing, not a miss.
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
