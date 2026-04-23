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
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getNavHtml(active = "home") {
  const links = [
    { key: "home", href: "index.html", label: "Home" },
    { key: "about", href: "about.html", label: "About" },
    { key: "contact", href: "contact.html", label: "Contact" }
  ];

  const navLinks = links
    .map((item) => {
      const cls = item.key === active ? "nav-link is-active" : "nav-link";
      return `<a class="${cls}" href="${item.href}">${item.label}</a>`;
    })
    .join("");

  return `
    <header class="site-navbar">
      <div class="navbar-inner">
        <a class="logo" href="index.html">Social<b>Fetch</b></a>
        <nav class="nav-links" aria-label="Main navigation">${navLinks}</nav>
      </div>
    </header>
  `;
}

function getFooterHtml() {
  return `
    <footer class="site-footer">
      <div class="footer-inner">
        <div>© 2026 SocialFetch</div>
        <div class="footer-links">
          <a href="terms.html">Terms</a>
          <a href="privacy.html">Privacy</a>
          <a href="contact.html">Contact</a>
        </div>
      </div>
    </footer>
  `;
}

function mountChrome(active) {
  window.$("#site-header").html(getNavHtml(active));
  window.$("#site-footer").html(getFooterHtml());
}

function createFeedSkeletonCard() {
  return `
    <article class="card skeleton" aria-hidden="true">
      <div class="skel-image"></div>
      <div class="card-body">
        <div class="meta-row">
          <div class="skel-pill"></div>
          <div class="skel-line sm"></div>
        </div>
        <div class="skel-line lg"></div>
        <div class="skel-line md"></div>
        <div class="skel-line"></div>
        <div class="skel-btn"></div>
      </div>
    </article>
  `;
}

function renderFeedSkeletons($target, count = 4) {
  const skeletons = Array.from({ length: count }, () => createFeedSkeletonCard()).join("");
  $target.html(skeletons);
}

function renderState($target, title, body, role = "status") {
  $target.html(`
    <article class="state" role="${role}">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </article>
  `);
}

function normalizePost(post = {}, fallbackId = "") {
  const rawContent = typeof post.content === "string" ? post.content.replace(/\s+/g, " ").trim() : "";
  const normalized = {
    id: post.id || fallbackId,
    title: post.title || "Untitled Post",
    content: rawContent || "No content available.",
    type: post.type || "General",
    image_url: post.image_url || DEFAULT_IMAGE,
    created_at: post.created_at || null
  };

  return normalized;
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
