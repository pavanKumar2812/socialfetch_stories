const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80";

function escapeHtml(value = "") {
  return value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function splitIntoSentences(text = "") {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const matches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  const sentences = matches ? matches.map((part) => part.trim()).filter(Boolean) : [normalized];
  return sentences.length ? sentences : [normalized];
}

function formatTimestamp(createdAt) {
  if (!createdAt) return "Just now";
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function getNavHtml(active = "home") {
  const links = [
    { key: "home", href: "index.html", label: "Home" },
    { key: "stories", href: "stories.html", label: "Stories" },
    { key: "about", href: "about.html", label: "About" },
    { key: "contact", href: "contact.html", label: "Contact" }
  ];

  const navLinks = links
    .map((item) => {
      const cls = item.key === active ? "nav-link active" : "nav-link";
      return `<a class="${cls}" href="${item.href}">${item.label}</a>`;
    })
    .join("");

  const storyFilters = active === "stories"
    ? `
      <div class="nav-story-filters categories" id="category-filters">
        <button class="category-btn active" data-category="All">All</button>
        <button class="category-btn" data-category="Stories">Stories</button>
        <button class="category-btn" data-category="Thoughts">Thoughts</button>
        <button class="category-btn" data-category="News">News</button>
      </div>
    `
    : "";

  return `
    <nav class="navbar ${active === "stories" ? "has-filters" : ""}">
      <div class="container">
        <div class="nav-inner">
          <a class="logo" href="stories.html">Social<span>Fetch</span></a>

          <div class="nav-search-wrapper">
            <span class="nav-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
                <path d="M20 20L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
              </svg>
            </span>
            <input type="text" id="search-input" class="nav-search-input" placeholder="Search stories..." />
          </div>
          
          <div class="nav-links">
            ${navLinks}
          </div>

          <button class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle Dark Mode">
            <i data-lucide="moon"></i>
          </button>

          <button class="mobile-menu-btn" id="mobile-toggle" aria-label="Toggle Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        ${storyFilters}
      </div>
    </nav>

    <div class="mobile-drawer" id="mobile-drawer">
      ${navLinks}
    </div>
  `;
}

function getFooterHtml() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-inner">
          <a class="footer-logo" href="index.html">Social<span>Fetch</span></a>
          <div class="footer-links">
            <a class="footer-link" href="terms.html">Terms</a>
            <a class="footer-link" href="privacy.html">Privacy</a>
            <a class="footer-link" href="contact.html">Contact</a>
          </div>
          <p class="copyright">© 2026 SocialFetch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}

function mountChrome(active) {
  window.$("#site-header").html(getNavHtml(active));
  window.$("#site-footer").html(getFooterHtml());

  // Theme Toggle Logic
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  let currentTheme = savedTheme || (systemPrefersDark ? "dark" : "light");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const iconName = theme === "dark" ? "sun" : "moon";
    const $themeToggle = window.$("#theme-toggle");
    if ($themeToggle.length) {
      $themeToggle.html(`<i data-lucide="${iconName}"></i>`);
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  applyTheme(currentTheme);

  window.$("#theme-toggle").on("click", function() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", currentTheme);
    applyTheme(currentTheme);
  });

  // Fixed Mobile Toggle Logic
  const $toggle = window.$("#mobile-toggle");
  const $drawer = window.$("#mobile-drawer");

  // Toggle open/close and X animation
  $toggle.on("click", function(e) {
    e.stopPropagation(); // Prevents click from instantly bubbling up and triggering the document close
    $drawer.toggleClass("open");
    $toggle.toggleClass("open");
  });

  // Close drawer on link click
  $drawer.on("click", "a", function() {
    $drawer.removeClass("open");
    $toggle.removeClass("open");
  });

  // Close drawer when clicking outside of it
  window.$(document).on("click", function(e) {
    if ($drawer.hasClass("open") && !window.$(e.target).closest('#mobile-drawer').length) {
      $drawer.removeClass("open");
      $toggle.removeClass("open");
    }
  });
}

function createFeedSkeletonCard() {
  return `
    <article class="card skeleton">
      <div class="card-image-wrap" style="height: 200px;"></div>
      <div class="card-body">
        <div style="height: 12px; width: 40%; background: var(--border); margin-bottom: 1rem; border-radius: 4px;"></div>
        <div style="height: 24px; width: 80%; background: var(--border); margin-bottom: 1rem; border-radius: 4px;"></div>
        <div style="height: 12px; width: 100%; background: var(--border); margin-bottom: 0.5rem; border-radius: 4px;"></div>
        <div style="height: 12px; width: 100%; background: var(--border); margin-bottom: 0.5rem; border-radius: 4px;"></div>
      </div>
    </article>
  `;
}

function renderFeedSkeletons($target, count = 4) {
  const skeletons = Array.from({ length: count }, () => createFeedSkeletonCard()).join("");
  $target.html(skeletons);
}

function renderState($target, title, body) {
  $target.html(`
    <div class="empty-state fade-in">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </div>
  `);
}

function normalizePost(post = {}, fallbackId = "") {
  const rawContent = typeof post.content === "string" ? post.content.replace(/\s+/g, " ").trim() : "";
  return {
    id: post.id || fallbackId,
    title: post.title || "Untitled Post",
    content: rawContent || "No content available.",
    type: post.type || "Story",
    image_url: post.image_url || DEFAULT_IMAGE,
    created_at: post.created_at || null
  };
}

export {
  DEFAULT_IMAGE,
  escapeHtml,
  splitIntoSentences,
  formatTimestamp,
  mountChrome,
  renderFeedSkeletons,
  renderState,
  normalizePost
};