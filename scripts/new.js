#!/usr/bin/env node

import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/new.js <post-title>");
  console.error('Example: node scripts/new.js "My New Blog Post"');
  process.exit(1);
}

const title = args.join(" ");
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
  .replace(/\s+/g, "-") // Replace spaces with hyphens
  .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
  .trim("-"); // Remove leading/trailing hyphens

// Generate current date in ISO format with timezone
const now = new Date();
const pubDate = now.toISOString().replace("Z", "+08:00");

// Create the blog post content with frontmatter
const content = `---
title: ${title}
description: ""
pubDate: ${pubDate}
draft: true
categories: []
tags: []
---

## Introduction

Write your blog post content here...

`;

// Define the file path
const blogDir = join(__dirname, "..", "src", "content", "blog");
const filePath = join(blogDir, `${slug}.md`);

// Check if file already exists
if (existsSync(filePath)) {
  console.error(`Error: File already exists: ${filePath}`);
  process.exit(1);
}

try {
  writeFileSync(filePath, content, "utf8");
  console.log(`✅ Successfully created new blog post: ${filePath}`);
  console.log(`📝 Title: ${title}`);
  console.log(`🔗 Slug: ${slug}`);
  console.log(`📅 Date: ${pubDate}`);
} catch (error) {
  console.error(`Error creating blog post: ${error.message}`);
  process.exit(1);
}
