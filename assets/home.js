import { db, collection, query, orderBy, getDocs } from "./firebase.js";
import {
  escapeHtml,
  splitIntoSentences,
  formatTimestamp,
  mountChrome,
  renderFeedSkeletons,
  renderState,
  normalizePost
} from "./common.js";
import { SpeechController } from "./audio.js";

const $feed = window.$("#feed");
const audioController = new SpeechController($feed);
let allPosts = [];
let currentCategory = "All";
let searchQuery = "";

function renderPosts(posts) {
  audioController.clearItems();
  
  if (posts.length === 0) {
    renderState($feed, "No posts yet", "Try searching for something else or check back later!");
    return;
  }

  const html = posts
    .map((rawPost, index) => {
      const post = normalizePost(rawPost, `post-${index}`);
      const postId = escapeHtml(post.id);
      const title = escapeHtml(post.title);
      const excerptText = post.content.length > 150 ? `${post.content.slice(0, 150)}...` : post.content;
      const excerpt = escapeHtml(excerptText);
      const type = escapeHtml(post.type);
      const timestamp = formatTimestamp(post.created_at);
      const imageUrl = escapeHtml(post.image_url);
      
      const sentenceSpans = splitIntoSentences(post.content)
        .map((sentence, sentenceIndex) => `<span class="sentence" data-idx="${sentenceIndex}">${escapeHtml(sentence)} </span>`)
        .join("");

      audioController.registerItem(post.id, post.content);

      return `
        <article class="card fade-in" data-audio-id="${postId}" style="animation-delay:${Math.min(index * 0.1, 0.5)}s">
          <div class="card-image-wrap">
            <span class="card-badge">${type}</span>
            <img class="card-image" src="${imageUrl}" alt="${title}" loading="lazy" />
          </div>
          <div class="card-body">
            <div class="card-meta">${timestamp}</div>
            <h2 class="card-title">${title}</h2>
            <p class="card-excerpt">${excerpt}</p>
            <div class="card-footer">
              <a href="post.html?id=${encodeURIComponent(post.id)}" class="read-more">Read More <i data-lucide="arrow-right" size="16"></i></a>
            </div>
          </div>
          
          <div class="speech-content" aria-live="polite">${sentenceSpans}</div>
          
          <div class="card-audio-controls">
            <button class="audio-btn play-btn" type="button" aria-label="Play audio"><i data-lucide="play" size="18"></i></button>
            <button class="audio-btn pause-btn" type="button" aria-label="Pause audio" disabled><i data-lucide="pause" size="18"></i></button>
            <button class="audio-btn stop-btn" type="button" aria-label="Stop audio" disabled><i data-lucide="square" size="18"></i></button>
          </div>
        </article>
      `;
    })
    .join("");

  $feed.html(html);
  
  // Re-initialize Lucide icons for new cards
  if (window.lucide) {
    window.lucide.createIcons();
  }

  if (!audioController.supportsSpeech) {
    $feed.find("[data-audio-id]").each((_, element) => {
      audioController.setUnavailableUI(window.$(element));
    });
  }
}

function filterAndRender() {
  let filtered = allPosts;
  
  // Category filter
  if (currentCategory !== "All") {
    filtered = filtered.filter(p => p.type === currentCategory);
  }
  
  // Search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.content.toLowerCase().includes(q)
    );
  }
  
  renderPosts(filtered);
}

async function loadPosts() {
  renderFeedSkeletons($feed, 4);

  try {
    const postsRef = collection(db, "posts");
    const postsQuery = query(postsRef, orderBy("created_at", "desc"));
    const snap = await getDocs(postsQuery);

    if (snap.empty) {
      allPosts = [];
      renderState($feed, "No posts yet", "When new content is published to Firestore, it will appear here.");
      return;
    }

    allPosts = snap.docs.map((postDoc) => ({ id: postDoc.id, ...postDoc.data() }));
    filterAndRender();
  } catch (error) {
    console.error("Failed to fetch posts", error);
    renderState($feed, "Unable to load posts", "Please check your Firebase config and Firestore rules.", "alert");
  }
}

function initPage() {
  const activePage = document.body.dataset.page || "stories";
  mountChrome(activePage);

  if ($feed.length === 0) {
    return;
  }

  loadPosts();

  // Search Input Handler
  window.$("#search-input").on("input", function() {
    searchQuery = window.$(this).val();
    filterAndRender();
  });

  // Category Filter Handler
  window.$("#category-filters").on("click", ".category-btn", function() {
    window.$(".category-btn").removeClass("active");
    window.$(this).addClass("active");
    currentCategory = window.$(this).data("category");
    filterAndRender();
  });
}

window.$(document).ready(initPage);
