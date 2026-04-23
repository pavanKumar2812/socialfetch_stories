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

function renderPosts(posts) {
  audioController.clearItems();

  const html = posts
    .map((rawPost, index) => {
      const post = normalizePost(rawPost, `post-${index}`);
      const postId = escapeHtml(post.id);
      const title = escapeHtml(post.title);
      const excerptText = post.content.length > 180 ? `${post.content.slice(0, 180)}...` : post.content;
      const excerpt = escapeHtml(excerptText);
      const type = escapeHtml(post.type);
      const timestamp = formatTimestamp(post.created_at);
      const imageUrl = escapeHtml(post.image_url);
      const sentenceSpans = splitIntoSentences(post.content)
        .map((sentence, sentenceIndex) => `<span class="sentence" data-idx="${sentenceIndex}">${escapeHtml(sentence)} </span>`)
        .join("");

      audioController.registerItem(post.id, post.content);

      return `
        <article class="card" data-audio-id="${postId}" style="animation-delay:${Math.min(index * 0.05, 0.35)}s">
          <a class="card-link" href="post.html?id=${encodeURIComponent(post.id)}" aria-label="Read ${title}">
            <div class="card-image-wrap">
              <img class="card-image" src="${imageUrl}" alt="${title}" loading="lazy" />
            </div>
            <div class="card-body">
              <div class="meta-row">
                <span class="badge">${type}</span>
                <span class="timestamp">${timestamp}</span>
              </div>
              <h2 class="title">${title}</h2>
              <p class="excerpt">${excerpt}</p>
            </div>
          </a>
          <div class="card-body card-audio">
            <div class="speech-content" aria-live="polite">${sentenceSpans}</div>
            <div class="actions">
              <button class="control-btn play-btn" type="button" aria-label="Play audio for ${title}">▶ Play</button>
              <button class="control-btn pause-btn" type="button" aria-label="Pause audio for ${title}" disabled>⏸ Pause</button>
              <button class="control-btn stop-btn" type="button" aria-label="Stop audio for ${title}" disabled>⏹ Stop</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  $feed.html(html);

  if (!audioController.supportsSpeech) {
    $feed.find("[data-audio-id]").each((_, element) => {
      audioController.setUnavailableUI(window.$(element));
    });
  }
}

async function loadPosts() {
  renderFeedSkeletons($feed, 4);

  try {
    const postsRef = collection(db, "posts");
    const postsQuery = query(postsRef, orderBy("created_at", "desc"));
    const snap = await getDocs(postsQuery);

    if (snap.empty) {
      renderState($feed, "No posts yet", "When new content is published to Firestore, it will appear here.");
      return;
    }

    const posts = snap.docs.map((postDoc) => ({ id: postDoc.id, ...postDoc.data() }));
    renderPosts(posts);
  } catch (error) {
    console.error("Failed to fetch posts", error);
    renderState($feed, "Unable to load posts", "Please check your Firebase config and Firestore rules, then refresh.", "alert");
  }
}

function initPage() {
  mountChrome("home");
  loadPosts();
}

window.$(document).ready(initPage);
