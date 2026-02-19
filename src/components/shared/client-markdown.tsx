"use client";

import { useEffect, useState, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";
import type { Highlighter } from "shiki";

/** Convert @username in markdown source to links (skip inside code fences/backticks) */
function linkifyMentionsMd(md: string): string {
  // Split out code fences and inline code so we don't touch them
  const parts = md.split(/(```[\s\S]*?```|`[^`]+`)/g);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(
      /(^|[^/\w[\]])@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?)\b/g,
      (_m, prefix, username) =>
        `${prefix}[@${username}](/users/${username})`
    );
  }
  return parts.join("");
}

// Singleton highlighter for client-side code highlighting
let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

function getClientHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) return Promise.resolve(highlighterInstance);
  if (!highlighterPromise) {
    highlighterPromise = import("shiki")
      .then(({ createHighlighter }) =>
        createHighlighter({
          themes: ["vitesse-light", "vitesse-black"],
          langs: [],
        })
      )
      .then((h) => {
        highlighterInstance = h;
        return h;
      });
  }
  return highlighterPromise;
}

const HighlightedCodeBlock = memo(function HighlightedCodeBlock({
  code,
  lang,
}: {
  code: string;
  lang: string;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const highlighter = await getClientHighlighter();
        const loaded = highlighter.getLoadedLanguages();
        let effectiveLang = lang;
        if (!loaded.includes(lang as any)) {
          try {
            await highlighter.loadLanguage(lang as any);
          } catch {
            effectiveLang = "text";
            if (!loaded.includes("text" as any)) {
              try {
                await highlighter.loadLanguage("text" as any);
              } catch {}
            }
          }
        }
        if (!cancelled) {
          const result = highlighter.codeToHtml(code, {
            lang: effectiveLang,
            themes: { light: "vitesse-light", dark: "vitesse-black" },
            defaultColor: false,
          });
          setHtml(result);
        }
      } catch {
        // silently fall back to plain text
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (html) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return (
    <pre>
      <code>{code}</code>
    </pre>
  );
});

export function ClientMarkdown({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("ghmd ghmd-sm", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className: codeClassName, children, ref, ...rest }) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            if (match) {
              return (
                <HighlightedCodeBlock
                  code={String(children).replace(/\n$/, "")}
                  lang={match[1]}
                />
              );
            }
            return (
              <code className={codeClassName} {...rest}>
                {children}
              </code>
            );
          },
          pre({ children, node }) {
            // Only strip pre when child has a language class (HighlightedCodeBlock handles its own wrapper)
            const codeChild = (node?.children as any[])?.find(
              (c) => c.tagName === "code"
            );
            const hasLang = codeChild?.properties?.className?.some?.(
              (c: string) => typeof c === "string" && c.startsWith("language-")
            );
            if (hasLang) return <>{children}</>;
            return <pre>{children}</pre>;
          },
          a({ href, children, ...rest }) {
            if (href?.startsWith("/users/")) {
              return (
                <a href={href} className="ghmd-mention" {...rest}>
                  <svg className="ghmd-mention-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M10.561 8.073a6 6 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6 6 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" /></svg>
                  {children}
                </a>
              );
            }
            return <a href={href} {...rest}>{children}</a>;
          },
        }}
      >
        {linkifyMentionsMd(content)}
      </ReactMarkdown>
    </div>
  );
}
