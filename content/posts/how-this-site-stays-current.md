---
id: post-how-this-site-stays-current
slug: how-this-site-stays-current
title: How this site stays current, and what it will never do
description: Where updates come from, what is published automatically, and what always waits for me.
status: proposed
visibility: public
kind: reflection
publishedAt: "2026-10-29T12:00:00Z"
tags: [site, process]
projectIds: []
provenance:
  origin: manual
---
This site is a folder of files in a Git repository. Projects, short updates, longer writing and the Now page are each a file with a fixed shape, and a build refuses to publish a file that doesn't match it.

## Where updates come from

There are two ways a short update gets written. I write one by hand, from my phone if I need to. Or a coding agent working in one of my public repositories leaves a structured note when it finishes something that matters. A scheduled job collects those notes, along with releases and merged pull requests from repositories I've listed.

Everything collected starts as a draft. I read it, fix the wording and publish it, or I don't.

## What is published without me

Only one thing, and only if I've switched it on for that project: a release note that is explicitly marked public-safe, where the release itself exists as proof it shipped. Private repositories are never read for public text. Essays are always mine.

## What it will never do

It won't turn ordinary agent attempts into posts, claim something shipped when it didn't, or put words in my mouth. Dates on updates are the date the work happened, which can differ from the date I posted it. The Now page changes only when I review it.

If you want to see how any of this works, the code is in the open. Questions are welcome on the [connect page](/connect).
