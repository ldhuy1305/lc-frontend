<template>
  <div class="markdown-content" v-html="renderedMarkdown"></div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount, nextTick } from "vue";

interface Props {
  content: string | number;
  isStreaming?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
});

// Enhanced markdown parser with better streaming support
const parseMarkdown = (text: string | number): string => {
  if (!text && text !== 0) return "";

  // Convert to string if it's a number
  let html = String(text);

  // Handle code blocks with language detection
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, language, code) => {
    const lang = language || "text";
    return `<div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-language">${lang}</span>
          <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${code.trim()}\`)">Copy</button>
        </div>
        <pre class="code-block"><code class="language-${lang}">${escapeHtml(
      code.trim()
    )}</code></pre>
      </div>`;
  });

  // Handle inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headers with better styling
  html = html.replace(/^### (.*$)/gim, '<h3 class="heading-3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="heading-2">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="heading-1">$1</h1>');

  // Bold and Italic with better handling
  html = html.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="text-bold">$1</strong>'
  );
  html = html.replace(/\*(.*?)\*/g, '<em class="text-italic">$1</em>');

  // Lists with better structure
  html = html.replace(/^- (.*$)/gim, '<li class="list-item">$1</li>');
  html = html.replace(
    /(<li class="list-item">.*<\/li>)/s,
    '<ul class="unordered-list">$1</ul>'
  );
  html = html.replace(/^(\d+)\. (.*$)/gim, '<li class="ordered-item">$2</li>');
  html = html.replace(
    /(<li class="ordered-item">.*<\/li>)/s,
    '<ol class="ordered-list">$1</ol>'
  );

  // Tables
  html = html.replace(
    /\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g,
    (match, header, rows) => {
      const headerCells = header
        .split("|")
        .map((cell: string) => cell.trim())
        .filter((cell: string) => cell);
      const rowLines = rows
        .trim()
        .split("\n")
        .filter((line: string) => line.trim());

      let tableHtml =
        '<div class="table-wrapper"><table class="data-table"><thead><tr>';
      headerCells.forEach((cell: string) => {
        tableHtml += `<th>${cell}</th>`;
      });
      tableHtml += "</tr></thead><tbody>";

      rowLines.forEach((line: string) => {
        const cells = line
          .split("|")
          .map((cell: string) => cell.trim())
          .filter((cell: string) => cell);
        if (cells.length > 0) {
          tableHtml += "<tr>";
          cells.forEach((cell: string) => {
            tableHtml += `<td>${cell}</td>`;
          });
          tableHtml += "</tr>";
        }
      });

      tableHtml += "</tbody></table></div>";
      return tableHtml;
    }
  );

  // Links with better styling
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="external-link" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Blockquotes
  html = html.replace(
    /^> (.*$)/gim,
    '<blockquote class="quote-block">$1</blockquote>'
  );

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr class="divider">');

  // Line breaks with better handling
  html = html.replace(/\n\n/g, '</p><p class="paragraph">');
  html = html.replace(/\n/g, '<br class="line-break">');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith("<")) {
    html = `<p class="paragraph">${html}</p>`;
  }

  return html;
};

// Escape HTML for code blocks
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

// Optimized rendering with streaming support
const renderedContent = ref(parseMarkdown(props.content));
let renderTimer: NodeJS.Timeout | null = null;
let lastRenderTime = 0;
const RENDER_THROTTLE = 16; // 60fps

// Throttled rendering for streaming
const scheduleRender = () => {
  if (renderTimer) {
    clearTimeout(renderTimer);
  }

  const now = Date.now();
  const timeSinceLastRender = now - lastRenderTime;

  if (timeSinceLastRender >= RENDER_THROTTLE) {
    // Render immediately if enough time has passed
    renderedContent.value = parseMarkdown(props.content);
    lastRenderTime = now;
    renderTimer = null;
  } else {
    // Schedule render for next frame
    renderTimer = setTimeout(() => {
      renderedContent.value = parseMarkdown(props.content);
      lastRenderTime = Date.now();
      renderTimer = null;
    }, RENDER_THROTTLE - timeSinceLastRender);
  }
};

// Watch content changes with optimized streaming
watch(
  () => props.content,
  (newContent, oldContent) => {
    // Convert to string for comparison
    const newContentStr = String(newContent);
    const oldContentStr = String(oldContent || "");

    if (
      props.isStreaming &&
      oldContent &&
      newContentStr.startsWith(oldContentStr)
    ) {
      // Streaming update - use throttled rendering
      scheduleRender();
    } else {
      // Complete content change - render immediately
      if (renderTimer) {
        clearTimeout(renderTimer);
        renderTimer = null;
      }
      renderedContent.value = parseMarkdown(newContent);
      lastRenderTime = Date.now();
    }
  },
  { immediate: true }
);

// Computed property for template
const renderedMarkdown = computed(() => {
  return renderedContent.value;
});

// Cleanup
onBeforeUnmount(() => {
  if (renderTimer) {
    clearTimeout(renderTimer);
  }
});
</script>

<style scoped>
.markdown-content {
  line-height: 1.7;
  color: inherit; /* inherit from parent bubble to avoid mobile theme overrides */
  -webkit-text-fill-color: currentColor; /* iOS/Safari: respect current text color */
  font-size: 15px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Typography */
.markdown-content :deep(.paragraph) {
  margin: 0 0 16px 0;
  line-height: 1.7;
}

.markdown-content :deep(.heading-1) {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 24px 0 16px 0;
  color: #111827;
  line-height: 1.3;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.markdown-content :deep(.heading-2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 20px 0 12px 0;
  color: #111827;
  line-height: 1.4;
}

.markdown-content :deep(.heading-3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 16px 0 8px 0;
  color: #111827;
  line-height: 1.4;
}

.markdown-content :deep(.text-bold) {
  font-weight: 600;
  color: #111827;
}

.markdown-content :deep(.text-italic) {
  font-style: italic;
  color: #6b7280;
}

/* Lists */
.markdown-content :deep(.unordered-list),
.markdown-content :deep(.ordered-list) {
  margin: 16px 0;
  padding-left: 24px;
}

.markdown-content :deep(.list-item),
.markdown-content :deep(.ordered-item) {
  margin: 8px 0;
  line-height: 1.6;
}

.markdown-content :deep(.list-item) {
  list-style-type: disc;
}

.markdown-content :deep(.ordered-item) {
  list-style-type: decimal;
}

/* Code blocks */
.markdown-content :deep(.code-block-wrapper) {
  margin: 16px 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.markdown-content :deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 500;
}

.markdown-content :deep(.code-language) {
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.markdown-content :deep(.copy-btn) {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-content :deep(.copy-btn:hover) {
  background: #2563eb;
  transform: translateY(-1px);
}

.markdown-content :deep(.code-block) {
  background: #f8fafc;
  padding: 16px;
  margin: 0;
  overflow-x: auto;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
}

.markdown-content :deep(.code-block code) {
  background: transparent;
  padding: 0;
  font-size: inherit;
  color: inherit;
}

.markdown-content :deep(.inline-code) {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 2px 6px;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
  font-size: 13px;
  color: #dc2626;
  font-weight: 500;
}

/* Tables */
.markdown-content :deep(.table-wrapper) {
  margin: 16px 0;
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.markdown-content :deep(.data-table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.markdown-content :deep(.data-table th) {
  background: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-content :deep(.data-table td) {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
}

.markdown-content :deep(.data-table tr:last-child td) {
  border-bottom: none;
}

/* Links */
.markdown-content :deep(.external-link) {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
}

.markdown-content :deep(.external-link:hover) {
  color: #1d4ed8;
  border-bottom-color: #3b82f6;
}

/* Blockquotes */
.markdown-content :deep(.quote-block) {
  margin: 16px 0;
  padding: 16px 20px;
  background: #f8fafc;
  border-left: 4px solid #3b82f6;
  border-radius: 0 8px 8px 0;
  color: #4b5563;
  font-style: italic;
}

/* Dividers */
.markdown-content :deep(.divider) {
  border: none;
  height: 1px;
  background: #e5e7eb;
  margin: 24px 0;
}

/* Line breaks */
.markdown-content :deep(.line-break) {
  display: block;
  margin: 4px 0;
}

/* Streaming cursor animation */
.markdown-content.streaming::after {
  content: "▊";
  color: #3b82f6;
  animation: blink 1s infinite;
  font-weight: 100;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* removed dark mode media overrides */

/* Responsive design */
@media (max-width: 768px) {
  .markdown-content {
    font-size: 14px;
  }

  .markdown-content :deep(.heading-1) {
    font-size: 1.5rem;
  }

  .markdown-content :deep(.heading-2) {
    font-size: 1.25rem;
  }

  .markdown-content :deep(.heading-3) {
    font-size: 1.125rem;
  }

  .markdown-content :deep(.code-block) {
    font-size: 13px;
    padding: 12px;
  }

  .markdown-content :deep(.data-table th),
  .markdown-content :deep(.data-table td) {
    padding: 8px 12px;
    font-size: 13px;
  }
}
</style>
